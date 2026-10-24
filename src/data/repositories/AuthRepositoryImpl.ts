import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { User, AuthSession, AuthResult } from '@/domain/entities/auth';
import { SupabaseAuthDataSource, supabaseAuthDataSource } from '../datasources/supabaseAuthDataSource';

const LOCAL_SESSION_KEY = 'policysnap_active_session';
const AUTH_EVENT = 'policysnap_auth_change';

interface ServerAuthResponse {
  user: User | null;
  expiresAt?: number;
  catAvatar?: unknown;
  error?: string;
}

/**
 * Authentication Repository Implementation
 * Layer: DATA
 *
 * Implements IAuthRepository from the Domain layer.
 * Server (/api/auth/*) adalah sumber kebenaran sesi lewat cookie HttpOnly.
 * localStorage hanya cache tampilan (nama, avatar, kucing) dan cadangan saat offline.
 */
export class AuthRepositoryImpl implements IAuthRepository {
  private sessionRequest: Promise<AuthSession | null> | null = null;

  constructor(private readonly dataSource: SupabaseAuthDataSource = supabaseAuthDataSource) {}

  async isGoogleOAuthAvailable(): Promise<boolean> {
    return await this.dataSource.isGoogleOAuthAvailable();
  }

  async signInWithGoogle(options?: { redirectTo?: string }): Promise<AuthResult> {
    const res = await this.dataSource.signInWithGoogle(options);
    if (res.error) {
      return {
        success: false,
        error: res.error,
        providerNotEnabled: res.providerNotEnabled,
      };
    }

    if (res.url) {
      if (typeof window !== 'undefined') {
        window.location.href = res.url;
      }
      return {
        success: true,
        redirectUrl: res.url,
      };
    }

    const sbSession = await this.dataSource.getCurrentSession();
    if (sbSession) {
      return this.postAuth('/api/auth/oauth', { accessToken: sbSession.access_token });
    }

    return {
      success: true,
    };
  }

  async signInWithDevAccount(user: { email: string; name: string; avatarUrl?: string }): Promise<AuthResult> {
    return this.postAuth('/api/auth/dev', user);
  }

  async registerWithEmail(data: { name: string; email: string; password?: string }): Promise<AuthResult> {
    return this.postAuth('/api/auth/register', data);
  }

  async signInWithEmail(email: string, password?: string): Promise<AuthResult> {
    return this.postAuth('/api/auth/login', { email, password });
  }

  async signInAsGuest(customName?: string): Promise<AuthResult> {
    return this.postAuth('/api/auth/guest', { name: customName || 'Warga Tamu' });
  }

  async signOut(): Promise<void> {
    await this.dataSource.signOut();
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (err) {
      console.warn('Server sign out gagal (offline?):', err);
    }
    this.clearLocalSession();
    this.emit(null);
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getCurrentSession();
    return session?.user || null;
  }

  /**
   * Sesi aktif menurut server. Permintaan paralel digabung menjadi satu request.
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    if (!this.sessionRequest) {
      this.sessionRequest = this.fetchServerSession().finally(() => {
        this.sessionRequest = null;
      });
    }
    return this.sessionRequest;
  }

  onAuthStateChange(callback: (user: User | null, session: AuthSession | null) => void): () => void {
    const localListener = (e: Event) => {
      const newSession = (e as CustomEvent<AuthSession | null>).detail;
      callback(newSession?.user || null, newSession);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_EVENT, localListener);
    }

    // Login Google selesai → tukar token Supabase menjadi sesi server (hasilnya memicu AUTH_EVENT)
    const unsubSupabase = this.dataSource.onAuthStateChange((event, sbSession) => {
      if (event === 'SIGNED_IN' && sbSession) {
        this.postAuth('/api/auth/oauth', { accessToken: sbSession.access_token }).catch(console.warn);
      }
    });

    return () => {
      unsubSupabase();
      if (typeof window !== 'undefined') {
        window.removeEventListener(AUTH_EVENT, localListener);
      }
    };
  }

  // ===== Private helpers =====

  private async fetchServerSession(): Promise<AuthSession | null> {
    let data: ServerAuthResponse;
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      // Offline (PWA): pakai cache lokal agar UI tetap tampil; API tetap butuh cookie valid.
      console.warn('Tidak dapat memeriksa sesi server, memakai cache lokal:', err);
      return this.readLocalSession();
    }

    if (data.user) {
      const session: AuthSession = { user: data.user, expiresAt: data.expiresAt };
      this.persistLocalSession(session);
      return session;
    }

    // Server tidak punya sesi. Bila baru kembali dari Google OAuth, tukar tokennya.
    const sbSession = await this.dataSource.getCurrentSession();
    if (sbSession) {
      const result = await this.postAuth('/api/auth/oauth', { accessToken: sbSession.access_token });
      if (result.success && result.session) return result.session;
    }

    this.clearLocalSession();
    return null;
  }

  private async postAuth(url: string, body: unknown): Promise<AuthResult> {
    let data: ServerAuthResponse;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      data = await res.json();
      if (!res.ok || !data.user) {
        return { success: false, error: data.error || 'Autentikasi gagal.' };
      }
    } catch {
      return { success: false, error: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.' };
    }

    const session: AuthSession = { user: data.user, expiresAt: data.expiresAt };
    this.persistLocalSession(session, data.catAvatar);
    this.emit(session);
    return { success: true, user: session.user, session };
  }

  private emit(session: AuthSession | null): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: session }));
    }
  }

  private readLocalSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      window.localStorage.removeItem(LOCAL_SESSION_KEY);
      return null;
    }
  }

  /** Cache tampilan di localStorage (dibaca halaman-halaman untuk nama/avatar/kucing). */
  private persistLocalSession(session: AuthSession, catAvatar?: unknown): void {
    if (typeof window === 'undefined') return;
    const { user } = session;
    const ls = window.localStorage;

    ls.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    ls.setItem('policysnap_user_logged_in', 'true');
    ls.setItem('policysnap_user_id', user.id);
    ls.setItem('policysnap_user_name', user.name);
    ls.setItem('policysnap_user_email', user.email);
    if (user.avatarUrl) ls.setItem('policysnap_user_avatar', user.avatarUrl);
    if (catAvatar) ls.setItem('policysnap_cat_profile', JSON.stringify(catAvatar));

    if (user.provider === 'guest') ls.setItem('policysnap_is_guest', 'true');
    else ls.removeItem('policysnap_is_guest');

    // Hanya untuk tampilan (kostum khusus admin); otorisasi tetap di server.
    if (user.role === 'admin') ls.setItem('policysnap_is_admin', 'true');
    else ls.removeItem('policysnap_is_admin');
  }

  private clearLocalSession(): void {
    if (typeof window === 'undefined') return;
    const ls = window.localStorage;
    ls.removeItem(LOCAL_SESSION_KEY);
    ls.removeItem('policysnap_user_logged_in');
    ls.removeItem('policysnap_is_guest');
    ls.removeItem('policysnap_is_admin');
  }
}

// Export singleton repository
export const authRepository = new AuthRepositoryImpl();
