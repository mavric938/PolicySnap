import { loginDevPersona } from '@/lib/auth/authService';
import { errorResponse, sessionResponse } from '@/lib/auth/session';

/** Persona Google tiruan untuk pengujian (ditolak di production kecuali ALLOW_DEV_LOGIN=true). */
export async function POST(request: Request) {
  try {
    const { email, name, avatarUrl } = await request.json();
    return await sessionResponse(await loginDevPersona({ email, name, avatarUrl }));
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal masuk dengan akun dev');
  }
}
