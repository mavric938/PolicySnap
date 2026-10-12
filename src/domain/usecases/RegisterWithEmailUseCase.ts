import { IAuthRepository } from '../repositories/IAuthRepository';
import { AuthResult } from '../entities/auth';

/**
 * Use Case: Register With Valid Email, Name, and Password
 * Layer: DOMAIN (Application Business Rules)
 */
export class RegisterWithEmailUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(data: { name: string; email: string; password?: string }): Promise<AuthResult> {
    const trimmedEmail = data.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return {
        success: false,
        error: 'Format email tidak valid. Gunakan format seperti nama@domain.com',
      };
    }

    if (!data.name.trim()) {
      return {
        success: false,
        error: 'Nama lengkap wajib diisi.',
      };
    }

    if (data.password && data.password.length < 6) {
      return {
        success: false,
        error: 'Kata sandi minimal 6 karakter.',
      };
    }

    return await this.authRepository.registerWithEmail({
      name: data.name.trim(),
      email: trimmedEmail.toLowerCase(),
      password: data.password,
    });
  }
}
