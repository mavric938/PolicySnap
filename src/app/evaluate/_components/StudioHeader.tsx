'use client';

import Icon from '@/components/Icon';
import SoundToggle from '@/components/SoundToggle';
import { soundService } from '@/lib/soundService';
import styles from '../evaluate.module.css';

interface StudioHeaderProps {
  step: number;
  userXP: number;
  onBack: () => void;
}

export default function StudioHeader({ step, userXP, onBack }: StudioHeaderProps) {
  return (
      <header className={styles.header}>
        <button
          className="btn btn-ghost"
          onClick={() => {
            soundService.playTap();
            onBack();
          }}
          id="btn-back-evaluate"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
        >
          <Icon name="arrow_back" size={18} />
          <span>{step === 0 ? 'Daftar Evaluasi' : 'Sebelumnya'}</span>
        </button>

        {/* Step indicator dots */}
        <div className={styles.stepIndicator}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${styles.stepDot} ${i === step ? styles.stepDotActive : ''} ${i < step ? styles.stepDotDone : ''}`}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SoundToggle />
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--tint-primary)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--tint-primary-border)' }}>
            <span style={{ fontSize: '11px' }}>⭐</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-coral)', fontFamily: 'var(--font-mono)' }}>
              {userXP} XP
            </span>
          </div>
        </div>
      </header>
  );
}
