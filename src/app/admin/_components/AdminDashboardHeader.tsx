'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import type { User } from '@/domain/entities/auth';
import type { AiBackendStatus } from './adminConfig';
import styles from '../admin.module.css';

interface AdminDashboardHeaderProps {
  aiStatus: AiBackendStatus;
  user: User | null;
  onSignOut: () => void;
}

/** Header, identitas sesi admin, dan banner Auto-Pilot. */
export default function AdminDashboardHeader({ aiStatus, user, onSignOut }: AdminDashboardHeaderProps) {
  const router = useRouter();

  return (
    <>
        <header className={styles.header}>
          <button
            className="btn btn-ghost"
            onClick={() => router.push('/home')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="arrow_back" size={16} />
            <span>Beranda</span>
          </button>
          <h1 className={styles.headerTitle}>Panel Admin Kebijakan</h1>
          <div
            className={`${styles.backendTag} ${aiStatus.deepseekConfigured ? styles.backendTagActive : ''}`}
            title={aiStatus.deepseekConfigured ? `Model: ${aiStatus.activeModel}` : 'Konfigurasi DEEPSEEK_API_KEY di file .env'}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: aiStatus.deepseekConfigured ? '#4F46E5' : '#94A3B8',
                display: 'inline-block',
              }}
            />
            <span>{aiStatus.deepseekConfigured ? `DeepSeek AI Aktif` : 'DeepSeek: Input di .env'}</span>
          </div>
        </header>

        {/* Admin Session Identity Bar */}
        <div className={styles.adminIdentityBar}>
          <div className={styles.adminIdentityInfo}>
            <span className={styles.adminShieldIcon}>🛡️</span>
            <div>
              <div className={styles.adminNameRow}>
                <span className={styles.adminActiveName}>{user?.name || 'Administrator Kebijakan'}</span>
                <span className={styles.adminActiveBadge}>ADMIN</span>
              </div>
              <span className={styles.adminActiveEmail}>{user?.email || 'admin@policysnap.id'}</span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onSignOut}
            style={{ fontSize: '0.75rem', color: '#EF4444', border: '1px solid #FEE2E2', background: 'var(--tint-danger)' }}
          >
            <Icon name="logout" size={14} />
            <span>Keluar</span>
          </button>
        </div>

        {/* Admin Notice */}
        <div className={styles.adminBanner}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            }}
          >
            <Icon name="bolt" size={24} />
          </div>
          <div>
            <span className={styles.adminLabel} style={{ color: '#4F46E5' }}>
              Pusat Kurasi & DeepSeek AI Auto-Pilot
            </span>
            <p className={styles.adminDesc}>
              Cukup paste tautan berita apa saja. Backend DeepSeek AI akan mengekstrak judul, kriteria, dan profil aktor secara otomatis.
            </p>
          </div>
        </div>
    </>
  );
}
