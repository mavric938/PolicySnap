'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import Icon from '@/components/Icon';
import styles from './UserAuthBadge.module.css';

interface UserAuthBadgeProps {
  userXP?: number;
  rankName?: string;
  catAvatarNode?: React.ReactNode;
}

export default function UserAuthBadge({
  userXP,
  rankName,
  catAvatarNode,
}: UserAuthBadgeProps) {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    setShowDropdown(false);
    await signOut();
    router.push('/');
  };

  if (!isAuthenticated && !user) {
    return (
      <Link href="/" className={styles.loginBadgeLink}>
        <div className={styles.googleIconCircle}>
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
        </div>
        <span className={styles.loginBadgeText}>Masuk Google</span>
      </Link>
    );
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.userStatusPill}
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Menu Pengguna"
      >
        <div className={styles.avatarContainer}>
          {catAvatarNode ? (
            catAvatarNode
          ) : user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className={styles.googleAvatar} />
          ) : (
            <div className={styles.defaultAvatar}>
              <Icon name="person" size={20} />
            </div>
          )}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userRankText}>{rankName || user?.name || 'Warga'}</span>
          {userXP !== undefined && (
            <span className={styles.userXpText}>{userXP} XP</span>
          )}
        </div>
        <Icon name="expand_more" size={16} className={styles.chevron} />
      </button>

      {showDropdown && (
        <>
          <div className={styles.backdrop} onClick={() => setShowDropdown(false)} />
          <div className={styles.dropdownMenu}>
            <div className={styles.dropdownHeader}>
              <div className={styles.userFullName}>{user?.name}</div>
              <div className={styles.userEmail}>{user?.email}</div>
              <div className={styles.verifiedRow}>
                <span
                  className={styles.googleDot}
                  style={{
                    backgroundColor: user?.provider === 'guest' ? '#0284C7' : '#16A34A',
                  }}
                />
                <span>
                  {user?.provider === 'guest'
                    ? 'Mode Tamu (Offline Cache)'
                    : user?.provider === 'email'
                    ? 'Akun Pengguna Terverifikasi'
                    : 'Terverifikasi Google OAuth'}
                </span>
              </div>
            </div>

            <div className={styles.dropdownDivider} />

            <Link
              href="/profile"
              className={styles.dropdownItem}
              onClick={() => setShowDropdown(false)}
            >
              <Icon name="account_circle" size={18} />
              <span>Profil &amp; Lemari Kucing</span>
            </Link>

            <Link
              href="/admin"
              className={styles.dropdownItem}
              onClick={() => setShowDropdown(false)}
            >
              <Icon name="admin_panel_settings" size={18} />
              <span>Panel Kurasi Isu (Admin)</span>
            </Link>

            <div className={styles.dropdownDivider} />

            <button
              type="button"
              className={`${styles.dropdownItem} ${styles.logoutItem}`}
              onClick={handleLogout}
            >
              <Icon name="logout" size={18} />
              <span>Keluar Akun</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
