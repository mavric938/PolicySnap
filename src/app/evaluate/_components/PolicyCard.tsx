/* eslint-disable @next/next/no-img-element -- banner bisa berasal dari URL eksternal arbitrer & butuh onError fallback */
import Icon from '@/components/Icon';
import { getIssueBannerImage, getCategoryIllustration } from '@/lib/categoryTheme';
import type { PolicyIssue } from '@/types';
import { getCategoryIcon } from './evaluateConfig';
import styles from '../evaluate.module.css';

/** Kartu ringkasan isu di atas Studio Evaluasi. */
export default function PolicyCard({ issue }: { issue: PolicyIssue }) {
  return (
      <section className={styles.policyCard}>
        <div className={styles.policyBadges}>
          <div className={styles.activeBadge}>
            <span className={styles.pulseDot} />
            <span>Aktif Menilai</span>
          </div>
          <div className={styles.categoryBadge}>
            <Icon name={getCategoryIcon(issue.category)} size={14} />
            <span>{issue.category || 'Kebijakan Publik'}</span>
          </div>
        </div>

        <h1 className={styles.policyTitle}>{issue.title}</h1>

        {/* Policy Metadata & Source Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary-coral)', background: '#FFF1ED', padding: '2px 8px', borderRadius: '6px' }}>
            {issue.category || 'Regulasi'}
          </span>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-main)' }}>
            <span>{issue.actorTags?.[0] || 'Stakeholder Kunci'}</span>
            <Icon name="verified" size={15} style={{ color: '#2563EB' }} />
          </div>
          {issue.sourceUrl && (
            <>
              <span style={{ color: '#D1D5DB' }}>•</span>
              <a
                href={issue.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
              >
                <span>Rujukan Resmi</span>
                <Icon name="open_in_new" size={13} />
              </a>
            </>
          )}
        </div>

        <p className={styles.policyDesc}>{issue.summary}</p>

        {/* Context Image Snapshot Banner */}
        <div className={styles.policyBanner}>
          <img
            src={getIssueBannerImage(issue)}
            alt={issue.title}
            className={styles.policyBannerBg}
            onError={(e) => {
              e.currentTarget.src = getCategoryIllustration(issue.category);
            }}
          />
          <div className={styles.policyBannerOverlay} />
          <div className={styles.policyXpTag}>
            <Icon name="bolt" size={16} style={{ color: '#F59E0B' }} />
            <span>+10 XP Analisis Saat Dikirim</span>
          </div>
        </div>
      </section>
  );
}
