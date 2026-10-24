'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { soundService } from '@/lib/soundService';
import styles from '../evaluate.module.css';

interface SubmitSuccessModalProps {
  compositeScore: number;
  issueId: string;
  onShowHistory: () => void;
}

/** Modal sukses setelah evaluasi diterima server. */
export default function SubmitSuccessModal({ compositeScore, issueId, onShowHistory }: SubmitSuccessModalProps) {
  const router = useRouter();

  return (
      <div className={styles.modalOverlay}>
        <div
        className={`${styles.modalContent} animate-slide-up`}
        role="dialog"
        aria-modal="true"
        aria-label="Evaluasi berhasil disimpan"
      >
          <div className={styles.modalHologram}>
            <Icon name="workspace_premium" size={36} />
          </div>

          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--primary-coral)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Evaluasi Terverifikasi
            </span>
            <h3 className={styles.modalTitle}>Evaluasi Berhasil Disimpan!</h3>
            <p className={styles.modalSub}>
              Skor Indeks Anda ({compositeScore}/10) telah digabungkan ke data nasional. Anda memperoleh +10 XP Reputasi.
            </p>
          </div>

          <div className={styles.modalActions}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                soundService.playTap();
                router.push(`/consensus?issue=${issueId}`);
              }}
              id="btn-modal-see-consensus"
              style={{ borderRadius: '1rem', padding: '0.875rem' }}
            >
              Lihat Konsensus Komunitas &amp; Diskusi →
            </button>
            <button
              className="btn btn-outline btn-full"
              onClick={() => {
                soundService.playTap();
                onShowHistory();
              }}
              id="btn-modal-see-results"
              style={{ borderRadius: '1rem', padding: '0.75rem' }}
            >
              Daftar Riwayat Evaluasi Saya
            </button>
            <button
              className="btn btn-ghost btn-full"
              onClick={() => router.push(`/share?issue=${issueId}`)}
              id="btn-modal-share"
              style={{ borderRadius: '1rem', padding: '0.625rem', fontSize: '0.8125rem' }}
            >
              Buka Raport Visual (9:16)
            </button>
          </div>
        </div>
      </div>
  );
}
