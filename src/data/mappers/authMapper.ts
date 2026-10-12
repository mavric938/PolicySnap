import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { User, AuthSession } from '@/domain/entities/auth';

/**
 * Mapper: Converts Supabase Auth data structures to Domain Entities
 * Layer: DATA
 */
export class AuthMapper {
  static toDomainUser(sbUser: SupabaseUser): User {
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Pengguna Kebijakan',
      email: sbUser.email || '',
      avatarUrl: meta.avatar_url || meta.picture || '',
      provider: (sbUser.app_metadata?.provider as any) || 'google',
      createdAt: sbUser.created_at,
    };
  }

  static toDomainSession(sbSession: SupabaseSession): AuthSession {
    return {
      user: this.toDomainUser(sbSession.user),
      accessToken: sbSession.access_token,
      refreshToken: sbSession.refresh_token,
      expiresAt: sbSession.expires_at,
    };
  }
}
