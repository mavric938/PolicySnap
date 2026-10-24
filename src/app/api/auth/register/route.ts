import { registerWithEmail } from '@/lib/auth/authService';
import { errorResponse, sessionResponse } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    return await sessionResponse(await registerWithEmail({ name, email, password }));
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal membuat akun');
  }
}
