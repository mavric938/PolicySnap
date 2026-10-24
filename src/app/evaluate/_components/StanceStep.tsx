'use client';

import Icon from '@/components/Icon';
import { soundService } from '@/lib/soundService';
import { STANCE_BUTTONS } from './evaluateConfig';
import styles from '../evaluate.module.css';

interface StanceStepProps {
  stance: string;
  onStanceChange: (stance: string) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

/** Langkah 3/3: sikap final & argumen warga. */
export default function StanceStep({
  stance,
  onStanceChange,
  comment,
  onCommentChange,
  isSubmitting,
  onSubmit,
}: StanceStepProps) {
  return (
      <section className={`${styles.stepSection} animate-fade-in`}>
        <div className={styles.stepHeader}>
          <div className={styles.stepTopRow}>
            <span className={styles.stepTag}>
              <span className={styles.stepDotAccent} />
              [3/3] Posisi Kebijakan &amp; Argumen
            </span>
            <span className={styles.stepDimensionCount}>Langkah Akhir</span>
          </div>
          <p className={styles.stepInstruction}>
            Tentukan sikap final Anda dan sertakan argumen berbobot untuk memperkuat transparansi publik.
          </p>
        </div>

        <div className={styles.stanceGrid}>
          {STANCE_BUTTONS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`${styles.stanceCard} ${stance === s.value ? styles.stanceCardActive : ''}`}
              onClick={() => {
                soundService.playTap();
                onStanceChange(s.value);
              }}
              id={`stance-${s.value.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                borderColor: stance === s.value ? s.color : 'var(--border-card)',
                boxShadow: stance === s.value ? `0 4px 16px ${s.color}25` : 'none',
              }}
            >
              <div
                className={styles.stanceRadioCircle}
                style={{
                  borderColor: stance === s.value ? s.color : '#CBD5E1',
                  background: stance === s.value ? s.color : '#FFFFFF',
                }}
              >
                {stance === s.value && <div className={styles.stanceRadioInner} />}
              </div>
              <span className={styles.stanceLabel} style={{ color: stance === s.value ? s.color : 'inherit' }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.argumentBox}>
          <div className={styles.argumentLabelRow}>
            <label htmlFor="user-comment" className={styles.argumentLabel}>
              Catatan Analisis Kebijakan (Argumen Warga)
            </label>
            <span className={styles.argumentCounter}>{comment.length}/300</span>
          </div>
          <textarea
            id="user-comment"
            className={styles.argumentTextarea}
            rows={4}
            maxLength={300}
            placeholder="Tuliskan alasan analitis atau masukan rekomendasi konstruktif untuk pembuat kebijakan..."
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
        </div>

        <div className={styles.submitCard}>
          <button
            className={`btn btn-primary btn-full ${styles.submitBtn}`}
            onClick={onSubmit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            id="btn-submit-evaluation"
          >
            <Icon name="bolt" size={20} />
            <span>{isSubmitting ? 'Mengirim Evaluasi...' : 'Kirim Evaluasi & Klaim +10 XP'}</span>
          </button>
        </div>
      </section>
  );
}
