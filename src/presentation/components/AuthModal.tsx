'use client';

import React from 'react';
import Icon from '@/components/Icon';
import GoogleLoginButton from './GoogleLoginButton';
import styles from './AuthModal.module.css';

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
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
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
