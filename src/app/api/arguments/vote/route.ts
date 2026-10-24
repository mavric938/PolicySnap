import { NextResponse } from 'next/server';
import { voteArgument } from '@/lib/argumentService';
import { errorResponse, requireUser, ValidationError } from '@/lib/auth/session';
import { requireString } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    if (body.voteType !== 'up' && body.voteType !== 'down') {
      throw new ValidationError('voteType harus up atau down');
    }

    const result = await voteArgument({
      argumentId: requireString(body.argumentId, 'argumentId', { max: 100 }),
      userId: user.id,
      voteType: body.voteType,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal memproses vote');
  }
}
