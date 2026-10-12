import { NextResponse } from 'next/server';
import { getProfile, updateProfile } from '@/lib/profileService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user-001';

    const profile = await getProfile(userId);
    return NextResponse.json(profile, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Gagal membaca profil pengguna' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId = 'user-001', name, avatar, catAvatar, totalXP, evaluationsCount } = body;

    const result = await updateProfile(userId, {
      name,
      avatar,
      catAvatar,
      totalXP,
      evaluationsCount,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Gagal memperbarui profil' }, { status: 400 });
    }

    return NextResponse.json(result.profile);
  } catch (error: unknown) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Gagal memperbarui profil pengguna' },
      { status: 500 }
    );
  }
}
