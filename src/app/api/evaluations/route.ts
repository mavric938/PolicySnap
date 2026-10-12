import { NextResponse } from 'next/server';
import { submitEvaluation, getUserEvaluation, hasUserEvaluated } from '@/lib/evaluationService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId') || 'issue-001';
    const userId = searchParams.get('userId') || 'user-001';

    const evaluated = await hasUserEvaluated(issueId, userId);
    const userEval = await getUserEvaluation(issueId, userId);

    return NextResponse.json({
      hasEvaluated: evaluated,
      evaluation: userEval,
    });
  } catch (error: unknown) {
    console.error('Error fetching evaluation status:', error);
    return NextResponse.json({ error: 'Gagal membaca status evaluasi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { issueId, userId = 'user-001', scores, actorVotes = {}, stance, comment } = body;

    if (!issueId || !scores || !stance) {
      return NextResponse.json(
        { error: 'Parameter issueId, scores, dan stance wajib disertakan' },
        { status: 400 }
      );
    }

    const result = await submitEvaluation({
      userId,
      issueId,
      scores,
      actorVotes,
      stance,
      comment,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Error submitting evaluation:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Gagal mengirim evaluasi' },
      { status: 500 }
    );
  }
}
