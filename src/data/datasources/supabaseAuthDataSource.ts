import { createClient, SupabaseClient, Session as SupabaseSession } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qlgnufuaqotruawtuiax.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HdGsCrLsEO9Q5fhWi95LWw_Cqwg8dka';

// Kunci lama dari mode dev-login client-side; hanya dibersihkan saat sign out.
const LEGACY_DEV_AUTH_KEY = 'policysnap_dev_auth_session';

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
    } catch (err: unknown) {
      return { error: (err as Error)?.message || 'Gagal memulai otentikasi Google' };
    }
  }


  /**
   * Get Current Supabase OAuth Session (null bila belum login Google)
   */
  public async getCurrentSession(): Promise<SupabaseSession | null> {
    if (!this.client) return null;
    try {
      const { data } = await this.client.auth.getSession();
      return data.session;
    } catch (err) {
      console.warn('Error reading Supabase session:', err);
      return null;
    }
  }

  /**
   * Sign Out dari Supabase OAuth
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
      window.localStorage.removeItem(LEGACY_DEV_AUTH_KEY);
    }
  }

  /**
   * Watch Supabase OAuth state changes
   */
  public onAuthStateChange(
    callback: (event: string, session: SupabaseSession | null) => void
  ): () => void {
    if (!this.client) return () => {};
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => data.subscription.unsubscribe();
  }
}

// Export singleton instance
export const supabaseAuthDataSource = new SupabaseAuthDataSource();
