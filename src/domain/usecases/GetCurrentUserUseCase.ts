import { IAuthRepository } from '../repositories/IAuthRepository';
import { User, AuthSession } from '../entities/auth';

/**
 * Use Case: Get Current User and Session
 * Layer: DOMAIN (Application Business Rules)
 */
export class GetCurrentUserUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<{ user: User | null; session: AuthSession | null }> {
    const [user, session] = await Promise.all([
      this.authRepository.getCurrentUser(),
      this.authRepository.getCurrentSession(),
    ]);
    return { user, session };
  }
}
