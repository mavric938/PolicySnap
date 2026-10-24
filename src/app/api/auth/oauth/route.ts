import { loginWithSupabaseToken } from '@/lib/auth/authService';
import { errorResponse, sessionResponse } from '@/lib/auth/session';

/** Tukar access token Supabase (Google OAuth) menjadi cookie sesi aplikasi. */
export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json();
    return await sessionResponse(await loginWithSupabaseToken(String(accessToken || '')));
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal memverifikasi login Google');
  }
}
