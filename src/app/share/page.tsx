'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { MOCK_ISSUES, MOCK_CONSENSUS, MOCK_USER, getRankForXP, DEFAULT_FALLBACK_ISSUE } from '@/data/mock';
import Toast from '@/components/Toast';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/Icon';
import { PolicyIssue, CatProfile } from '@/types';
import { getIssues } from '@/lib/issueService';
import { DEFAULT_CAT_PROFILE, getSavedCatProfile } from '@/data/catCostumes';
import CatAvatar from '@/components/CatAvatar';
import styles from './share.module.css';

function ShareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueId = searchParams.get('issue') || 'issue-001';
  const [issue, setIssue] = useState<PolicyIssue>(
    MOCK_ISSUES.find((i) => i.id === issueId) || DEFAULT_FALLBACK_ISSUE
  );
  const consensus = MOCK_CONSENSUS[issueId] || {
    issueId,
    avgEffectiveness: 6.8,
    avgEfficiency: 5.9,
    avgEquity: 6.5,
    avgResponsiveness: 6.0,
    totalVoters: issue?.totalEvaluations || 142,
    winnerPercentage: 65,
    loserPercentage: 35,
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [userXP, setUserXP] = useState(MOCK_USER.totalXP);
  const [catProfile, setCatProfile] = useState<CatProfile>(DEFAULT_CAT_PROFILE);
  const [personalScores, setPersonalScores] = useState({
    effectiveness: 7.0,
    efficiency: 5.0,
    equity: 4.0,
    responsiveness: 6.0,
  });
  const [userStance, setUserStance] = useState('Dukung Bersyarat');
  const [userComment, setUserComment] = useState(
    'Batasan CC logis secara fiskal, namun dispensasi wajib bagi armada logistik bahan pokok & UMKM mikro agar tidak memicu lonjakan inflasi daerah.'
  );

  useEffect(() => {
    getIssues().then((list) => {
      const found = list.find((i) => i.id === issueId);
      if (found) setIssue(found);
    });

    const timer = setTimeout(() => {
      const savedXP = localStorage.getItem('policysnap_xp');
      if (savedXP) setUserXP(Number(savedXP));

      const savedCat = getSavedCatProfile();
      setCatProfile(savedCat);

      const savedEval = localStorage.getItem(`policysnap_eval_${issueId}`);
      if (savedEval) {
        try {
          const parsed = JSON.parse(savedEval);
          if (parsed.scores) setPersonalScores(parsed.scores);
          if (parsed.stance) setUserStance(parsed.stance);
          if (parsed.comment) setUserComment(parsed.comment);
        } catch (e) {
          console.error(e);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [issueId]);

  const user = { ...MOCK_USER, totalXP: userXP };
  const rankInfo = getRankForXP(user.totalXP);

  // SVG Radar coordinates calculations (Center 100, 100; scale: 8px per point, max 10 = 80px)
  const userTop = 100 - personalScores.effectiveness * 8;
  const userRight = 100 + personalScores.efficiency * 8;
  const userBottom = 100 + personalScores.equity * 8;
  const userLeft = 100 - personalScores.responsiveness * 8;

  const pubTop = 100 - consensus.avgEffectiveness * 8;
  const pubRight = 100 + consensus.avgEfficiency * 8;
  const pubBottom = 100 + consensus.avgEquity * 8;
  const pubLeft = 100 - consensus.avgResponsiveness * 8;

  const compositeScore = (
    (personalScores.effectiveness +
      personalScores.efficiency +
      personalScores.equity +
      personalScores.responsiveness) /
    4
  ).toFixed(1);

  const getVerdictText = (val: number) => {
    if (val < 4) return 'Tidak Layak';
    if (val < 6) return 'Cukup Bersyarat';
    if (val < 8) return 'Layak Diterapkan';
    return 'Sangat Layak';
  };

  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2.5,
        useCORS: true,
        logging: false,
      });
      return canvas;
    } catch (err) {
      console.error('Canvas error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const canvas = await generateCanvas();
    if (!canvas) {
      setToastMsg('Gagal menghasilkan gambar');
      setShowToast(true);
      return;
    }

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `PolicySnap-Report-Card-${issueId}.png`;
    link.click();
    setToastMsg('Raport Visual 9:16 berhasil diunduh! ⬇️');
    setShowToast(true);
  };

  const handleSocialShare = (platform: string) => {
    setToastMsg(`Membuka format ekspor untuk ${platform}...`);
    setShowToast(true);
    handleDownload();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/consensus?issue=${issueId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setToastMsg('Tautan raport interaktif berhasil disalin! 📋');
        setShowToast(true);
      });
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <header className={styles.header}>
        <button
          className="btn btn-ghost"
          onClick={() => router.back()}
          id="btn-back-share"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
        >
          <Icon name="arrow_back" size={18} />
          <span>Kembali</span>
        </button>
        <span className={styles.headerTitle}>Digital Report Card</span>
        <div style={{ width: 60 }} />
      </header>

      {/* 9:16 Card Container */}
      <div className={styles.cardContainer}>
        <div className={`${styles.reportCard} animate-fade-in`} ref={cardRef} id="report-card">
          <div className={styles.cardGlow1} />
          <div className={styles.cardGlow2} />

          {/* 1. Header Bar */}
          <div className={styles.cardTopBar}>
            <div className={styles.brandGroup}>
              <div className={styles.brandIcon}>
                <Icon name="policy" size={16} style={{ color: 'white' }} />
              </div>
              <span className={styles.brandName}>PolicySnap</span>
            </div>
            <span className={styles.evalTag}>#EVAL-084</span>
          </div>

          {/* 2. Analyst Info Card */}
          <div className={styles.analystCard}>
            <div
              className={styles.analystAvatar}
              style={{
                overflow: 'hidden',
                padding: 0,
                border: '2px solid #FF6B4A',
                background: '#FFF1ED',
              }}
            >
              <CatAvatar profile={catProfile} size={42} showBackground={false} animate={false} />
              <span className={styles.analystDot} />
            </div>
            <div className={styles.analystDetails}>
              <div className={styles.analystNameRow}>
                <span className={styles.analystName}>
                  {user.name} <span style={{ fontSize: '0.75rem', color: '#EA580C', fontWeight: 600 }}>({catProfile.name})</span>
                </span>
                <span className={styles.verifiedPill}>
                  <Icon name="verified" size={11} />
                  Terverifikasi
                </span>
              </div>
              <span className={styles.analystRank}>
                ⭐ LVL {rankInfo.level} · {rankInfo.name}
              </span>
            </div>
          </div>

          {/* 3. Policy Headline */}
          <div className={styles.policyHeader}>
            <span className={styles.policyBadge}>
              <Icon name="local_gas_station" size={11} />
              Subsidi Energi & Transportasi
            </span>
            <h1 className={styles.policyTitle}>{issue.title}</h1>
            <span className={styles.policyRef}>
              Rujukan Resmi: Perpres No. 191/2014 Rev.
            </span>
          </div>

          {/* 4. Radar Comparison Graphic (Vector SVG) */}
          <div className={styles.radarContainer}>
            <div className={styles.radarLegendRow}>
              <div className={styles.radarLegendYou}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-coral)' }} />
                <span>Skor Anda ({compositeScore})</span>
              </div>
              <div className={styles.radarLegendPub}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} />
                <span>Publik (6.1)</span>
              </div>
            </div>

            <svg className={styles.radarGraphic} viewBox="0 0 200 200">
              {/* Background Guideline Diamonds */}
              <polygon fill="none" points="100,20 180,100 100,180 20,100" stroke="#E2E8F0" strokeWidth="1" />
              <polygon fill="none" points="100,45 155,100 100,155 45,100" stroke="#E2E8F0" strokeWidth="1" />
              <polygon fill="none" points="100,70 130,100 100,130 70,100" stroke="#E2E8F0" strokeWidth="1" />
              <line stroke="#E2E8F0" strokeDasharray="2,2" strokeWidth="1" x1="100" x2="100" y1="20" y2="180" />
              <line stroke="#E2E8F0" strokeDasharray="2,2" strokeWidth="1" x1="20" x2="180" y1="100" y2="100" />

              {/* Public Consensus Polygon (Dotted Blue) */}
              <polygon
                fill="none"
                opacity="0.85"
                points={`100,${pubTop} ${pubRight},100 100,${pubBottom} ${pubLeft},100`}
                stroke="#2563EB"
                strokeDasharray="4,3"
                strokeWidth="1.8"
              />

              {/* User Radar Polygon (Filled Coral) */}
              <polygon
                fill="#FF6B4A"
                fillOpacity="0.25"
                points={`100,${userTop} ${userRight},100 100,${userBottom} ${userLeft},100`}
                stroke="#C2410C"
                strokeWidth="2.5"
              />

              {/* User Points */}
              <circle cx="100" cy={userTop} fill="#C2410C" r="3.5" />
              <circle cx={userRight} cy="100" fill="#C2410C" r="3.5" />
              <circle cx="100" cy={userBottom} fill="#C2410C" r="3.5" />
              <circle cx={userLeft} cy="100" fill="#C2410C" r="3.5" />

              {/* Dimension Labels */}
              <text fill="#1F2937" fontSize="8.5" fontWeight="700" textAnchor="middle" x="100" y="14">
                Efektivitas ({personalScores.effectiveness})
              </text>
              <text fill="#1F2937" fontSize="8.5" fontWeight="700" textAnchor="end" x="196" y="103">
                Efisiensi ({personalScores.efficiency})
              </text>
              <text fill="#1F2937" fontSize="8.5" fontWeight="700" textAnchor="middle" x="100" y="196">
                Keadilan ({personalScores.equity})
              </text>
              <text fill="#1F2937" fontSize="8.5" fontWeight="700" textAnchor="start" x="4" y="103">
                Respons ({personalScores.responsiveness})
              </text>
            </svg>

            {/* Composite Score Banner */}
            <div className={styles.scoreBanner}>
              <div className={styles.scoreBannerLeft}>
                <span className={styles.pulseScoreDot} />
                <span>Skor Indeks Total</span>
              </div>
              <div className={styles.scoreBannerRight}>
                <span className={styles.scoreBannerVal}>{compositeScore}</span>
                <span className={styles.scoreBannerMax}>/ 10</span>
                <span className={styles.scoreBannerPill}>
                  {getVerdictText(Number(compositeScore))}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Key Argument Quote Card */}
          <div className={styles.argumentCard}>
            <div className={styles.argTop}>
              <span className={styles.argLabel}>
                <Icon name="format_quote" size={13} style={{ color: 'var(--primary-coral)' }} />
                Argumen Kunci Anda
              </span>
              <span className={styles.argStanceBadge}>{userStance}</span>
            </div>
            <p className={styles.argQuote}>&quot;{userComment}&quot;</p>
          </div>

          {/* 6. Footer & Stylized QR Mechanism */}
          <div className={styles.cardFooterRow}>
            <div className={styles.qrContainer}>
              <div className={styles.qrBox}>
                <svg className="w-8 h-8 text-slate-800" fill="currentColor" viewBox="0 0 44 44" style={{ width: '38px', height: '38px' }}>
                  <rect fill="none" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" width="12" x="2" y="2" />
                  <rect fill="currentColor" height="5" rx="1" width="5" x="5.5" y="5.5" />
                  <rect fill="none" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" width="12" x="30" y="2" />
                  <rect fill="currentColor" height="5" rx="1" width="5" x="33.5" y="5.5" />
                  <rect fill="none" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" width="12" x="2" y="30" />
                  <rect fill="currentColor" height="5" rx="1" width="5" x="5.5" y="33.5" />
                  <rect height="3" rx="0.5" width="3" x="18" y="4" />
                  <rect height="3" rx="0.5" width="3" x="24" y="6" />
                  <rect height="3" rx="0.5" width="3" x="18" y="12" />
                  <rect height="3" rx="0.5" width="3" x="24" y="14" />
                  <rect height="4" rx="0.5" width="8" x="18" y="20" />
                  <rect height="4" rx="0.5" width="4" x="30" y="20" />
                  <rect height="4" rx="0.5" width="4" x="38" y="20" />
                  <rect height="4" rx="0.5" width="4" x="18" y="30" />
                  <rect height="4" rx="0.5" width="6" x="26" y="30" />
                  <rect height="6" rx="0.5" width="6" x="36" y="32" />
                </svg>
              </div>
              <div className={styles.qrTextGroup}>
                <span className={styles.qrTitle}>Scan untuk Adu Skor</span>
                <span className={styles.qrUrl}>policysnap.id/eval/bbm-191</span>
              </div>
            </div>

            <div className={styles.brandCivic}>
              <span className={styles.civicTag}>CIVIC TECH INDONESIA</span>
              <span className={styles.civicHashtag}>#SuaraBerdasar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share & Export Dock Controls */}
      <div className={styles.shareDock}>
        <div className={styles.socialRow}>
          <button
            type="button"
            className={styles.socialBtn}
            onClick={() => handleSocialShare('Instagram Story')}
          >
            <Icon name="camera_alt" size={15} style={{ color: '#E1306C' }} />
            <span>IG Story</span>
          </button>
          <button
            type="button"
            className={styles.socialBtn}
            onClick={() => handleSocialShare('X (Twitter)')}
          >
            <span style={{ fontWeight: 900, fontSize: '13px' }}>𝕏</span>
            <span>Post ke 𝕏</span>
          </button>
          <button
            type="button"
            className={styles.socialBtn}
            onClick={() => handleSocialShare('WhatsApp')}
          >
            <Icon name="chat" size={15} style={{ color: '#10B981' }} />
            <span>WhatsApp</span>
          </button>
        </div>

        <button
          type="button"
          className={styles.downloadBtn}
          onClick={handleDownload}
          disabled={isGenerating}
          id="btn-download-report-card"
        >
          <Icon name="download" size={18} />
          <span>{isGenerating ? 'Menyiapkan Gambar...' : 'Simpan Gambar (PNG 9:16)'}</span>
        </button>

        <button
          type="button"
          className={styles.copyLinkBtn}
          onClick={handleCopyLink}
          id="btn-copy-interactive-link"
        >
          <Icon name="link" size={16} />
          <span>Salin Tautan Raport Interaktif</span>
        </button>
      </div>

      {showToast && (
        <Toast
          message={toastMsg}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
