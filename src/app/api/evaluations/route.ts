import { NextResponse } from 'next/server';
import { submitEvaluation, getUserEvaluation } from '@/lib/evaluationService';
import { errorResponse, getSessionUser, requireUser } from '@/lib/auth/session';
import { optionalString, parseActorVotes, parseScores, requireString } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId') || 'issue-001';
    const session = await getSessionUser();

    // Status evaluasi selalu milik user yang sedang login (bukan userId dari query)
    const userEval = session ? await getUserEvaluation(issueId, session.id) : null;

    return NextResponse.json({
      hasEvaluated: Boolean(userEval),
      evaluation: userEval,
    });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal membaca status evaluasi');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const result = await submitEvaluation({
      userId: user.id,
      issueId: requireString(body.issueId, 'issueId', { max: 100 }),
      scores: parseScores(body.scores),
      actorVotes: parseActorVotes(body.actorVotes),
      stance: requireString(body.stance, 'Pendirian', { max: 60 }),
      comment: optionalString(body.comment, 'Komentar', 300),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal mengirim evaluasi');
  }
}
