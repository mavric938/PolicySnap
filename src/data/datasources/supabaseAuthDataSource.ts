import { createClient, SupabaseClient, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qlgnufuaqotruawtuiax.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HdGsCrLsEO9Q5fhWi95LWw_Cqwg8dka';

const DEV_AUTH_KEY = 'policysnap_dev_auth_session';

/**
 * Supabase Authentication Data Source
 * Layer: DATA
 * 
 * Handles all direct communication with Supabase Auth API and client storage.
 */
export class SupabaseAuthDataSource {
  private client: SupabaseClient | null = null;
  private isGoogleEnabledCached: boolean | null = null;

  constructor() {
    if (typeof window !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
        },
      });
    }
  }

  /**
   * Get Supabase client instance
   */
  public getClient(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Check whether Google OAuth provider is enabled in Supabase project settings
   */
  public async isGoogleOAuthAvailable(): Promise<boolean> {
    if (this.isGoogleEnabledCached !== null) {
      return this.isGoogleEnabledCached;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: SUPABASE_ANON_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        this.isGoogleEnabledCached = Boolean(data?.external?.google);
        return this.isGoogleEnabledCached;
      }
    } catch (e) {
      console.warn('Could not query Supabase auth settings:', e);
    }

    return false;
  }

  /**
   * Trigger Google OAuth login
   */
  public async signInWithGoogle(options?: { redirectTo?: string }): Promise<{
    url?: string;
    error?: string;
    providerNotEnabled?: boolean;
  }> {
    if (!this.client) {
      return { error: 'Supabase client is not initialized' };
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const redirectTo = options?.redirectTo || `${origin}/auth/callback`;

    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        const isNotEnabled = msg.includes('not enabled') || msg.includes('unsupported provider');
        return {
          error: error.message,
          providerNotEnabled: isNotEnabled,
        };
      }

      return { url: data.url };
    } catch (err: any) {
      return { error: err?.message || 'Gagal memulai otentikasi Google' };
    }
  }

  /**
   * Sign in using Dev/Test Google Persona (used when Supabase Google provider is not yet activated)
   */
  public async signInWithDevAccount(user: { email: string; name: string; avatarUrl?: string }): Promise<{
    user: SupabaseUser;
    session: SupabaseSession;
  }> {
    const userId = 'google-user-' + Math.abs(user.email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36);
    
    const mockUser: SupabaseUser = {
      id: userId,
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: {
        full_name: user.name,
        name: user.name,
        email: user.email,
        picture: user.avatarUrl || 'https://lh3.googleusercontent.com/a/default-user',
        avatar_url: user.avatarUrl || 'https://lh3.googleusercontent.com/a/default-user',
      },
      aud: 'authenticated',
      confirmation_sent_at: new Date().toISOString(),
      recovery_sent_at: '',
      email_change_sent_at: '',
      new_email: '',
      invited_at: '',
      action_link: '',
      email: user.email,
      phone: '',
      created_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      phone_confirmed_at: '',
      last_sign_in_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString(),
      identities: [],
      is_anonymous: false,
    };

    const mockSession: SupabaseSession = {
      access_token: 'dev-google-token-' + Date.now(),
      refresh_token: 'dev-google-refresh-' + Date.now(),
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser,
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEV_AUTH_KEY, JSON.stringify(mockSession));
      window.localStorage.setItem('policysnap_user_logged_in', 'true');
      window.dispatchEvent(new CustomEvent('policysnap_auth_change', { detail: mockSession }));
    }

    return { user: mockUser, session: mockSession };
  }

  /**
   * Get Current Session (Supabase or Dev fallback)
   */
  public async getCurrentSession(): Promise<SupabaseSession | null> {
    if (this.client) {
      try {
        const { data } = await this.client.auth.getSession();
        if (data.session) return data.session;
      } catch (err) {
        console.warn('Error reading Supabase session:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const devRaw = window.localStorage.getItem(DEV_AUTH_KEY);
      if (devRaw) {
        try {
          return JSON.parse(devRaw) as SupabaseSession;
        } catch {
          window.localStorage.removeItem(DEV_AUTH_KEY);
        }
      }
    }

    return null;
  }

  /**
   * Get Current Supabase User
   */
  public async getCurrentUser(): Promise<SupabaseUser | null> {
    const session = await this.getCurrentSession();
    return session?.user || null;
  }

  /**
   * Sign Out
   */
  public async signOut(): Promise<void> {
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out error:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DEV_AUTH_KEY);
      window.localStorage.removeItem('policysnap_user_logged_in');
      window.dispatchEvent(new CustomEvent('policysnap_auth_change', { detail: null }));
    }
  }

  /**
   * Watch auth state changes
   */
  public onAuthStateChange(
    callback: (event: string, session: SupabaseSession | null) => void
  ): () => void {
    let supabaseSub: { unsubscribe: () => void } | null = null;

    if (this.client) {
      const { data } = this.client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      supabaseSub = data.subscription;
    }

    // Listen to Dev auth custom events
    const devListener = (e: Event) => {
      const customEvent = e as CustomEvent<SupabaseSession | null>;
      callback(customEvent.detail ? 'SIGNED_IN' : 'SIGNED_OUT', customEvent.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('policysnap_auth_change', devListener);
    }

    return () => {
      if (supabaseSub) supabaseSub.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('policysnap_auth_change', devListener);
      }
    };
  }
}

// Export singleton instance
export const supabaseAuthDataSource = new SupabaseAuthDataSource();
