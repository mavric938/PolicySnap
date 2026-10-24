import { loginAsGuest } from '@/lib/auth/authService';
import { errorResponse, GUEST_TTL_SECONDS, sessionResponse } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    return await sessionResponse(await loginAsGuest(String(name || '')), GUEST_TTL_SECONDS);
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal masuk sebagai tamu');
  }
}
