import { loginWithEmail } from '@/lib/auth/authService';
import { errorResponse, sessionResponse } from '@/lib/auth/session';

/** Login email + password. Identifier admin (email/username dari env) diverifikasi di server. */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    return await sessionResponse(await loginWithEmail(String(email || ''), String(password || '')));
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal masuk akun');
  }
}
