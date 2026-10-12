import { NextResponse } from 'next/server';
import { getArgumentsByIssue, createArgument } from '@/lib/argumentService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId') || searchParams.get('issue') || 'issue-001';
    const userId = searchParams.get('userId') || 'user-001';

    const args = await getArgumentsByIssue(issueId, userId);
    return NextResponse.json(args, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching arguments:', error);
    return NextResponse.json({ error: 'Gagal membaca argumen publik' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { issueId, userId = 'user-001', stance, comment } = body;

    if (!issueId || !stance || !comment?.trim()) {
      return NextResponse.json(
        { error: 'issueId, stance, dan comment wajib diisi' },
        { status: 400 }
      );
    }

    const argument = await createArgument({
      userId,
      issueId,
      stance,
      comment,
    });

    return NextResponse.json(argument, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating argument:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Gagal menambahkan argumen' },
      { status: 500 }
    );
  }
}
