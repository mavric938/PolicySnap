'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { soundService } from '@/lib/soundService';
import { EvaluationRecord, formatEvalDate } from './evaluateConfig';
import styles from '../evaluate.module.css';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface EvaluationDetailModalProps {
  detail: EvaluationRecord;
  onClose: () => void;
}

/** Modal detail laporan evaluasi dari daftar riwayat. */
export default function EvaluationDetailModal({ detail, onClose }: EvaluationDetailModalProps) {
  const router = useRouter();
  useEscapeKey(onClose);

  return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div
        className={styles.reviewModalContent}
        role="dialog"
        aria-modal="true"
        aria-label={`Detail evaluasi: ${detail.issueTitle}`}
        onClick={(e) => e.stopPropagation()}
      >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <div>
              <span className={styles.evalCategoryBadge}>{detail.category}</span>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-main)', margin: '6px 0 2px 0' }}>
                {detail.issueTitle}
              </h3>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                Dinilai pada {formatEvalDate(detail.timestamp)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup detail evaluasi"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          {/* Skor Komposit & Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '12px' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
                Skor Komposit Anda
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-coral)', fontFamily: 'var(--font-mono)' }}>
                {detail.compositeScore} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/10</span>
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
                Sikap Penilaian
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--success-text)' }}>
                {detail.stance}
              </span>
            </div>
          </div>

          {/* Rincian 4 Dimensi */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-body)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Rincian 4 Dimensi Kebijakan
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-body)' }}>Efektivitas Target</span>
                <span style={{ fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                  {detail.scores.effectiveness}/10
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-body)' }}>Efisiensi Anggaran</span>
                <span style={{ fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                  {detail.scores.efficiency}/10
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-body)' }}>Keadilan Distribusi</span>
                <span style={{ fontWeight: 800, color: '#F43F5E', fontFamily: 'var(--font-mono)' }}>
                  {detail.scores.equity}/10
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-body)' }}>Responsivitas Aspirasi</span>
                <span style={{ fontWeight: 800, color: '#0EA5E9', fontFamily: 'var(--font-mono)' }}>
                  {detail.scores.responsiveness}/10
                </span>
              </div>
            </div>
          </div>

          {/* Catatan Argumen */}
          {detail.comment && (
            <div style={{ background: 'var(--tint-primary)', borderLeft: '3px solid var(--primary-coral)', padding: '10px 12px', borderRadius: '0 8px 8px 0' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary-coral)', display: 'block', marginBottom: '4px' }}>
                Argumen Analisis Anda:
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-body)', margin: 0, fontStyle: 'italic', lineHeight: 1.45 }}>
                &ldquo;{detail.comment}&rdquo;
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => {
                soundService.playTap();
                router.push(`/consensus?issue=${detail.issueId}`);
              }}
              id="btn-modal-open-consensus"
              style={{ borderRadius: '12px', padding: '10px' }}
            >
              <Icon name="pie_chart" size={16} />
              <span>Lihat Konsensus Komunitas &amp; Argumen</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-full"
              onClick={() => {
                soundService.playTap();
                router.push(`/share?issue=${detail.issueId}`);
              }}
              style={{ borderRadius: '12px', padding: '10px' }}
            >
              <Icon name="share" size={16} />
              <span>Buka Raport Visual 9:16 (Share)</span>
            </button>
          </div>
        </div>
      </div>
  );
}
