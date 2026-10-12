import { IAuthRepository } from '../repositories/IAuthRepository';

/**
 * Use Case: Sign Out
 * Layer: DOMAIN (Application Business Rules)
 */
export class SignOutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.signOut();
  }
}
