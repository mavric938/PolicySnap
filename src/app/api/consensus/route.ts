import { NextResponse } from 'next/server';
import { getConsensusData } from '@/lib/evaluationService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId') || searchParams.get('issue') || 'issue-001';
    const userId = searchParams.get('userId') || 'user-001';

    const consensus = await getConsensusData(issueId, userId);

    return NextResponse.json(consensus, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching consensus data:', error);
    return NextResponse.json({ error: 'Gagal menghitung konsensus komunitas' }, { status: 500 });
  }
}
