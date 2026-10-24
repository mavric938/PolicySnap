import { NextResponse } from 'next/server';
import { getAllProfiles, toPublicProfile } from '@/lib/profileService';
import { errorResponse } from '@/lib/auth/session';

export async function GET() {
  try {
    const profiles = (await getAllProfiles()).map(toPublicProfile);
    return NextResponse.json(profiles, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal memuat data leaderboard');
  }
}
