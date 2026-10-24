'use client';

import { useAuth } from '@/presentation/hooks/useAuth';

/**
 * ID pengguna yang sedang login menurut sesi server (null bila belum login / masih memuat).
 * Menggantikan pola lama `localStorage.getItem('policysnap_user_id') || 'user-001'` yang
 * dibaca saat render (hydration mismatch) dan memakai ID palsu untuk pengunjung anonim.
 */
export function useCurrentUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}
