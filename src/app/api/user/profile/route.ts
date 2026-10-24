import { NextResponse } from 'next/server';
import { getProfile, toPublicProfile, updateProfile } from '@/lib/profileService';
import { errorResponse, getSessionUser, requireUser, ValidationError } from '@/lib/auth/session';
import { optionalString } from '@/lib/validation';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

/** Profil sendiri (default) atau profil publik user lain via ?userId= (tanpa email). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getSessionUser();
    const userId = searchParams.get('userId') || session?.id;

    if (!userId) throw new ValidationError('userId wajib disertakan');

    const profile = await getProfile(userId);
    const isSelf = session?.id === userId;
    return NextResponse.json(isSelf ? profile : toPublicProfile(profile), { headers: NO_STORE });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal membaca profil pengguna');
  }
}

/** Hanya nama, avatar, dan kucing yang bisa diubah. XP/level dikelola server. */
export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const profile = await updateProfile(user.id, {
      name: optionalString(body.name, 'Nama', 60) || undefined,
      avatar: body.avatar !== undefined ? optionalString(body.avatar, 'Avatar', 500) : undefined,
      catAvatar: body.catAvatar && typeof body.catAvatar === 'object' ? body.catAvatar : undefined,
    });

    return NextResponse.json(profile);
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal memperbarui profil pengguna');
  }
}
