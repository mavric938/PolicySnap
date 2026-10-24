import { NextResponse } from 'next/server';
import { destroySession, getSessionUser, toClientUser } from '@/lib/auth/session';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** Sesi aktif menurut server (sumber kebenaran untuk role & identitas). */
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json(
    user ? { user: toClientUser(user), expiresAt: user.exp } : { user: null },
    { headers: NO_STORE }
  );
}

/** Logout: hapus cookie sesi. */
export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true }, { headers: NO_STORE });
}
