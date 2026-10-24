'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import GoogleLoginButton from './GoogleLoginButton';
import styles from './AuthModal.module.css';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Masuk dengan Akun Google',
  description = 'Sesuai regulasi partisipasi publik (US-001), Anda wajib masuk dengan akun terverifikasi Google untuk mengirim evaluasi dan mencegah bot.',
}: AuthModalProps) {
  const router = useRouter();
  useEscapeKey(onClose, isOpen);
  if (!isOpen) return null;

  // Google login sedang di-hold: arahkan ke halaman awal yang memuat form daftar & mode tamu
  const goToLanding = () => {
    onClose();
    router.push('/');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <Icon name="verified_user" size={24} style={{ color: '#FF6B4A' }} />
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
            <Icon name="close" size={20} />
          </button>
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>

        <div className={styles.buttonWrapper}>
          <GoogleLoginButton
            onSuccess={() => {
              if (onSuccess) onSuccess();
              onClose();
            }}
            buttonText="Masuk dengan Google"
            onSelectRegister={goToLanding}
            onSelectGuest={goToLanding}
          />
        </div>

        <div className={styles.footer}>
          <span className={styles.securityText}>
            🔒 Data Anda dienkripsi secara aman melalui Supabase Auth &amp; Google OAuth 2.0
          </span>
        </div>
      </div>
    </div>
  );
}
