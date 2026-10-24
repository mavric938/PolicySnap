import { NextResponse } from 'next/server';
import { getArgumentsByIssue, createArgument } from '@/lib/argumentService';
import { errorResponse, getSessionUser, requireUser } from '@/lib/auth/session';
import { requireString } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId') || searchParams.get('issue') || 'issue-001';
    const session = await getSessionUser();

    const args = await getArgumentsByIssue(issueId, session?.id ?? null);
    return NextResponse.json(args, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal membaca argumen publik');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const argument = await createArgument({
      userId: user.id,
      issueId: requireString(body.issueId, 'issueId', { max: 100 }),
      stance: requireString(body.stance, 'Pendirian', { max: 60 }),
      comment: requireString(body.comment, 'Komentar', { max: 1000 }),
    });

    return NextResponse.json(argument, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal menambahkan argumen');
  }
}
