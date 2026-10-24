'use client';

import React, { useState } from 'react';
import Icon from '@/components/Icon';
import styles from './GoogleLoginButton.module.css';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  className?: string;
  buttonText?: string;
  onSelectRegister?: () => void;
  onSelectGuest?: () => void;
}

export default function GoogleLoginButton({
  className = '',
  buttonText = 'Lanjutkan dengan Google',
  onSelectRegister,
  onSelectGuest,
}: GoogleLoginButtonProps) {
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  useEscapeKey(() => setShowNoticeModal(false), showNoticeModal);

  const handleGoogleClick = () => {
    setShowNoticeModal(true);
  };

  return (
    <>
      <button
        type="button"
        id="btn-google-login"
        className={`${styles.googleBtn} ${className}`}
        onClick={handleGoogleClick}
        aria-label="Google Sign-In (Di-hold sementara)"
      >
        <div className={styles.googleBtnLeft}>
          <svg className={styles.googleSvg} viewBox="0 0 24 24">
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
          <div className={styles.googleBtnText}>
            <span className={styles.googleBtnTitle}>{buttonText}</span>
            <span className={styles.googleBtnSub} style={{ color: 'var(--danger-text)', fontWeight: 600 }}>
              ⏳ Belum Tersedia (Di-hold untuk Uji Deploy)
            </span>
          </div>
        </div>
        <span className={styles.badgeHold}>Hold</span>
      </button>

      {/* Notice Modal */}
      {showNoticeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNoticeModal(false)}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-label="Login Google belum tersedia"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalBadge} style={{ background: 'var(--tint-danger)' }}>
                <Icon name="info" size={22} style={{ color: 'var(--danger-text)' }} />
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowNoticeModal(false)}
                aria-label="Tutup"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <h3 className={styles.modalTitle}>Fitur Google Auth Belum Tersedia</h3>
            <p className={styles.modalDesc}>
              Untuk keperluan <strong>pengujian deployment saat ini</strong>, integrasi login Google sengaja ditangguhkan (di-hold).
            </p>

            <div className={styles.instructionBox}>
              <p className={styles.instructionStep}>
                Anda dapat melanjutkan dengan salah satu metode pengujian berikut:
              </p>
              <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '0.8rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                <li><strong>Buat Akun Baru:</strong> Sertakan nama, email valid, dan kata sandi.</li>
                <li><strong>Mainkan sebagai Tamu (Play as Guest):</strong> Langsung bermain dengan data tersimpan di cache offline.</li>
              </ul>
            </div>

            <div className={styles.actionGroup}>
              {onSelectRegister && (
                <button
                  type="button"
                  className={styles.devLoginBtn}
                  onClick={() => {
                    setShowNoticeModal(false);
                    onSelectRegister();
                  }}
                  style={{ background: '#FF6B4A' }}
                >
                  <Icon name="person_add" size={18} />
                  <span>Buat Akun Baru Sekarang</span>
                </button>
              )}

              {onSelectGuest && (
                <button
                  type="button"
                  className={styles.devLoginBtn}
                  onClick={() => {
                    setShowNoticeModal(false);
                    onSelectGuest();
                  }}
                  style={{ background: '#0F172A' }}
                >
                  <span>🎮 Mainkan sebagai Tamu (Guest)</span>
                </button>
              )}

              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowNoticeModal(false)}
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
