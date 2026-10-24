'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Icon from '@/components/Icon';
import { soundService } from '@/lib/soundService';
import type { ActorCard } from '@/types';
import type { SwipeDirection } from './evaluateConfig';
import styles from '../evaluate.module.css';

interface ActorSwipeStepProps {
  actors: ActorCard[];
  currentActorIndex: number;
  swipeDirection: SwipeDirection | null;
  onSwipe: (direction: SwipeDirection) => void;
  onSkip: () => void;
}

/** Langkah 2/3: kartu aktor ala Tinder (geser kanan dukung, kiri kritik). */
export default function ActorSwipeStep({
  actors,
  currentActorIndex,
  swipeDirection,
  onSwipe,
  onSkip,
}: ActorSwipeStepProps) {
  return (
      <section className={`${styles.stepSection} animate-fade-in`}>
        <div className={styles.stepHeader}>
          <div className={styles.stepTopRow}>
            <span className={styles.stepTag}>
              <span className={styles.stepDotAccent} />
              [2/3] Dampak Aktor Kebijakan
            </span>
            <span className={styles.stepDimensionCount}>
              {currentActorIndex + 1} dari {actors.length} Aktor
            </span>
          </div>
          <p className={styles.stepInstruction}>
            Tentukan posisi dampak tiap aktor kunci: Geser kanan untuk DUKUNG, kiri untuk KRITIK.
          </p>
        </div>

        {/* Tinder Card Deck Visual Deck (3-Layer Stack) */}
        <div className={styles.deckWrapper}>
          {/* Background Card 2 (Bottom Stack) */}
          <div className={styles.bgCardBack} />

          {/* Background Card 1 (Middle Stack with Preview of Next Actor) */}
          <div className={styles.bgCardMid}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '18px' }}>
                {actors[currentActorIndex + 1]?.imageEmoji || '⚖️'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>
                {actors[currentActorIndex + 1]?.name || 'Fiskal & Regulasi Kebijakan'}
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
              }}
            >
              Berikutnya
            </span>
          </div>

          {/* Active Front Card */}
          {actors[currentActorIndex] ? (
            <SwipeCardItem
              key={actors[currentActorIndex].id}
              actor={actors[currentActorIndex]}
              onSwipe={onSwipe}
              direction={swipeDirection}
            />
          ) : (
            <div className={styles.swipeEmpty}>Semua pihak telah dinilai.</div>
          )}
        </div>

        {/* Tactile Action Buttons strictly matching Stitch */}
        <div className={styles.tactileButtonGroup}>
          <button
            className={styles.thumbBtnReject}
            onClick={() => onSwipe('left')}
            id="btn-swipe-reject"
            aria-label="Tolak atau Kritik Dampak Aktor"
            title="Kritik / Negatif"
          >
            <Icon name="close" size={24} />
          </button>
          <button
            className={styles.thumbBtnNeutral}
            onClick={() => onSwipe('neutral')}
            id="btn-swipe-neutral"
            aria-label="Netral Aktor Kebijakan"
            title="Netral"
          >
            <Icon name="balance" size={20} />
          </button>
          <button
            className={styles.thumbBtnSupport}
            onClick={() => onSwipe('right')}
            id="btn-swipe-approve"
            aria-label="Dukung atau Positif Dampak Aktor"
            title="Dukung / Positif"
          >
            <Icon name="done" size={24} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              soundService.playTap();
              onSkip();
            }}
            id="btn-skip-actors"
            style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
          >
            Lewati tahap aktor →
          </button>
        </div>
      </section>
  );
}

// Swipe Card Component
function SwipeCardItem({
  actor,
  onSwipe,
  direction,
}: {
  actor: ActorCard;
  onSwipe: (dir: SwipeDirection) => void;
  direction: SwipeDirection | null;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const stampCriticOpacity = useTransform(x, [-120, -20], [1, 0]);
  const stampSupportOpacity = useTransform(x, [20, 120], [0, 1]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 80) {
      onSwipe('right');
    } else if (info.offset.x < -80) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      className={styles.tinderCard}
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={
        direction === 'right'
          ? { x: 300, opacity: 0, rotate: 15 }
          : direction === 'left'
          ? { x: -300, opacity: 0, rotate: -15 }
          : direction === 'neutral'
          ? { y: 200, opacity: 0 }
          : { x: 0, y: 0, opacity: 1 }
      }
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      id={`actor-card-${actor.id}`}
    >
      <motion.div
        className={styles.stampCritic}
        style={{ opacity: direction === 'left' ? 1 : stampCriticOpacity }}
      >
        KRITIK / NEGATIF
      </motion.div>
      <motion.div
        className={styles.stampSupport}
        style={{ opacity: direction === 'right' ? 1 : stampSupportOpacity }}
      >
        DUKUNG / POSITIF
      </motion.div>

      <div className={styles.actorHeader}>
        <div className={styles.actorAvatarBox}>{actor.imageEmoji}</div>
        <div className={styles.actorInfo}>
          <h3 className={styles.actorName}>{actor.name}</h3>
          <div className={styles.actorRolePill}>
            <Icon name="person" size={13} />
            <span>{actor.role}</span>
          </div>
        </div>
      </div>

      <div className={styles.actorImpactBox}>
        <p className={styles.actorQuote}>&quot;{actor.description}&quot;</p>
      </div>

      <div className={styles.actorMetaRow}>
        <div className={styles.actorSensitivity}>
          <span className={styles.actorSensitivityDot} />
          <span>Sensitivitas: Tinggi</span>
        </div>
        <span className={styles.actorPop}>Dampak Populasi Masif</span>
      </div>
    </motion.div>
  );
}
