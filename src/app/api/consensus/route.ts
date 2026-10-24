import { NextResponse } from 'next/server';
import { getConsensusData } from '@/lib/evaluationService';
import { errorResponse, getSessionUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId') || searchParams.get('issue') || 'issue-001';
    const session = await getSessionUser();

    const consensus = await getConsensusData(issueId, session?.id ?? null);

    return NextResponse.json(consensus, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal menghitung konsensus komunitas');
  }
}
