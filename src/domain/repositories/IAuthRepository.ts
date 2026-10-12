/**
 * Authentication Repository Interface
 * Layer: DOMAIN (Enterprise Business Rules)
 * 
 * Defines the contract that the Data layer must satisfy without depending on external libraries or frameworks.
 */

import { User, AuthSession, AuthResult } from '../entities/auth';

export interface IAuthRepository {
  /**
   * Initiates Google OAuth Sign-In flow
   * @param options Optional redirect and callback options
   */
  signInWithGoogle(options?: { redirectTo?: string }): Promise<AuthResult>;

  /**
   * Fast dev/test sign-in with a Google persona
   */
  signInWithDevAccount(user: { email: string; name: string; avatarUrl?: string }): Promise<AuthResult>;

  /**
   * Register a new user account with validated email, name, and password
   */
  registerWithEmail(data: { name: string; email: string; password?: string }): Promise<AuthResult>;

  /**
   * Sign in with existing email and password
   */
  signInWithEmail(email: string, password?: string): Promise<AuthResult>;

  /**
   * Play as a Guest with offline cache / localStorage scheme
   */
  signInAsGuest(customName?: string): Promise<AuthResult>;

  /**
   * Signs the user out of the active session
   */
  signOut(): Promise<void>;

  /**
   * Retrieves the currently active user, or null if unauthenticated
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Retrieves the currently active session
   */
  getCurrentSession(): Promise<AuthSession | null>;

  /**
   * Subscribes to authentication state changes
   * @returns Unsubscribe function
   */
  onAuthStateChange(callback: (user: User | null, session: AuthSession | null) => void): () => void;

  /**
   * Checks whether Google OAuth provider is enabled in the backend
   */
  isGoogleOAuthAvailable(): Promise<boolean>;
}
