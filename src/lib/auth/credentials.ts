import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { readLocalJson, writeLocalJson } from '@/lib/localStore';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const LOCAL_FILE = 'credentials.json'; // di-gitignore, hanya untuk mode lokal
const KEY_LENGTH = 64;

export interface StoredCredential {
  email: string;
  user_id: string;
  password_hash: string;
}

// ===== Password hashing (scrypt, format: scrypt$<salt>$<hash>) =====

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length);
  return timingSafeEqual(expected, actual);
}

/** Bandingkan dua string secara constant-time (untuk password admin dari env). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// ===== Credential store =====

export async function findCredential(email: string): Promise<StoredCredential | null> {
  const normalized = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseClient()
      .from('auth_credentials')
      .select('email, user_id, password_hash')
      .eq('email', normalized)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  const list = await readLocalJson<StoredCredential>(LOCAL_FILE);
  return list.find((c) => c.email === normalized) || null;
}

export async function saveCredential(credential: StoredCredential): Promise<void> {
  const record = { ...credential, email: credential.email.trim().toLowerCase() };

  if (isSupabaseConfigured()) {
    const { error } = await getSupabaseClient().from('auth_credentials').upsert(record);
    if (error) throw error;
    return;
  }

  const list = await readLocalJson<StoredCredential>(LOCAL_FILE);
  await writeLocalJson(LOCAL_FILE, [...list.filter((c) => c.email !== record.email), record]);
}
