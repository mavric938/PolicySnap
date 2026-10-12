import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { User, AuthSession, AuthResult } from '@/domain/entities/auth';
import { SupabaseAuthDataSource, supabaseAuthDataSource } from '../datasources/supabaseAuthDataSource';
import { AuthMapper } from '../mappers/authMapper';

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@policysnap.id',
  username: 'admin',
  password: 'AdminSnap2026!',
  name: 'Administrator Kebijakan',
};

const LOCAL_SESSION_KEY = 'policysnap_active_session';

/**
 * Authentication Repository Implementation
 * Layer: DATA
 * 
 * Implements IAuthRepository from the Domain layer.
 * Bridges Supabase Auth, Offline Cache Storage, and Domain Entities.
 */
export class AuthRepositoryImpl implements IAuthRepository {
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

    const currentSession = await this.getCurrentSession();
    if (currentSession) {
      await this.syncUserProfile(currentSession.user);
      return {
        success: true,
        user: currentSession.user,
        session: currentSession,
      };
    }

    return {
      success: true,
    };
  }

  async signInWithDevAccount(user: { email: string; name: string; avatarUrl?: string }): Promise<AuthResult> {
    const { user: sbUser, session: sbSession } = await this.dataSource.signInWithDevAccount(user);
    const domainUser = AuthMapper.toDomainUser(sbUser);
    const domainSession = AuthMapper.toDomainSession(sbSession);

    await this.syncUserProfile(domainUser);

    return {
      success: true,
      user: domainUser,
      session: domainSession,
    };
  }

  async registerWithEmail(data: { name: string; email: string; password?: string }): Promise<AuthResult> {
    const userId = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const domainUser: User = {
      id: userId,
      name: data.name,
      email: data.email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`,
      provider: 'email',
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    const domainSession: AuthSession = {
      user: domainUser,
      accessToken: 'token-email-' + Date.now(),
      expiresAt: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(domainSession));
      window.localStorage.setItem('policysnap_user_logged_in', 'true');
      window.localStorage.removeItem('policysnap_is_guest');
      window.localStorage.removeItem('policysnap_is_admin');
      window.dispatchEvent(new CustomEvent('policysnap_auth_change', { detail: domainSession }));
    }

    await this.syncUserProfile(domainUser);

    return {
      success: true,
      user: domainUser,
      session: domainSession,
    };
  }

  async signInWithEmail(email: string, password?: string): Promise<AuthResult> {
    const cleanEmail = email.trim().toLowerCase();
    const isAdminEmail =
      cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase() ||
      cleanEmail === DEFAULT_ADMIN_CREDENTIALS.username.toLowerCase();

    // Khusus Login Administrator
    if (isAdminEmail) {
      if (!password || password !== DEFAULT_ADMIN_CREDENTIALS.password) {
        return {
          success: false,
          error: 'Password administrator salah. Silakan periksa kembali.',
        };
      }

      const adminUser: User = {
        id: 'admin-001',
        name: DEFAULT_ADMIN_CREDENTIALS.name,
        email: DEFAULT_ADMIN_CREDENTIALS.email,
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminPolicySnap',
        provider: 'email',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      const adminSession: AuthSession = {
        user: adminUser,
        accessToken: 'admin-token-' + Date.now(),
        expiresAt: Math.floor(Date.now() / 1000) + 86400 * 30,
      };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(adminSession));
        window.localStorage.setItem('policysnap_user_logged_in', 'true');
        window.localStorage.setItem('policysnap_is_admin', 'true');
        window.localStorage.removeItem('policysnap_is_guest');
        window.dispatchEvent(new CustomEvent('policysnap_auth_change', { detail: adminSession }));
      }

      await this.syncUserProfile(adminUser);

      return {
        success: true,
        user: adminUser,
        session: adminSession,
      };
    }

    const existing = await this.getCurrentUser();
    if (existing && existing.email.toLowerCase() === email.toLowerCase()) {
      const currentSession = await this.getCurrentSession();
      return {
        success: true,
        user: existing,
        session: currentSession || undefined,
      };
    }

    // Login with new or recognized email
    const userId = 'user-' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36);
    const userName = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

    const domainUser: User = {
      id: userId,
      name: formattedName,
      email: email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      provider: 'email',
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    const domainSession: AuthSession = {
      user: domainUser,
      accessToken: 'token-email-' + Date.now(),
      expiresAt: Math.floor(Date.now() / 1000) + 86400 * 30,
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(domainSession));
      window.localStorage.setItem('policysnap_user_logged_in', 'true');
      window.localStorage.removeItem('policysnap_is_guest');
      window.localStorage.removeItem('policysnap_is_admin');
      window.dispatchEvent(new CustomEvent('policysnap_auth_change', { detail: domainSession }));
    }

    await this.syncUserProfile(domainUser);

    return {
      success: true,
      user: domainUser,
      session: domainSession,
    };
  }

  async signInAsGuest(customName?: string): Promise<AuthResult> {
    const guestId = 'guest-' + Date.now().toString(36);
    const domainUser: User = {
      id: guestId,
      name: customName || 'Warga Tamu (Offline)',
      email: 'tamu@policysnap.local',
      avatarUrl: '',
      provider: 'guest',
      createdAt: new Date().toISOString(),
    };

    const domainSession: AuthSession = {
      user: domainUser,
      accessToken: 'guest-offline-token-' + Date.now(),
      expiresAt: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days cache
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(domainSession));
      window.localStorage.setItem('policysnap_is_guest', 'true');
      window.localStorage.setItem('policysnap_user_logged_in', 'true');
      window.dispatchEvent(new CustomEvent('policysnap_auth_change', { detail: domainSession }));
    }

    await this.syncUserProfile(domainUser);

    return {
      success: true,
      user: domainUser,
      session: domainSession,
    };
  }

  async signOut(): Promise<void> {
    await this.dataSource.signOut();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_SESSION_KEY);
      window.localStorage.removeItem('policysnap_user_logged_in');
      window.localStorage.removeItem('policysnap_is_guest');
      window.localStorage.removeItem('policysnap_is_admin');
      window.dispatchEvent(new CustomEvent('policysnap_auth_change', { detail: null }));
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getCurrentSession();
    return session?.user || null;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    // 1. Check local session cache (register, email, guest, dev)
    if (typeof window !== 'undefined') {
      const localRaw = window.localStorage.getItem(LOCAL_SESSION_KEY);
      if (localRaw) {
        try {
          return JSON.parse(localRaw) as AuthSession;
        } catch {
          window.localStorage.removeItem(LOCAL_SESSION_KEY);
        }
      }
    }

    // 2. Check Supabase OAuth session
    const sbSession = await this.dataSource.getCurrentSession();
    if (sbSession) {
      return AuthMapper.toDomainSession(sbSession);
    }

    return null;
  }

  onAuthStateChange(callback: (user: User | null, session: AuthSession | null) => void): () => void {
    const localListener = (e: Event) => {
      const customEvent = e as CustomEvent<AuthSession | null>;
      const newSession = customEvent.detail;
      callback(newSession?.user || null, newSession);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('policysnap_auth_change', localListener);
    }

    const unsubSupabase = this.dataSource.onAuthStateChange((_event, sbSession) => {
      if (sbSession) {
        const domainSession = AuthMapper.toDomainSession(sbSession);
        this.syncUserProfile(domainSession.user).catch(console.warn);
        callback(domainSession.user, domainSession);
      }
    });

    return () => {
      unsubSupabase();
      if (typeof window !== 'undefined') {
        window.removeEventListener('policysnap_auth_change', localListener);
      }
    };
  }

  /**
   * Helper: Ensure authenticated user has a record in the profiles table and localStorage
   */
  private async syncUserProfile(user: User): Promise<void> {
    try {
      const client = this.dataSource.getClient();
      if (client) {
        const { data: existing } = await client
          .from('profiles')
          .select('id, name, total_xp, cat_avatar')
          .eq('id', user.id)
          .maybeSingle();

        if (!existing) {
          await client.from('profiles').upsert({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatarUrl || '',
            total_xp: 85,
            rank_level: 'netizen-kritis',
            evaluations_count: 0,
            created_at: new Date().toISOString(),
          });
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('policysnap_user_id', user.id);
        localStorage.setItem('policysnap_user_name', user.name);
        localStorage.setItem('policysnap_user_email', user.email);
        if (user.avatarUrl) {
          localStorage.setItem('policysnap_user_avatar', user.avatarUrl);
        }
      }
    } catch (err) {
      console.warn('Could not sync user profile in database:', err);
    }
  }
}

// Export singleton repository
export const authRepository = new AuthRepositoryImpl();
