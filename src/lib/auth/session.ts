import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Server-side session (Layer: SERVER ONLY)
 *
 * Identitas pengguna disimpan di cookie HttpOnly yang ditandatangani HMAC-SHA256.
 * Semua API route WAJIB mengambil userId/role dari sini, bukan dari body/query request.
 */

export type SessionRole = 'admin' | 'user';
export type SessionProvider = 'google' | 'email' | 'guest';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: SessionProvider;
  role: SessionRole;
}

interface SessionPayload extends SessionUser {
  exp: number; // unix seconds
}

export const SESSION_COOKIE = 'ps_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 hari
export const GUEST_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

// Disimpan di globalThis agar tidak berganti setiap HMR reload modul saat development.
const globalForAuth = globalThis as unknown as { __psDevAuthSecret?: string };

function getSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET wajib di-set (minimal 32 karakter) di environment production.');
  }

  // Development: secret acak per proses. Sesi akan hilang saat dev server restart.
  if (!globalForAuth.__psDevAuthSecret) {
    globalForAuth.__psDevAuthSecret = randomBytes(32).toString('hex');
    console.warn('[auth] AUTH_SECRET belum di-set — memakai secret sementara (khusus development).');
  }
  return globalForAuth.__psDevAuthSecret;
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

function encodeToken(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function decodeToken(token: string): SessionPayload | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as SessionPayload;
    if (!payload.id || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Buat sesi baru dan pasang cookie pada response. */
export async function createSession(user: SessionUser, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<number> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeToken({ ...user, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ttlSeconds,
  });
  return exp;
}

/** Bentuk user yang dikirim ke client (cocok dengan domain entity `User` di sisi client). */
export function toClientUser(user: SessionUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    provider: user.provider,
    role: user.role,
  };
}

/** Buat cookie sesi lalu kembalikan response standar endpoint login. */
export async function sessionResponse(
  outcome: { user: SessionUser; profile: { catAvatar?: unknown } },
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<NextResponse> {
  const expiresAt = await createSession(outcome.user, ttlSeconds);
  return NextResponse.json({
    user: toClientUser(outcome.user),
    expiresAt,
    catAvatar: outcome.profile.catAvatar ?? null,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<(SessionUser & { exp: number }) | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? decodeToken(token) : null;
}

// ===== Guards untuk API route =====

/** Input request tidak valid → 400. */
export class ValidationError extends Error {}

export class AuthError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError(401, 'Sesi tidak valid. Silakan masuk kembali.');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'admin') throw new AuthError(403, 'Akses khusus administrator.');
  return user;
}

/** Ubah error menjadi response JSON; AuthError dipetakan ke 401/403. */
export function errorResponse(error: unknown, fallbackMessage: string): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(fallbackMessage, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
