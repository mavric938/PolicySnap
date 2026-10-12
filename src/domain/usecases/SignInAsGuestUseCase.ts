import { IAuthRepository } from '../repositories/IAuthRepository';
import { AuthResult } from '../entities/auth';

/**
 * Use Case: Sign In As Guest (Offline Cache Scheme)
 * Layer: DOMAIN (Application Business Rules)
 */
export class SignInAsGuestUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(customName?: string): Promise<AuthResult> {
    return await this.authRepository.signInAsGuest(customName);
  }
}
