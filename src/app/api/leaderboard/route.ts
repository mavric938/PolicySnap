import { NextResponse } from 'next/server';
import { getAllProfiles } from '@/lib/profileService';

export async function GET() {
  try {
    const profiles = await getAllProfiles();
    return NextResponse.json(profiles, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json({ error: 'Gagal memuat data leaderboard' }, { status: 500 });
  }
}
