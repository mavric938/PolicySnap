import { IAuthRepository } from '../repositories/IAuthRepository';
import { AuthResult } from '../entities/auth';

/**
 * Use Case: Sign In With Email and Password
 * Layer: DOMAIN (Application Business Rules)
 */
export class SignInWithEmailUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(email: string, password?: string): Promise<AuthResult> {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { success: false, error: 'Email wajib diisi.' };
    }
    return await this.authRepository.signInWithEmail(trimmedEmail.toLowerCase(), password);
  }
}
