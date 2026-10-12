import { IAuthRepository } from '../repositories/IAuthRepository';
import { AuthResult } from '../entities/auth';

/**
 * Use Case: Sign In With Google
 * Layer: DOMAIN (Application Business Rules)
 */
export class SignInWithGoogleUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(options?: { redirectTo?: string }): Promise<AuthResult> {
    return await this.authRepository.signInWithGoogle(options);
  }
}
