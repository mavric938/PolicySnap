import { IAuthRepository } from '../repositories/IAuthRepository';
import { AuthResult } from '../entities/auth';

/**
 * Use Case: Sign In With Dev Account
 * Layer: DOMAIN (Application Business Rules)
 */
export class SignInWithDevAccountUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(user: { email: string; name: string; avatarUrl?: string }): Promise<AuthResult> {
    return await this.authRepository.signInWithDevAccount(user);
  }
}
