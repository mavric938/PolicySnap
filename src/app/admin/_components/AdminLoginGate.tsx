'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import styles from '../admin.module.css';

interface AdminLoginGateProps {
  /** Mengembalikan pesan error, atau null bila login berhasil. */
  onLogin: (identifier: string, password: string) => Promise<string | null>;
}

/** Gerbang keamanan admin: form login (verifikasi password dilakukan server). */
export default function AdminLoginGate({ onLogin }: AdminLoginGateProps) {
  const router = useRouter();
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    setIsAdminLoggingIn(true);
    try {
      const error = await onLogin(adminUsernameInput, adminPasswordInput);
      if (error) setAdminLoginError(error);
    } catch (err: unknown) {
      setAdminLoginError((err as Error)?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  return (
    <div className="page animate-fade-in" style={{ paddingBottom: '40px' }}>
      <header className={styles.header}>
        <button
          className="btn btn-ghost"
          onClick={() => router.push('/home')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="arrow_back" size={16} />
          <span>Beranda</span>
        </button>
        <h1 className={styles.headerTitle}>Pusat Kurasi & Auto-Pilot</h1>
        <div style={{ width: 60 }} />
      </header>

      <div className={styles.gateWrapper}>
        <div className={styles.gateCard}>
          <div className={styles.gateIconBox}>
            <Icon name="security" size={32} />
          </div>

          <div className={styles.gateBadge}>
            <span className={styles.pulseDot} />
            <span>Akses Terbatas: Administrator</span>
          </div>

          <h2 className={styles.gateTitle}>Pusat Kurasi & Admin Kebijakan</h2>
          <p className={styles.gateDesc}>
            Akses khusus pengelola untuk memvalidasi isu, mengedit matriks kriteria kebijakan, dan kurasi otomatis melalui DeepSeek AI Auto-Pilot.
          </p>

          {adminLoginError && (
            <div className={styles.gateErrorAlert}>
              <Icon name="error" size={16} />
              <span>{adminLoginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className={styles.gateForm}>
            <div className={styles.formGroup}>
              <label className={styles.gateLabel}>
                <Icon name="badge" size={14} />
                <span>Email / Username Admin</span>
              </label>
              <input
                type="text"
                className={styles.gateInput}
                placeholder="admin@policysnap.id"
                value={adminUsernameInput}
                onChange={(e) => setAdminUsernameInput(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.gateLabel}>
                <Icon name="lock" size={14} />
                <span>Kata Sandi Admin</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  className={styles.gateInput}
                  placeholder="••••••••"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.visibilityToggle}
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                >
                  <Icon name={showAdminPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isAdminLoggingIn}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                marginTop: '12px',
              }}
            >
              {isAdminLoggingIn ? 'Memvalidasi...' : 'Masuk sebagai Admin →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
