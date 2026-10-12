'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { MOCK_ISSUES, MOCK_ACTORS } from '@/data/mock';
import { PolicyIssue } from '@/types';
import { getIssues } from '@/lib/issueService';
import BottomNav from '@/components/BottomNav';
import Toast from '@/components/Toast';
import Icon from '@/components/Icon';
import { useAuth } from '@/presentation/hooks/useAuth';
import AuthModal from '@/presentation/components/AuthModal';
import styles from './evaluate.module.css';

// 4 Defined Dimensions with Stitch Warm Tactile Color Schemes
interface DimensionConfig {
  key: 'effectiveness' | 'efficiency' | 'equity' | 'responsiveness';
  label: string;
  sub: string;
  icon: string;
  color: string;
  bgLight: string;
  badgeBg: string;
  badgeText: string;
  getStatus: (v: number) => string;
}

const CRITERIA_CONFIGS: DimensionConfig[] = [
  {
    key: 'effectiveness',
    label: 'Efektivitas',
    sub: 'Target Terukur: Mengurangi salah sasaran subsidi hingga 40%.',
    icon: 'target',
    color: '#10B981',
    bgLight: '#ECFDF5',
    badgeBg: '#ECFDF5',
    badgeText: '#047857',
    getStatus: (v) => (v <= 3 ? 'Kurang Efektif' : v <= 6 ? 'Cukup Efektif' : v <= 8 ? 'Efektif' : 'Sangat Efektif'),
  },
  {
    key: 'efficiency',
    label: 'Efisiensi',
    sub: 'Alokasi Fiskal & Kemudahan Teknis Implementasi di lapangan.',
    icon: 'account_balance_wallet',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    badgeBg: '#FFFBEB',
    badgeText: '#B45309',
    getStatus: (v) => (v <= 3 ? 'Rawan Biaya' : v <= 6 ? 'Moderat' : v <= 8 ? 'Efisien' : 'Sangat Efisien'),
  },
  {
    key: 'equity',
    label: 'Keadilan',
    sub: 'Distribusi Beban: Adilkah bagi pengemudi ojol & UMKM mikro?',
    icon: 'balance',
    color: '#F43F5E',
    bgLight: '#FFF1F2',
    badgeBg: '#FFF1F2',
    badgeText: '#BE123C',
    getStatus: (v) => (v <= 3 ? 'Sangat Timpang' : v <= 6 ? 'Kurang Merata' : v <= 8 ? 'Cukup Adil' : 'Sangat Merata'),
  },
  {
    key: 'responsiveness',
    label: 'Responsivitas',
    sub: 'Ketanggapan terhadap aspirasi publik dan inflasi bahan pokok.',
    icon: 'forum',
    color: '#0EA5E9',
    bgLight: '#F0F9FF',
    badgeBg: '#F0F9FF',
    badgeText: '#0369A1',
    getStatus: (v) => (v <= 3 ? 'Kurang Responsif' : v <= 6 ? 'Cukup Responsif' : v <= 8 ? 'Cepat Tanggap' : 'Sangat Adaptif'),
  },
];

const STANCE_BUTTONS = [
  { value: 'Dukung Penuh', label: 'Dukung Penuh', color: '#10B981' },
  { value: 'Dukung Bersyarat', label: 'Dukung Bersyarat', color: '#FF6B4A' },
  { value: 'Netral', label: 'Netral', color: '#6B7280' },
  { value: 'Tolak Kebijakan', label: 'Tolak Kebijakan', color: '#F43F5E' },
];

const DEFAULT_FALLBACK_ISSUE: PolicyIssue = {
  id: 'issue-001',
  title: 'Evaluasi Skema Subsidi Tepat Sasaran & Efisiensi Energi Daerah',
  summary: 'Penilaian partisipatif terhadap efektivitas dan keadilan distribusi kuota subsidi bahan pokok dan energi, pencegahan kebocoran anggaran, serta proteksi daya beli masyarakat rentan.',
  category: 'Ekonomi & Energi',
  sourceUrl: 'https://kebijakan.go.id',
  actorTags: ['Kementerian ESDM & BPH Migas', 'Pelaku Usaha Mikro & UMKM', 'Masyarakat Desil Rentan', 'Distributor Energi Daerah'],
  status: 'active',
  totalEvaluations: 0,
  createdAt: '2026-10-12',
  criteriaDescriptions: {
    effectiveness: 'Target Terukur: Mengurangi salah sasaran subsidi hingga 40%.',
    efficiency: 'Penghematan Anggaran: Optimalisasi fiskal hingga Rp 12 Triliun.',
    equity: 'Distribusi Berkeadilan: 100% kuota tersalurkan ke kelompok sasaran riil.',
    responsiveness: 'Ketanggapan terhadap aspirasi publik dan stabilitas inflasi pangan.',
  },
  actorCards: [
    {
      id: 'actor-1',
      name: 'Kementerian ESDM & BPH Migas',
      role: 'Regulator Kebijakan',
      description: 'Pengawas kuota energi bersubsidi dan verifikator data sasaran penerima manfaat nasional.',
      imageEmoji: '🏛️',
    },
    {
      id: 'actor-2',
      name: 'Pelaku Usaha Mikro & UMKM',
      role: 'Kelompok Terdampak Langsung',
      description: 'Bergantung pada stabilitas pasokan bahan pokok dan energi murah untuk modal harian.',
      imageEmoji: '💼',
    },
    {
      id: 'actor-3',
      name: 'Masyarakat Desil Rentan',
      role: 'Penerima Manfaat Utama',
      description: 'Konsumen prioritas subsidi agar terlindungi dari gejolak lonjakan inflasi harga kebutuhan pokok.',
      imageEmoji: '👥',
    },
  ],
};

function EvaluateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueId = searchParams.get('issue') || 'issue-001';
  const [issue, setIssue] = useState<PolicyIssue>(
    MOCK_ISSUES.find((i) => i.id === issueId) || DEFAULT_FALLBACK_ISSUE
  );

  const actors = useMemo(() => {
    if (issue.actorCards && issue.actorCards.length > 0) {
      return issue.actorCards;
    }
    if (MOCK_ACTORS[issueId] && MOCK_ACTORS[issueId].length > 0) {
      return MOCK_ACTORS[issueId];
    }
    const emojis = ['🏛️', '💼', '👥', '🏢', '⚖️'];
    return (issue.actorTags || ['Pemerintah', 'Masyarakat']).map((tag, idx) => ({
      id: `actor-${idx + 1}`,
      name: tag,
      role: 'Stakeholder Kunci',
      description: `Pihak sentral yang berkaitan langsung dengan implementasi ${issue.title}.`,
      imageEmoji: emojis[idx % emojis.length],
    }));
  }, [issueId, issue]);

  const [step, setStep] = useState(0); // 0: sliders, 1: swipe actors, 2: stance & comment
  const [userXP, setUserXP] = useState(85);

  // Scores
  const [scores, setScores] = useState({
    effectiveness: 7,
    efficiency: 5,
    equity: 4,
    responsiveness: 6,
  });

  // Actor swipe state
  const [currentActorIndex, setCurrentActorIndex] = useState(0);
  const [actorVotes, setActorVotes] = useState<Record<string, 'approve' | 'reject' | 'neutral'>>({});
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'neutral' | null>(null);

  // Stance & comment
  const [stance, setStance] = useState('Dukung Bersyarat');
  const [comment, setComment] = useState(
    issueId === 'issue-001'
      ? 'Pembatasan tepat sasaran perlu didukung, namun dispensasi wajib diberikan bagi logistik bahan pokok dan UMKM mikro agar tidak memicu lonjakan inflasi pangan daerah.'
      : ''
  );
  const { user: authUser, isAuthenticated } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    getIssues().then((list) => {
      const found = list.find((i) => i.id === issueId);
      if (found) {
        setIssue(found);
        if (found.id !== 'issue-001' && comment.includes('subsidi')) {
          setComment('');
        }
      }
    });

    const timer = setTimeout(() => {
      const storedXP = localStorage.getItem('policysnap_xp');
      if (storedXP) setUserXP(Number(storedXP));
    }, 0);
    return () => clearTimeout(timer);
  }, [issueId]);

  const handleSliderChange = (key: keyof typeof scores, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  // Composite Score
  const compositeScore = Number(
    ((scores.effectiveness + scores.efficiency + scores.equity + scores.responsiveness) / 4).toFixed(1)
  );

  const getCompositeVerdict = (score: number) => {
    if (score < 4) return 'Tidak Layak / Berisiko';
    if (score < 6) return 'Cukup Layak Bersyarat';
    if (score < 8) return 'Layak Direalisasikan';
    return 'Sangat Unggul & Matang';
  };

  const handleSwipe = (direction: 'left' | 'right' | 'neutral') => {
    const actor = actors[currentActorIndex];
    if (!actor) return;

    setSwipeDirection(direction);
    setActorVotes((prev) => ({
      ...prev,
      [actor.id]: direction === 'right' ? 'approve' : direction === 'left' ? 'reject' : 'neutral',
    }));

    setTimeout(() => {
      setSwipeDirection(null);
      if (currentActorIndex < actors.length - 1) {
        setCurrentActorIndex((prev) => prev + 1);
      } else {
        setStep(2);
      }
    }, 280);
  };

  const handleSubmit = () => {
    // US-001 AC-3: Hanya pengguna yang sudah login yang bisa mengirim (submit) penilaian
    if (!isAuthenticated && !authUser) {
      setShowAuthModal(true);
      return;
    }

    if (!stance) {
      setToastMessage('Pilih pendirian evaluasi terlebih dahulu');
      setShowToast(true);
      return;
    }

    const activeUserId = authUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('policysnap_user_id') || 'user-001' : 'user-001');

    if (typeof window !== 'undefined') {
      const evalData = {
        issueId,
        scores,
        actorVotes,
        stance,
        comment,
        compositeScore,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(`policysnap_eval_${issueId}`, JSON.stringify(evalData));
      localStorage.setItem(`evaluated_${issueId}`, 'true');

      // +10 XP locally
      const currentXP = Number(localStorage.getItem('policysnap_xp') || '85');
      const newXP = currentXP + 10;
      localStorage.setItem('policysnap_xp', String(newXP));
      setUserXP(newXP);

      const count = Number(localStorage.getItem('policysnap_eval_count') || '7');
      localStorage.setItem('policysnap_eval_count', String(count + 1));
    }

    // Persist to Backend API (Supabase / Server)
    fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        issueId,
        scores,
        actorVotes,
        stance,
        comment: comment.trim(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.totalXP) {
          setUserXP(data.totalXP);
          if (typeof window !== 'undefined') {
            localStorage.setItem('policysnap_xp', String(data.totalXP));
          }
        }
      })
      .catch((err) => console.warn('Backend evaluation sync warning:', err));

    setShowSuccessModal(true);
  };

  return (
    <div className="page">
      {/* Top Header */}
      <header className={styles.header}>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (step > 0) setStep(step - 1);
            else router.back();
          }}
          id="btn-back-evaluate"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
        >
          <Icon name="arrow_back" size={18} />
          <span>{step === 0 ? 'Kembali' : 'Sebelumnya'}</span>
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

        {/* XP Counter Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF1ED', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #FFEDD5' }}>
          <span style={{ fontSize: '11px' }}>⭐</span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-coral)', fontFamily: 'var(--font-mono)' }}>
            {userXP} XP
          </span>
        </div>
      </header>

      {/* Policy Context Card */}
      <section className={styles.policyCard}>
        <div className={styles.policyBadges}>
          <div className={styles.activeBadge}>
            <span className={styles.pulseDot} />
            <span>Aktif Menilai</span>
          </div>
          <div className={styles.categoryBadge}>
            <Icon name="local_gas_station" size={14} />
            <span>Subsidi & Ekonomi</span>
          </div>
        </div>

        <h1 className={styles.policyTitle}>{issue.title}</h1>

        <div className={styles.policyMeta}>
          <span className={styles.policyRef}>Perpres No. 191/2014 Rev.</span>
          <span>•</span>
          <div className={styles.policySource}>
            <span>Kementerian ESDM & BPH Migas</span>
            <Icon name="verified" size={15} style={{ color: '#2563EB' }} />
          </div>
        </div>

        <p className={styles.policyDesc}>{issue.summary}</p>

        {/* Snapshot Banner with +10 XP Tag */}
        <div className={styles.policyBanner}>
          <div
            className={styles.policyBannerBg}
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80)',
            }}
          />
          <div className={styles.policyBannerOverlay} />
          <div className={styles.policyXpTag}>
            <Icon name="bolt" size={16} style={{ color: '#F59E0B' }} />
            <span>+10 XP Evaluasi Saat Dikirim</span>
          </div>
        </div>
      </section>

      {/* STEP 0: 4-Dimension Slider Matrix */}
      {step === 0 && (
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
                      onChange={(e) => handleSliderChange(crit.key, Number(e.target.value))}
                      className={styles.rangeInput}
                      id={`slider-${crit.key}`}
                      style={{
                        background: `linear-gradient(to right, ${crit.color} 0%, ${crit.color} ${
                          ((val - 1) / 9) * 100
                        }%, #E5E7EB ${((val - 1) / 9) * 100}%, #E5E7EB 100%)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Personal Composite Score Banner */}
          <div className={styles.compositeScoreCard}>
            <div className={styles.compositeLeft}>
              <div className={styles.compositeIconBox}>
                <Icon name="insights" size={22} style={{ color: 'white' }} />
              </div>
              <div>
                <span className={styles.compositeLabel}>Skor Indeks Personal</span>
                <div className={styles.compositeVerdict}>{getCompositeVerdict(compositeScore)}</div>
              </div>
            </div>
            <div className={styles.compositeRight}>
              <span className={styles.compositeScoreVal}>{compositeScore}</span>
              <span className={styles.compositeScoreMax}> / 10</span>
            </div>
          </div>

          {/* Button next */}
          <button
            className="btn btn-primary btn-full"
            onClick={() => setStep(1)}
            id="btn-next-step1"
            style={{ borderRadius: '1rem', padding: '0.875rem' }}
          >
            Lanjut ke Dampak Aktor [2/3] →
          </button>
        </section>
      )}

      {/* STEP 1: Stakeholder Swipe Cards (Tinder Style) */}
      {step === 1 && (
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
              Tentukan posisi dampak tiap aktor kunci: Geser kanan untuk dukung, kiri untuk kritik.
            </p>
          </div>

          {/* Card Deck Visual Container */}
          <div className={styles.deckWrapper}>
            {/* Background stack cards */}
            <div className={styles.bgCardBack} />
            <div className={styles.bgCardMid}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                {actors[(currentActorIndex + 1) % actors.length]?.name || 'Aktor Berikutnya'}
              </span>
              <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                Berikutnya
              </span>
            </div>

            {/* Active Swipeable Card */}
            {actors.length > 0 && currentActorIndex < actors.length && (
              <SwipeCardItem
                actor={actors[currentActorIndex]}
                onSwipe={handleSwipe}
                direction={swipeDirection}
              />
            )}
          </div>

          {/* Tactile Thumb Action Buttons */}
          <div className={styles.tactileButtonGroup}>
            <button
              aria-label="Tolak Dampak Aktor"
              className={styles.thumbBtnReject}
              onClick={() => handleSwipe('left')}
              id="btn-reject-actor"
            >
              <Icon name="close" size={24} />
            </button>
            <button
              aria-label="Netral Aktor"
              className={styles.thumbBtnNeutral}
              onClick={() => handleSwipe('neutral')}
              id="btn-neutral-actor"
            >
              <Icon name="balance" size={20} />
            </button>
            <button
              aria-label="Dukung Dampak Aktor"
              className={styles.thumbBtnSupport}
              onClick={() => handleSwipe('right')}
              id="btn-approve-actor"
            >
              <Icon name="done" size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setStep(0)}
              style={{ fontSize: '0.8125rem' }}
            >
              ← Kembali ke Matriks
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setStep(2)}
              style={{ fontSize: '0.8125rem', borderRadius: '0.75rem' }}
            >
              Lewati Aktor →
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: Official Stance & High-Impact Argument */}
      {step === 2 && (
        <section className={`${styles.stepSection} animate-fade-in`}>
          <div className={styles.stepHeader}>
            <div className={styles.stepTopRow}>
              <span className={styles.stepTag}>
                <span className={styles.stepDotAccent} />
                [3/3] Sikap Resmi & Argumen
              </span>
              <span className={styles.stepDimensionCount} style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                Terbuka Publik
              </span>
            </div>
            <p className={styles.stepInstruction}>
              Pilih pendirian evaluasi Anda dan tuliskan argumen rasional berbasis data.
            </p>
          </div>

          {/* Summary Pills of Previous Steps */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: '#FFF1ED', color: 'var(--primary-coral)', fontSize: '0.75rem', padding: '4px 10px' }}>
              📊 Indeks Personal: {compositeScore}/10
            </span>
            <span className="badge" style={{ background: '#F0FDF4', color: '#16A34A', fontSize: '0.75rem', padding: '4px 10px' }}>
              ✓ {Object.values(actorVotes).filter((v) => v === 'approve').length} Didukung
            </span>
            <span className="badge" style={{ background: '#FFF1F2', color: '#E11D48', fontSize: '0.75rem', padding: '4px 10px' }}>
              ✕ {Object.values(actorVotes).filter((v) => v === 'reject').length} Dikritik
            </span>
          </div>

          {/* Stance Grid */}
          <div className={styles.stanceGrid}>
            {STANCE_BUTTONS.map((opt) => {
              const isActive = stance === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.stanceOptionBtn} ${isActive ? styles.stanceOptionBtnActive : ''}`}
                  onClick={() => setStance(opt.value)}
                  id={`stance-${opt.value.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className={styles.stanceIndicatorDot} style={{ background: opt.color }} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Argument Textarea */}
          <div className={styles.argumentContainer}>
            <div className={styles.argumentLabelRow}>
              <label className={styles.argumentLabel} htmlFor="argumen-input">
                <Icon name="edit_note" size={16} style={{ color: 'var(--primary-coral)' }} />
                Argumen Kunci Kebijakan
              </label>
              <span className={styles.charCounter}>{comment.length} / 200 karakter</span>
            </div>
            <textarea
              id="argumen-input"
              rows={3}
              maxLength={200}
              className={styles.argumentTextarea}
              placeholder="Tuliskan argumen logis berbasis data/fakta (maks 200 karakter)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Upvote Incentive Card */}
          <div className={styles.incentiveCard}>
            <Icon name="military_tech" size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
            <p>
              Argumen bernas dengan upvote tertinggi akan dipajang di panel <strong>Top Arguments</strong> dan menyumbang <span style={{ color: 'var(--primary-coral)', fontWeight: 800 }}>+1 XP</span> per upvote ke Pangkat Level Anda.
            </p>
          </div>

          {/* Submit Button */}
          <div className={styles.submitSection}>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSubmit}
              id="btn-submit-evaluasi"
            >
              <Icon name="bolt" size={20} />
              <span>Kirim Evaluasi & Klaim +10 XP</span>
            </button>
            <div className={styles.submitDisclaimer}>
              <Icon name="verified_user" size={14} style={{ color: '#10B981' }} />
              <span>Diagregasi ke Dasbor Konsensus Publik & Raport Visual 9:16</span>
            </div>
          </div>
        </section>
      )}

      {/* Success Modal Celebration */}
      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} animate-slide-up`}>
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
                onClick={() => router.push(`/consensus?issue=${issueId}`)}
                id="btn-modal-consensus"
                style={{ borderRadius: '1rem', padding: '0.875rem' }}
              >
                Lihat Dasbor Konsensus →
              </button>
              <button
                className="btn btn-outline btn-full"
                onClick={() => router.push(`/share?issue=${issueId}`)}
                id="btn-modal-share"
                style={{ borderRadius: '1rem', padding: '0.75rem' }}
              >
                Buka Raport Visual (9:16)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Gate Modal for submission */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          handleSubmit();
        }}
        title="Masuk untuk Mengirim Evaluasi"
        description="Sesuai standar validitas partisipasi publik PolicySnap, Anda perlu masuk dengan akun terverifikasi Google sebelum mengirim evaluasi."
      />

      {showToast && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setShowToast(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

// Swipe Card Component with Framer Motion
function SwipeCardItem({
  actor,
  onSwipe,
  direction,
}: {
  actor: { id: string; name: string; role: string; description: string; imageEmoji: string };
  onSwipe: (dir: 'left' | 'right' | 'neutral') => void;
  direction: 'left' | 'right' | 'neutral' | null;
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
      {/* Dynamic Watermark Stamps */}
      <motion.div className={styles.stampCritic} style={{ opacity: stampCriticOpacity }}>
        KRITIK / NEGATIF
      </motion.div>
      <motion.div className={styles.stampSupport} style={{ opacity: stampSupportOpacity }}>
        DUKUNG / POSITIF
      </motion.div>

      {/* Top Actor Details */}
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

      {/* Actor Impact Summary */}
      <div className={styles.actorImpactBox}>
        <p className={styles.actorQuote}>&quot;{actor.description}&quot;</p>
      </div>

      {/* Meta Row */}
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

export default function EvaluatePage() {
  return (
    <Suspense
      fallback={
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      }
    >
      <EvaluateContent />
    </Suspense>
  );
}
