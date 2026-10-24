import Icon from '@/components/Icon';
import type { CriteriaDescriptions } from '@/types';
import { CRITERIA_FIELDS } from './adminConfig';
import styles from '../admin.module.css';

interface CriteriaEditorProps {
  criteria: CriteriaDescriptions;
  onChange: (key: keyof CriteriaDescriptions, value: string) => void;
}

/** Editor 4 deskripsi matriks kriteria (tampil di slider Studio Evaluasi). */
export default function CriteriaEditor({ criteria, onChange }: CriteriaEditorProps) {
  return (
    <div className={styles.formSectionDivider}>
      <div className={styles.sectionHeaderRow}>
        <div>
          <span className={styles.sectionHeading}>
            <Icon name="track_changes" size={18} style={{ color: 'var(--primary-coral)' }} />
            Matriks Kriteria Kebijakan (Representatif & Spesifik)
          </span>
          <p className={styles.sectionSubtext}>
            Deskripsi indikator yang akan muncul langsung pada slider penilaian pengguna di Studio Evaluasi.
          </p>
        </div>
      </div>


      <div className={styles.criteriaGrid}>
        {CRITERIA_FIELDS.map((field) => (
          <div key={field.key} className={styles.criteriaCardInput}>
            <div className={styles.criteriaCardHeader}>
              <div className={styles.criteriaCardIcon} style={{ background: field.background, color: field.color }}>
                <Icon name={field.icon} size={15} />
              </div>
              <span className={styles.criteriaCardTitle}>{field.title}</span>
            </div>
            <textarea
              className={styles.criteriaTextarea}
              value={criteria[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              id={`input-criteria-${field.key}`}
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
