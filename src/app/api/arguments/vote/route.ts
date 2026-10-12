import { NextResponse } from 'next/server';
import { voteArgument } from '@/lib/argumentService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { argumentId, userId = 'user-001', voteType } = body;

    if (!argumentId || !voteType || (voteType !== 'up' && voteType !== 'down')) {
      return NextResponse.json(
        { error: 'argumentId dan voteType (up/down) wajib disertakan' },
        { status: 400 }
      );
    }

    const result = await voteArgument({
      argumentId,
      userId,
      voteType,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error voting on argument:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Gagal memproses vote' },
      { status: 500 }
    );
  }
}
