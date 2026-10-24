'use client';

import Icon from '@/components/Icon';
import { soundService } from '@/lib/soundService';
import { compositeScore as computeCompositeScore, getVerdict } from '@/lib/scoring';
import type { EvaluationScores, PolicyIssue } from '@/types';
import { CRITERIA_CONFIGS, ScoreKey } from './evaluateConfig';
import styles from '../evaluate.module.css';

interface CriteriaSliderStepProps {
  issue: PolicyIssue;
  scores: EvaluationScores;
  onScoreChange: (key: ScoreKey, value: number) => void;
  onNext: () => void;
}

/** Langkah 1/3: 4 slider kriteria kebijakan (US-003). */
export default function CriteriaSliderStep({ issue, scores, onScoreChange, onNext }: CriteriaSliderStepProps) {
  const compositeScore = computeCompositeScore(scores);

  return (
      <section className={`${styles.stepSection} animate-fade-in`}>
        <div className={styles.stepHeader}>
          <div className={styles.stepTopRow}>
            <span className={styles.stepTag}>
              <span className={styles.stepDotAccent} />
              [1/3] Matriks Kriteria Kebijakan
            </span>
            <span className={styles.stepDimensionCount}>4 Dimensi</span>
          </div>
          <p className={styles.stepInstruction}>
            Geser skala 1 (Buruk) hingga 10 (Sangat Unggul) berdasarkan penilaian Anda.
          </p>
        </div>

        <div className={styles.sliderList}>
          {CRITERIA_CONFIGS.map((crit) => {
            const val = scores[crit.key];
            const status = crit.getStatus(val);
            return (
              <div key={crit.key} className={styles.sliderItem}>
                <div className={styles.sliderHeaderRow}>
                  <div className={styles.sliderTitleGroup}>
                    <div
                      className={styles.sliderIconBox}
                      style={{ background: crit.bgLight, color: crit.color }}
                    >
                      <Icon name={crit.icon} size={18} />
                    </div>
                    <span className={styles.sliderTitle}>{crit.label}</span>
                  </div>

                  <div className={styles.sliderScoreGroup}>
                    <span
                      className={styles.sliderStatusPill}
                      style={{ background: crit.badgeBg, color: crit.badgeText }}
                    >
                      {status}
                    </span>
                    <span className={styles.sliderNumber} style={{ color: crit.color }}>
                      {val}
                      <span className={styles.sliderMax}>/10</span>
                    </span>
                  </div>
                </div>

                <p className={styles.sliderDescText}>
                  {issue.criteriaDescriptions?.[crit.key as keyof typeof issue.criteriaDescriptions] || crit.sub}
                </p>

                <div className={styles.sliderInputWrapper} style={{ color: crit.color }}>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={val}
                    onChange={(e) => onScoreChange(crit.key, Number(e.target.value))}
                    className={styles.rangeInput}
                    id={`slider-${crit.key}`}
                    style={{
                      background: `linear-gradient(to right, ${crit.color} 0%, ${crit.color} ${
                        ((val - 1) / 9) * 100
                      }%, var(--bg-muted) ${((val - 1) / 9) * 100}%, var(--bg-muted) 100%)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Skor Komposit */}
        <div className={styles.compositeScoreCard}>
          <div className={styles.compositeLeft}>
            <div className={styles.compositeLabel}>Skor Komposit Pribadi</div>
            <div className={styles.compositeVerdict}>
              {getVerdict(compositeScore).detail}
            </div>
          </div>
          <div className={styles.compositeRight}>
            <span className={styles.compositeScoreNumber}>{compositeScore}</span>
            <span className={styles.compositeScoreMax}>/10</span>
          </div>
        </div>

        <div className={styles.actionDock}>
          <button
            className="btn btn-primary btn-full"
            onClick={() => {
              soundService.playTap();
              onNext();
            }}
            id="btn-next-step1"
            style={{ borderRadius: '1rem', padding: '0.875rem' }}
          >
            <span>Lanjut: Penilaian Stakeholder</span>
            <Icon name="arrow_forward" size={18} />
          </button>
        </div>
      </section>
  );
}
