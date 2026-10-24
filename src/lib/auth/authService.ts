import { randomBytes } from 'crypto';
import { SessionUser, ValidationError } from './session';
import { findCredential, hashPassword, saveCredential, safeEqual, verifyPassword } from './credentials';
import { ensureProfile, findProfileIdByEmail } from '@/lib/profileService';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@/types';

/**
 * Logika autentikasi sisi server. Route handler di /api/auth/* hanya memanggil fungsi di sini
 * lalu membuat cookie sesi dari SessionUser yang dikembalikan.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const ADMIN_ID = 'admin-001';

export interface AuthOutcome {
  user: SessionUser;
  profile: User;
}

// ===== Rate limit sederhana untuk percobaan login gagal (per instance server) =====
const FAILED_LIMIT = 10;
const FAILED_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; firstAt: number }>();

function assertNotRateLimited(key: string): void {
  const entry = failedAttempts.get(key);
  if (entry && Date.now() - entry.firstAt < FAILED_WINDOW_MS && entry.count >= FAILED_LIMIT) {
    throw new ValidationError('Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.');
  }
}

function recordFailure(key: string): void {
  const entry = failedAttempts.get(key);
  if (!entry || Date.now() - entry.firstAt >= FAILED_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

// ===== Helpers =====

/** ID deterministik dari email — sama dengan format lama agar profil lama tetap tertaut. */
function legacyIdFromEmail(prefix: string, email: string): string {
  const hash = email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  return `${prefix}${Math.abs(hash).toString(36)}`;
}

function nameFromEmail(email: string): string {
  const raw = email.split('@')[0].replace(/[._-]/g, ' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Profil lama yang boleh ditautkan ke akun email. Email tamu (@policysnap.local) tidak pernah ditautkan. */
async function findLinkableProfileId(email: string): Promise<string | null> {
  if (email.endsWith('@policysnap.local')) return null;
  return findProfileIdByEmail(email);
}

function getAdminConfig() {
  return {
    email: (process.env.ADMIN_EMAIL || 'admin@policysnap.id').toLowerCase(),
    username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
  };
}

export function isAdminIdentifier(identifier: string): boolean {
  const admin = getAdminConfig();
  const clean = identifier.trim().toLowerCase();
  return clean === admin.email || clean === admin.username;
}

async function finalize(user: SessionUser): Promise<AuthOutcome> {
  const profile = await ensureProfile({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatarUrl,
  });
  // Nama yang tersimpan di profil menjadi sumber kebenaran (bisa diubah user di halaman profil)
  return { user: { ...user, name: profile.name || user.name }, profile };
}

// ===== Flows =====

export async function loginAdmin(identifier: string, password: string): Promise<AuthOutcome> {
  const admin = getAdminConfig();
  if (!admin.password) {
    throw new ValidationError('Login administrator belum dikonfigurasi (ADMIN_PASSWORD di server).');
  }

  const rateKey = `admin:${identifier.toLowerCase()}`;
  assertNotRateLimited(rateKey);
  if (!password || !safeEqual(password, admin.password)) {
    recordFailure(rateKey);
    throw new ValidationError('Password administrator salah. Silakan periksa kembali.');
  }
  failedAttempts.delete(rateKey);

  return finalize({
    id: ADMIN_ID,
    name: 'Admin',
    email: admin.email,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminPolicySnap',
    provider: 'email',
    role: 'admin',
  });
}

export async function loginWithEmail(emailInput: string, password: string): Promise<AuthOutcome> {
  if (isAdminIdentifier(emailInput)) return loginAdmin(emailInput, password);

  const email = emailInput.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) throw new ValidationError('Format email tidak valid.');
  if (!password) throw new ValidationError('Kata sandi wajib diisi.');

  const rateKey = `email:${email}`;
  assertNotRateLimited(rateKey);

  const credential = await findCredential(email);
  let userId: string;

  if (credential) {
    if (!(await verifyPassword(password, credential.password_hash))) {
      recordFailure(rateKey);
      throw new ValidationError('Email atau kata sandi salah.');
    }
    userId = credential.user_id;
  } else {
    // Akun lama (dibuat sebelum password disimpan di server) atau email baru:
    // tautkan ke profil yang sudah ada bila ada, lalu simpan password ini.
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
    }
    userId = (await findLinkableProfileId(email)) || legacyIdFromEmail('user-', email);
    await saveCredential({ email, user_id: userId, password_hash: await hashPassword(password) });
  }
  failedAttempts.delete(rateKey);

  return finalize({
    id: userId,
    name: nameFromEmail(email),
    email,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
    provider: 'email',
    role: 'user',
  });
}

export async function registerWithEmail(input: { name: string; email: string; password: string }): Promise<AuthOutcome> {
  const name = input.name?.trim() || '';
  const email = input.email?.trim().toLowerCase() || '';
  const password = input.password || '';

  if (name.length < 2) throw new ValidationError('Nama minimal 2 karakter.');
  if (!EMAIL_REGEX.test(email)) throw new ValidationError('Format email tidak valid. Masukkan email resmi/aktif.');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  }
  if (isAdminIdentifier(email)) throw new ValidationError('Email ini tidak dapat didaftarkan.');

  const existing = await findCredential(email);
  if (existing) {
    // Email sudah terdaftar: hanya boleh lanjut bila password cocok (= login biasa)
    if (!(await verifyPassword(password, existing.password_hash))) {
      throw new ValidationError('Email sudah terdaftar. Silakan masuk dengan kata sandi yang benar.');
    }
    return loginWithEmail(email, password);
  }

  const userId =
    (await findLinkableProfileId(email)) ||
    `user-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`;
  await saveCredential({ email, user_id: userId, password_hash: await hashPassword(password) });

  return finalize({
    id: userId,
    name,
    email,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    provider: 'email',
    role: 'user',
  });
}

export async function loginAsGuest(nameInput: string): Promise<AuthOutcome> {
  const name = (nameInput || '').trim().slice(0, 40);
  if (name.length < 2) throw new ValidationError('Silakan masukkan nama minimal 2 karakter.');

  return finalize({
    id: `guest-${Date.now().toString(36)}${randomBytes(3).toString('hex')}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '')}@policysnap.local`,
    avatarUrl: '',
    provider: 'guest',
    role: 'user',
  });
}

/** Persona Google tiruan — hanya aktif di development atau bila ALLOW_DEV_LOGIN=true. */
export function isDevLoginAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_LOGIN === 'true';
}

export async function loginDevPersona(input: { email?: string; name?: string; avatarUrl?: string }): Promise<AuthOutcome> {
  if (!isDevLoginAllowed()) throw new ValidationError('Login persona dev dinonaktifkan di production.');

  const email = (input.email || 'warga@policysnap.id').trim().toLowerCase();
  if (isAdminIdentifier(email)) throw new ValidationError('Email ini tidak dapat dipakai.');

  return finalize({
    id: legacyIdFromEmail('google-user-', email),
    name: input.name?.trim() || 'Warga Kebijakan',
    email,
    avatarUrl: input.avatarUrl || '',
    provider: 'google',
    role: 'user',
  });
}

/** Tukar access token Supabase OAuth (Google) menjadi sesi aplikasi. Token diverifikasi ke Supabase. */
export async function loginWithSupabaseToken(accessToken: string): Promise<AuthOutcome> {
  if (!accessToken) throw new ValidationError('Access token wajib disertakan.');
  if (!isSupabaseConfigured()) throw new ValidationError('Login Google memerlukan Supabase di server.');

  const { data, error } = await getSupabaseClient().auth.getUser(accessToken);
  if (error || !data.user) throw new ValidationError('Token Google tidak valid atau kedaluwarsa.');

  const sbUser = data.user;
  const meta = sbUser.user_metadata || {};
  return finalize({
    id: sbUser.id,
    name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Pengguna Kebijakan',
    email: sbUser.email || '',
    avatarUrl: meta.avatar_url || meta.picture || '',
    provider: 'google',
    role: 'user',
  });
}
