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
import SoundToggle from '@/components/SoundToggle';
import { soundService } from '@/lib/soundService';
import { useAuth } from '@/presentation/hooks/useAuth';
import AuthModal from '@/presentation/components/AuthModal';
import styles from './evaluate.module.css';

// 4 Defined Dimensions
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
  { value: 'Dukung Penuh', label: 'Dukung Penuh', color: '#10B981', bg: '#ECFDF5', text: '#047857' },
  { value: 'Dukung Bersyarat', label: 'Dukung Bersyarat', color: '#FF6B4A', bg: '#FFF1ED', text: '#FF6B4A' },
  { value: 'Netral', label: 'Netral', color: '#6B7280', bg: '#F3F4F6', text: '#4B5563' },
  { value: 'Tolak Kebijakan', label: 'Tolak Kebijakan', color: '#F43F5E', bg: '#FFF1F2', text: '#BE123C' },
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

interface EvaluationRecord {
  issueId: string;
  issueTitle: string;
  category: string;
  scores: {
    effectiveness: number;
    efficiency: number;
    equity: number;
    responsiveness: number;
  };
  actorVotes?: Record<string, 'approve' | 'reject' | 'neutral'>;
  stance: string;
  comment: string;
  compositeScore: number;
  timestamp: string;
}

function formatEvalDate(isoStr?: string): string {
  if (!isoStr) return 'Baru saja';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '12 Okt 2026';
  }
}

function EvaluateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitIssueId = searchParams.get('issue');

  // If URL has ?issue=xxx, show studio; otherwise show the clean list of evaluated issues
  const [viewMode, setViewMode] = useState<'results' | 'studio'>(explicitIssueId ? 'studio' : 'results');
  const [currentIssueId, setCurrentIssueId] = useState<string>(explicitIssueId || 'issue-001');
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<EvaluationRecord | null>(null);

  const [issue, setIssue] = useState<PolicyIssue>(
    MOCK_ISSUES.find((i) => i.id === currentIssueId) || DEFAULT_FALLBACK_ISSUE
  );

  const actors = useMemo(() => {
    if (issue.actorCards && issue.actorCards.length > 0) {
      return issue.actorCards;
    }
    if (MOCK_ACTORS[currentIssueId] && MOCK_ACTORS[currentIssueId].length > 0) {
      return MOCK_ACTORS[currentIssueId];
    }
    const emojis = ['🏛️', '💼', '👥', '🏢', '⚖️'];
    return (issue.actorTags || ['Pemerintah', 'Masyarakat']).map((tag, idx) => ({
      id: `actor-${idx + 1}`,
      name: tag,
      role: 'Stakeholder Kunci',
      description: `Pihak sentral yang berkaitan langsung dengan implementasi ${issue.title}.`,
      imageEmoji: emojis[idx % emojis.length],
    }));
  }, [currentIssueId, issue]);

  const [step, setStep] = useState(0); // 0: sliders, 1: swipe actors, 2: stance & comment
  const [userXP, setUserXP] = useState(0);

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
    currentIssueId === 'issue-001'
      ? 'Pembatasan tepat sasaran perlu didukung, namun dispensasi wajib diberikan bagi logistik bahan pokok dan UMKM mikro agar tidak memicu lonjakan inflasi pangan daerah.'
      : ''
  );
  const { user: authUser, isAuthenticated } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load issues and evaluations from localStorage
  useEffect(() => {
    getIssues().then((list) => {
      const found = list.find((i) => i.id === currentIssueId);
      if (found) setIssue(found);

      if (typeof window !== 'undefined') {
        const storedList: EvaluationRecord[] = [];
        const histRaw = localStorage.getItem('policysnap_evaluation_history');
        if (histRaw) {
          try {
            const parsed = JSON.parse(histRaw);
            if (Array.isArray(parsed)) storedList.push(...parsed);
          } catch {}
        }

        // Scan any individual policysnap_eval_ keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('policysnap_eval_') && !key.includes('count') && !key.includes('history')) {
            const rawId = key.replace('policysnap_eval_', '');
            if (!storedList.some((item) => item.issueId === rawId)) {
              try {
                const itemData = JSON.parse(localStorage.getItem(key) || '{}');
                if (itemData && itemData.scores) {
                  const issueRef = list.find((it) => it.id === rawId);
                  storedList.push({
                    issueId: rawId,
                    issueTitle: issueRef?.title || rawId,
                    category: issueRef?.category || 'Kebijakan Publik',
                    scores: itemData.scores,
                    compositeScore: itemData.compositeScore || 6.5,
                    stance: itemData.stance || 'Dukung Bersyarat',
                    comment: itemData.comment || '',
                    timestamp: itemData.timestamp || new Date().toISOString(),
                    actorVotes: itemData.actorVotes,
                  });
                }
              } catch {}
            }
          }
        }

        // Enrich with issue titles
        const enriched = storedList.map((item) => {
          const foundIssue = list.find((it) => it.id === item.issueId);
          return {
            ...item,
            issueTitle: item.issueTitle || foundIssue?.title || 'Evaluasi Kebijakan',
            category: item.category || foundIssue?.category || 'Umum',
          };
        });

        setEvaluations(enriched);
      }
    });

    if (typeof window !== 'undefined') {
      const storedXP = localStorage.getItem('policysnap_xp');
      if (storedXP) setUserXP(Number(storedXP));
    }
  }, [currentIssueId]);

  const handleSliderChange = (key: keyof typeof scores, val: number) => {
    soundService.playTap();
    setScores((prev) => ({ ...prev, [key]: val }));
  };

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
    soundService.playTap();
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

    const evalData: EvaluationRecord = {
      issueId: currentIssueId,
      issueTitle: issue.title,
      category: issue.category || 'Kebijakan Publik',
      scores,
      actorVotes,
      stance,
      comment,
      compositeScore,
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`policysnap_eval_${currentIssueId}`, JSON.stringify(evalData));
      localStorage.setItem(`evaluated_${currentIssueId}`, 'true');

      const nextHistory = [evalData, ...evaluations.filter((it) => it.issueId !== currentIssueId)];
      localStorage.setItem('policysnap_evaluation_history', JSON.stringify(nextHistory));
      setEvaluations(nextHistory);

      const currentXP = Number(localStorage.getItem('policysnap_xp') || '0');
      const newXP = currentXP + 10;
      localStorage.setItem('policysnap_xp', String(newXP));
      setUserXP(newXP);

      const count = Number(localStorage.getItem('policysnap_eval_count') || '0');
      localStorage.setItem('policysnap_eval_count', String(count + 1));
    }

    soundService.playSuccess();

    fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        issueId: currentIssueId,
        scores,
        actorVotes,
        stance,
        comment: comment.trim(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.totalXP !== undefined) {
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
      {/* ========================================================
          TAMPILAN 1: DAFTAR ISU YANG TELAH DIEVALUASI (FOKUS & RAPI)
          ======================================================== */}
      {viewMode === 'results' ? (
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
              <SoundToggle />
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FFF1ED', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #FFEDD5' }}>
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
                          {item.compositeScore} <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>/10</span>
                        </span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', marginLeft: '6px' }}>
                          {getCompositeVerdict(item.compositeScore)}
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
                      <div className={styles.evalDimMiniItem} style={{ background: '#ECFDF5', color: '#047857' }}>
                        <span className={styles.evalDimMiniName}>Efektivitas</span>
                        <span className={styles.evalDimMiniVal}>{item.scores.effectiveness}</span>
                      </div>
                      <div className={styles.evalDimMiniItem} style={{ background: '#FFFBEB', color: '#B45309' }}>
                        <span className={styles.evalDimMiniName}>Efisiensi</span>
                        <span className={styles.evalDimMiniVal}>{item.scores.efficiency}</span>
                      </div>
                      <div className={styles.evalDimMiniItem} style={{ background: '#FFF1F2', color: '#BE123C' }}>
                        <span className={styles.evalDimMiniName}>Keadilan</span>
                        <span className={styles.evalDimMiniVal}>{item.scores.equity}</span>
                      </div>
                      <div className={styles.evalDimMiniItem} style={{ background: '#F0F9FF', color: '#0369A1' }}>
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
                          setSelectedDetail(item);
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
                          router.push(`/share?issue=${item.issueId}`);
                        }}
                        id={`btn-share-${item.issueId}`}
                      >
                        <Icon name="share" size={14} />
                        <span>Raport 9:16</span>
                      </button>

                      <button
                        type="button"
                        className={styles.evalActionBtn}
                        onClick={() => {
                          soundService.playTap();
                          router.push(`/consensus?issue=${item.issueId}`);
                        }}
                        id={`btn-consensus-${item.issueId}`}
                      >
                        <Icon name="bar_chart" size={14} />
                        <span>Konsensus</span>
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
      ) : (
        /* ========================================================
            TAMPILAN 2: STUDIO EVALUASI (Jika Tiba dari Beranda)
            ======================================================== */
        <div>
          {/* Header Studio */}
          <header className={styles.header}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                soundService.playTap();
                if (step > 0) setStep(step - 1);
                else setViewMode('results');
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FFF1ED', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #FFEDD5' }}>
                <span style={{ fontSize: '11px' }}>⭐</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-coral)', fontFamily: 'var(--font-mono)' }}>
                  {userXP} XP
                </span>
              </div>
            </div>
          </header>

          {/* Policy Card */}
          <section className={styles.policyCard}>
            <div className={styles.policyBadges}>
              <div className={styles.activeBadge}>
                <span className={styles.pulseDot} />
                <span>Aktif Menilai</span>
              </div>
              <div className={styles.categoryBadge}>
                <Icon name="local_gas_station" size={14} />
                <span>{issue.category}</span>
              </div>
            </div>

            <h1 className={styles.policyTitle}>{issue.title}</h1>
            <p className={styles.policyDesc}>{issue.summary}</p>
          </section>

          {/* STEP 0: 4 Sliders */}
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

              {/* Skor Komposit */}
              <div className={styles.compositeScoreCard}>
                <div className={styles.compositeLeft}>
                  <div className={styles.compositeLabel}>Skor Komposit Pribadi</div>
                  <div className={styles.compositeVerdict}>
                    {getCompositeVerdict(compositeScore)}
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
                    setStep(1);
                  }}
                  id="btn-next-step1"
                  style={{ borderRadius: '1rem', padding: '0.875rem' }}
                >
                  <span>Lanjut: Penilaian Stakeholder</span>
                  <Icon name="arrow_forward" size={18} />
                </button>
              </div>
            </section>
          )}

          {/* STEP 1: Swipe Actor */}
          {step === 1 && (
            <section className={`${styles.stepSection} animate-fade-in`}>
              <div className={styles.stepHeader}>
                <div className={styles.stepTopRow}>
                  <span className={styles.stepTag}>
                    <span className={styles.stepDotAccent} />
                    [2/3] Uji Dampak Stakeholder
                  </span>
                  <span className={styles.stepDimensionCount}>
                    {currentActorIndex + 1} / {actors.length} Pihak
                  </span>
                </div>
                <p className={styles.stepInstruction}>
                  Geser kartu ke kanan untuk DUKUNG, atau ke kiri untuk KRITIK dampak terhadap pihak ini.
                </p>
              </div>

              <div className={styles.swipeStage}>
                {actors[currentActorIndex] ? (
                  <SwipeCardItem
                    key={actors[currentActorIndex].id}
                    actor={actors[currentActorIndex]}
                    onSwipe={handleSwipe}
                    direction={swipeDirection}
                  />
                ) : (
                  <div className={styles.swipeEmpty}>Semua pihak telah dinilai.</div>
                )}
              </div>

              <div className={styles.swipeButtonGroup}>
                <button
                  className={styles.swipeBtnReject}
                  onClick={() => handleSwipe('left')}
                  id="btn-swipe-reject"
                  title="Kritik"
                >
                  <Icon name="thumb_down" size={24} />
                  <span>Kritik</span>
                </button>
                <button
                  className={styles.swipeBtnNeutral}
                  onClick={() => handleSwipe('neutral')}
                  id="btn-swipe-neutral"
                  title="Netral"
                >
                  <Icon name="remove" size={20} />
                  <span>Netral</span>
                </button>
                <button
                  className={styles.swipeBtnApprove}
                  onClick={() => handleSwipe('right')}
                  id="btn-swipe-approve"
                  title="Dukung"
                >
                  <Icon name="thumb_up" size={24} />
                  <span>Dukung</span>
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    soundService.playTap();
                    setStep(2);
                  }}
                  id="btn-skip-actors"
                  style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                >
                  Lewati tahap aktor →
                </button>
              </div>
            </section>
          )}

          {/* STEP 2: Sikap & Argumen */}
          {step === 2 && (
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
                      setStance(s.value);
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
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className={styles.submitCard}>
                <button
                  className={`btn btn-primary btn-full ${styles.submitBtn}`}
                  onClick={handleSubmit}
                  id="btn-submit-evaluation"
                >
                  <Icon name="bolt" size={20} />
                  <span>Kirim Evaluasi &amp; Klaim +10 XP</span>
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL DETAIL LAPORAN EVALUASI
          ======================================================== */}
      {selectedDetail && (
        <div className={styles.modalOverlay} onClick={() => setSelectedDetail(null)}>
          <div className={styles.reviewModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <div>
                <span className={styles.evalCategoryBadge}>{selectedDetail.category}</span>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-main)', margin: '6px 0 2px 0' }}>
                  {selectedDetail.issueTitle}
                </h3>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  Dinilai pada {formatEvalDate(selectedDetail.timestamp)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Skor Komposit & Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block', fontWeight: 700 }}>
                  Skor Komposit Anda
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-coral)', fontFamily: 'var(--font-mono)' }}>
                  {selectedDetail.compositeScore} <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/10</span>
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block', fontWeight: 700 }}>
                  Sikap Penilaian
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#047857' }}>
                  {selectedDetail.stance}
                </span>
              </div>
            </div>

            {/* Rincian 4 Dimensi */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                Rincian 4 Dimensi Kebijakan
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#475569' }}>Efektivitas Target</span>
                  <span style={{ fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                    {selectedDetail.scores.effectiveness}/10
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#475569' }}>Efisiensi Anggaran</span>
                  <span style={{ fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                    {selectedDetail.scores.efficiency}/10
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#475569' }}>Keadilan Distribusi</span>
                  <span style={{ fontWeight: 800, color: '#F43F5E', fontFamily: 'var(--font-mono)' }}>
                    {selectedDetail.scores.equity}/10
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#475569' }}>Responsivitas Aspirasi</span>
                  <span style={{ fontWeight: 800, color: '#0EA5E9', fontFamily: 'var(--font-mono)' }}>
                    {selectedDetail.scores.responsiveness}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Argumen */}
            {selectedDetail.comment && (
              <div style={{ background: '#FFFBF9', borderLeft: '3px solid var(--primary-coral)', padding: '10px 12px', borderRadius: '0 8px 8px 0' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary-coral)', display: 'block', marginBottom: '4px' }}>
                  Argumen Analisis Anda:
                </span>
                <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0, fontStyle: 'italic', lineHeight: 1.45 }}>
                  &ldquo;{selectedDetail.comment}&rdquo;
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
                  router.push(`/share?issue=${selectedDetail.issueId}`);
                }}
                style={{ borderRadius: '12px', padding: '10px' }}
              >
                <Icon name="share" size={16} />
                <span>Buka Raport Visual 9:16 (Share)</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={() => {
                  soundService.playTap();
                  router.push(`/consensus?issue=${selectedDetail.issueId}`);
                }}
                style={{ borderRadius: '12px', padding: '10px' }}
              >
                <Icon name="bar_chart" size={16} />
                <span>Bandingkan dengan Konsensus Publik</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
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
                onClick={() => {
                  soundService.playTap();
                  setShowSuccessModal(false);
                  setViewMode('results');
                }}
                id="btn-modal-see-results"
                style={{ borderRadius: '1rem', padding: '0.875rem' }}
              >
                Lihat Daftar Evaluasi Saya →
              </button>
              <button
                className="btn btn-outline btn-full"
                onClick={() => router.push(`/share?issue=${currentIssueId}`)}
                id="btn-modal-share"
                style={{ borderRadius: '1rem', padding: '0.75rem' }}
              >
                Buka Raport Visual (9:16)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Gate Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          handleSubmit();
        }}
        title="Masuk untuk Mengirim Evaluasi"
        description="Sesuai standar validitas partisipasi publik PolicySnap, Anda perlu masuk dengan akun terverifikasi sebelum mengirim evaluasi."
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

// Swipe Card Component
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
      <motion.div className={styles.stampCritic} style={{ opacity: stampCriticOpacity }}>
        KRITIK / NEGATIF
      </motion.div>
      <motion.div className={styles.stampSupport} style={{ opacity: stampSupportOpacity }}>
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
