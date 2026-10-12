/**
 * Domain Entities for Authentication
 * Layer: DOMAIN (Enterprise Business Rules)
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'google' | 'email' | 'guest';
  createdAt?: string;
}

export interface AuthSession {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  redirectUrl?: string;
  error?: string;
  providerNotEnabled?: boolean;
}
