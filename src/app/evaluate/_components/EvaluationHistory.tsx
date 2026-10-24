'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import SoundToggle from '@/components/SoundToggle';
import { soundService } from '@/lib/soundService';
import { getVerdict } from '@/lib/scoring';
import { EvaluationRecord, formatEvalDate, STANCE_BUTTONS } from './evaluateConfig';
import styles from '../evaluate.module.css';

interface EvaluationHistoryProps {
  evaluations: EvaluationRecord[];
  userXP: number;
  onOpenDetail: (item: EvaluationRecord) => void;
}

/** Tampilan 1: daftar isu yang telah dievaluasi. */
export default function EvaluationHistory({ evaluations, userXP, onOpenDetail }: EvaluationHistoryProps) {
  const router = useRouter();

  return (
      <div className={styles.evalHistoryContainer}>
        {/* Header Ringkas */}
        <header className={styles.evalTopHeader}>
          <div className={styles.evalTitleGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="fact_check" size={22} style={{ color: 'var(--primary-coral)' }} />
              <h1 className={styles.evalMainTitle}>Isu yang Telah Dievaluasi</h1>
            </div>
            <p className={styles.evalMainSub}>
              Buka kartu isu di bawah untuk melihat hasil analisis, skor 4 dimensi, dan laporannya.
            </p>
          </div>

          <div className={styles.evalControlsRow}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                soundService.playTap();
                router.push('/home');
              }}
              id="btn-eval-goto-home"
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                borderColor: 'var(--primary-coral)',
                color: 'var(--primary-coral)',
                background: 'var(--tint-primary)',
              }}
            >
              <Icon name="add" size={13} />
              <span>Nilai Isu Lain</span>
            </button>
            <SoundToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--tint-primary)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--tint-primary-border)' }}>
              <span style={{ fontSize: '11px' }}>⭐</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-coral)', fontFamily: 'var(--font-mono)' }}>
                {userXP} XP
              </span>
            </div>
          </div>
        </header>

        {/* List Kartu Hasil Evaluasi */}
        {evaluations.length > 0 ? (
          <div className={styles.evalCardsList}>
            {evaluations.map((item) => {
              const stanceBtn = STANCE_BUTTONS.find((b) => b.value === item.stance) || STANCE_BUTTONS[1];
              return (
                <article key={item.issueId} className={styles.evalItemCard} id={`eval-card-${item.issueId}`}>
                  {/* Header: Kategori & Tanggal */}
                  <div className={styles.evalCardHeader}>
                    <span className={styles.evalCategoryBadge}>
                      <Icon name="folder_open" size={12} />
                      {item.category}
                    </span>
                    <span className={styles.evalDateBadge}>{formatEvalDate(item.timestamp)}</span>
                  </div>

                  {/* Judul Isu */}
                  <h3 className={styles.evalCardTitle}>{item.issueTitle}</h3>

                  {/* Baris Skor Komposit & Sikap */}
                  <div className={styles.evalScoreStanceRow}>
                    <div>
                      <span className={styles.evalCompositeNum}>
                        {item.compositeScore} <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>/10</span>
                      </span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        {getVerdict(item.compositeScore).detail}
                      </span>
                    </div>

                    <div
                      className={styles.evalStanceBadge}
                      style={{
                        background: stanceBtn.bg,
                        color: stanceBtn.text,
                        border: `1px solid ${stanceBtn.color}40`,
                      }}
                    >
                      <span style={{ fontSize: '8px' }}>●</span>
                      <span>{item.stance}</span>
                    </div>
                  </div>

                  {/* 4 Dimensi Mini Grid */}
                  <div className={styles.evalDimMiniGrid}>
                    <div className={styles.evalDimMiniItem} style={{ background: 'var(--tint-success)', color: 'var(--success-text)' }}>
                      <span className={styles.evalDimMiniName}>Efektivitas</span>
                      <span className={styles.evalDimMiniVal}>{item.scores.effectiveness}</span>
                    </div>
                    <div className={styles.evalDimMiniItem} style={{ background: 'var(--tint-warning)', color: 'var(--warning-text)' }}>
                      <span className={styles.evalDimMiniName}>Efisiensi</span>
                      <span className={styles.evalDimMiniVal}>{item.scores.efficiency}</span>
                    </div>
                    <div className={styles.evalDimMiniItem} style={{ background: 'var(--tint-danger)', color: 'var(--danger-text)' }}>
                      <span className={styles.evalDimMiniName}>Keadilan</span>
                      <span className={styles.evalDimMiniVal}>{item.scores.equity}</span>
                    </div>
                    <div className={styles.evalDimMiniItem} style={{ background: 'var(--tint-info)', color: 'var(--info-text)' }}>
                      <span className={styles.evalDimMiniName}>Respon</span>
                      <span className={styles.evalDimMiniVal}>{item.scores.responsiveness}</span>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className={styles.evalActionsGrid}>
                    <button
                      type="button"
                      className={`${styles.evalActionBtn} ${styles.evalActionBtnPrimary}`}
                      onClick={() => {
                        soundService.playSelect();
                        onOpenDetail(item);
                      }}
                      id={`btn-detail-${item.issueId}`}
                    >
                      <Icon name="visibility" size={14} />
                      <span>Buka Hasil Evaluasi</span>
                    </button>

                    <button
                      type="button"
                      className={styles.evalActionBtn}
                      onClick={() => {
                        soundService.playTap();
                        router.push(`/consensus?issue=${item.issueId}`);
                      }}
                      id={`btn-consensus-${item.issueId}`}
                      style={{ color: 'var(--primary-coral)', fontWeight: 700 }}
                    >
                      <Icon name="pie_chart" size={14} />
                      <span>Konsensus</span>
                    </button>

                    <button
                      type="button"
                      className={styles.evalActionBtn}
                      onClick={() => {
                        soundService.playTap();
                        router.push(`/share?issue=${item.issueId}`);
                      }}
                      id={`btn-share-${item.issueId}`}
                    >
                      <Icon name="share" size={14} />
                      <span>Raport 9:16</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Tampilan Kosong Jika Belum Ada Isu */
          <div className={styles.evalEmptyCard}>
            <div className={styles.evalEmptyIconBox}>
              <Icon name="fact_check" size={32} />
            </div>
            <h2 className={styles.evalEmptyTitle}>Belum Ada Isu yang Dievaluasi</h2>
            <p className={styles.evalEmptyDesc}>
              Anda belum memberikan penilaian pada isu kebijakan apapun. Kunjungi Beranda untuk memilih isu kebijakan publik dan mulai memberikan penilaian 4 dimensi.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                soundService.playTap();
                router.push('/home');
              }}
              id="btn-goto-beranda"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Buka Beranda Isu</span>
              <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        )}
      </div>
  );
}
