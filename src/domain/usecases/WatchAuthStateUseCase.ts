import { IAuthRepository } from '../repositories/IAuthRepository';
import { User, AuthSession } from '../entities/auth';

/**
 * Use Case: Watch Auth State Changes
 * Layer: DOMAIN (Application Business Rules)
 */
export class WatchAuthStateUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  execute(callback: (user: User | null, session: AuthSession | null) => void): () => void {
    return this.authRepository.onAuthStateChange(callback);
  }
}
