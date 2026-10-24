import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let warnedMissingServiceKey = false;

function getServerCredentials(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  // Server WAJIB memakai service role key: semua penulisan data lewat API route,
  // sedangkan RLS menutup akses tulis untuk anon key.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !url.startsWith('http') || url.includes('your-project')) return null;

  if (!key || key.includes('your-service-role')) {
    if (!warnedMissingServiceKey) {
      warnedMissingServiceKey = true;
      console.error('[supabase] SUPABASE_SERVICE_ROLE_KEY belum di-set — server memakai penyimpanan JSON lokal.');
    }
    return null;
  }

  return { url, key };
}

/**
 * True bila server memakai Supabase sebagai satu-satunya sumber data.
 * False → mode lokal (file JSON di src/data), khusus development.
 */
export function isSupabaseConfigured(): boolean {
  return getServerCredentials() !== null;
}

/**
 * Supabase client (service role) untuk server. Throw bila belum dikonfigurasi,
 * jadi pemanggil cukup memeriksa isSupabaseConfigured() terlebih dahulu.
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const creds = getServerCredentials();
  if (!creds) throw new Error('Supabase belum dikonfigurasi di server.');

  supabaseInstance = createClient(creds.url, creds.key, {
    auth: { persistSession: false },
  });
  return supabaseInstance;
}
