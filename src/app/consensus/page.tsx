'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { MOCK_ISSUES, MOCK_CONSENSUS, DEFAULT_FALLBACK_ISSUE } from '@/data/mock';
import { PolicyIssue } from '@/types';
import { getIssues } from '@/lib/issueService';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/Icon';
import RadarChart from '@/components/RadarChart';
import styles from './consensus.module.css';

function ConsensusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueId = searchParams.get('issue') || 'issue-001';
  const [issue, setIssue] = useState<PolicyIssue>(
    MOCK_ISSUES.find((i) => i.id === issueId) || DEFAULT_FALLBACK_ISSUE
  );
  const [consensus, setConsensus] = useState(
    MOCK_CONSENSUS[issueId] || {
      issueId,
      avgEffectiveness: 6.8,
      avgEfficiency: 5.9,
      avgEquity: 6.5,
      avgResponsiveness: 6.0,
      totalVoters: 142,
      winnerPercentage: 65,
      loserPercentage: 35,
    }
  );

  const [isEvaluated, setIsEvaluated] = useState(true);
  const [personalScores, setPersonalScores] = useState({
    effectiveness: 7.0,
    efficiency: 5.0,
    equity: 4.0,
    responsiveness: 6.0,
  });

  useEffect(() => {
    // Redirect to Leaderboard as requested
    router.replace('/leaderboard');
  }, [router]);

  useEffect(() => {
    getIssues().then((list) => {
      const found = list.find((i) => i.id === issueId);
      if (found) setIssue(found);
    });

    // Fetch dynamic consensus from backend API
    fetch(`/api/consensus?issueId=${encodeURIComponent(issueId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.scores) {
          setConsensus({
            issueId,
            avgEffectiveness: data.scores.effectiveness,
            avgEfficiency: data.scores.efficiency,
            avgEquity: data.scores.equity,
            avgResponsiveness: data.scores.responsiveness,
            totalVoters: data.totalParticipants || 142,
            winnerPercentage: data.winnerPercentage || 65,
            loserPercentage: 100 - (data.winnerPercentage || 65),
          });

          if (data.userScores) {
            setPersonalScores(data.userScores);
          }
          if (data.hasEvaluated !== undefined) {
            setIsEvaluated(Boolean(data.hasEvaluated));
          }
        }
      })
      .catch((err) => console.warn('Live consensus fetch warning:', err));

    const timer = setTimeout(() => {
      const evaluated = localStorage.getItem(`evaluated_${issueId}`);
      const savedEval = localStorage.getItem(`policysnap_eval_${issueId}`);

      if (savedEval) {
        try {
          const parsed = JSON.parse(savedEval);
          if (parsed.scores) {
            setPersonalScores(parsed.scores);
          }
          setIsEvaluated(true);
        } catch {
          setIsEvaluated(true);
        }
      } else if (issueId === 'issue-001') {
        setIsEvaluated(true);
      } else if (evaluated) {
        setIsEvaluated(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [issueId]);

  // Deltas
  const deltas = [
    {
      label: 'Efektivitas',
      user: personalScores.effectiveness,
      pub: consensus.avgEffectiveness,
    },
    {
      label: 'Efisiensi',
      user: personalScores.efficiency,
      pub: consensus.avgEfficiency,
    },
    {
      label: 'Keadilan',
      user: personalScores.equity,
      pub: consensus.avgEquity,
    },
    {
      label: 'Responsivitas',
      user: personalScores.responsiveness,
      pub: consensus.avgResponsiveness,
    },
  ].map((d) => {
    const diff = Number((d.user - d.pub).toFixed(1));
    const status =
      diff > 0.3
        ? `+${diff} Lebih Optimis`
        : diff < -0.3
        ? `${diff} Lebih Kritis`
        : `±0.0 Seimbang`;
    const color = diff > 0.3 ? '#10B981' : diff < -0.3 ? '#F43F5E' : '#6B7280';
    return { ...d, diff, status, color };
  });

  const nationalScore = (
    (consensus.avgEffectiveness +
      consensus.avgEfficiency +
      consensus.avgEquity +
      consensus.avgResponsiveness) /
    4
  ).toFixed(1);

  return (
    <div className="page">
      {/* Top Header */}
      <header className={styles.header}>
        <button
          className="btn btn-ghost"
          onClick={() => router.back()}
          id="btn-back-consensus"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
        >
          <Icon name="arrow_back" size={18} />
          <span>Kembali</span>
        </button>
        <span className={styles.headerTitle}>Dasbor Konsensus</span>
        <div style={{ width: 60 }} />
      </header>

      {/* 1. Header & Topic Overview */}
      <section className={styles.overviewSection}>
        <div className={styles.badgesRow}>
          <div className={styles.categoryPill}>
            <Icon name="local_gas_station" size={14} />
            <span>Subsidi Energi & Transportasi</span>
          </div>
          <div className={styles.votersPill}>
            <span className={styles.pulseDot} />
            <span>{consensus.totalVoters.toLocaleString('id-ID')} Warga Berpartisipasi</span>
          </div>
        </div>

        <h1 className={styles.issueTitle}>Konsensus Publik: {issue.title}</h1>

        <div className={styles.officialRef}>
          <Icon name="verified" size={15} style={{ color: 'var(--primary-coral)' }} />
          <span>Rujukan Resmi: Perpres No. 191/2014 Rev. · BPH Migas & ESDM</span>
        </div>
      </section>

      {/* If locked (Anti-bandwagon mechanism) */}
      {!isEvaluated ? (
        <div className={`${styles.lockedCard} animate-fade-in`}>
          <div className={styles.lockedIconBox}>
            <Icon name="lock" size={32} />
          </div>
          <h2 className={styles.lockedTitle}>Konsensus Terkunci Demi Integritas</h2>
          <p className={styles.lockedDesc}>
            Untuk mencegah <em>bandwagon effect</em> (bias ikut-ikutan), Anda diwajibkan menyelesaikan evaluasi mandiri terlebih dahulu sebelum dapat mengakses agregasi suara publik.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push(`/evaluate?issue=${issueId}`)}
            id="btn-unlock-evaluation"
            style={{ borderRadius: '1rem', padding: '0.875rem 1.5rem', width: '100%', maxWidth: '280px' }}
          >
            Mulai Evaluasi Sekarang →
          </button>
        </div>
      ) : (
        <>
          {/* National Aggregate Scorecard */}
          <div className={styles.nationalCard}>
            <div className={styles.cardGlow} />
            <div className={styles.scorecardTop}>
              <div>
                <span className={styles.scorecardLabel}>Indeks Kebijakan Nasional</span>
                <div className={styles.scoreValRow}>
                  <span className={styles.nationalScore}>{nationalScore}</span>
                  <span className={styles.nationalScoreMax}>/ 10</span>
                </div>
              </div>
              <div className={styles.verdictBadge}>
                <Icon name="info" size={15} />
                <span>Layak Bersyarat</span>
              </div>
            </div>

            <div className={styles.narrativeNote}>
              <Icon name="forum" size={18} style={{ color: 'var(--primary-coral)', flexShrink: 0, marginTop: '2px' }} />
              <p className={styles.narrativeText}>
                <strong style={{ color: 'var(--text-main)' }}>Sentimen Inti:</strong> Publik sepakat subsidi BBM harus tepat sasaran, namun resisten terhadap potensi inflasi logistik pangan dan kendala verifikasi barcode di lapangan.
              </p>
            </div>
          </div>

          {/* 2. Visual Komparasi 4 Dimensi (Radar) */}
          <section className={styles.comparisonCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Visual Komparasi 4 Dimensi</h2>
                <span className={styles.cardSubtitle}>Evaluasi Anda vs Agregat Suara Publik</span>
              </div>
              <div className={styles.cardIconBox}>
                <Icon name="radar" size={20} />
              </div>
            </div>

            {/* Custom Legend */}
            <div className={styles.legendRow}>
              <div className={styles.legendItem}>
                <span className={styles.legendPillCoral} />
                <span style={{ color: 'var(--text-main)' }}>Skor Anda</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendPillMint} />
                <span style={{ color: 'var(--text-secondary)' }}>Rata-rata Publik</span>
              </div>
            </div>

            {/* Chart */}
            <div className={styles.chartContainer}>
              <RadarChart
                userScores={personalScores}
                publicScores={{
                  effectiveness: consensus.avgEffectiveness,
                  efficiency: consensus.avgEfficiency,
                  equity: consensus.avgEquity,
                  responsiveness: consensus.avgResponsiveness,
                }}
              />
            </div>

            {/* Delta Chips Grid */}
            <div className={styles.deltaGrid}>
              {deltas.map((d) => (
                <div key={d.label} className={styles.deltaChip}>
                  <div className={styles.deltaChipTop}>
                    <span className={styles.deltaName}>{d.label}</span>
                    <span className={styles.deltaStatus} style={{ color: d.color }}>
                      {d.status}
                    </span>
                  </div>
                  <div className={styles.deltaScoreRow}>
                    <span className={styles.deltaUserScore}>Anda: {d.user}</span>
                    <span className={styles.deltaPubScore}>Publik: {d.pub}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Stance Distribution Bar */}
          <section className={styles.stanceSection}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle} style={{ fontSize: '0.9375rem' }}>
                  Distribusi Sikap Publik
                </h3>
                <span className={styles.cardSubtitle}>Persentase pendirian warga</span>
              </div>
            </div>

            <div className={styles.distributionBar}>
              <div
                className={styles.distSegment}
                style={{ width: `${consensus.winnerPercentage}%`, background: '#10B981' }}
              >
                {consensus.winnerPercentage}%
              </div>
              <div
                className={styles.distSegment}
                style={{ width: `${100 - consensus.winnerPercentage - 15}%`, background: '#F59E0B' }}
              >
                {100 - consensus.winnerPercentage - 15}%
              </div>
              <div
                className={styles.distSegment}
                style={{ width: '15%', background: '#F43F5E' }}
              >
                15%
              </div>
            </div>

            <div className={styles.distLegend}>
              <div className={styles.distLegendItem}>
                <span className={styles.distDot} style={{ background: '#10B981' }} />
                <span>Dukung Penuh ({consensus.winnerPercentage}%)</span>
              </div>
              <div className={styles.distLegendItem}>
                <span className={styles.distDot} style={{ background: '#F59E0B' }} />
                <span>Bersyarat ({100 - consensus.winnerPercentage - 15}%)</span>
              </div>
              <div className={styles.distLegendItem}>
                <span className={styles.distDot} style={{ background: '#F43F5E' }} />
                <span>Tolak (15%)</span>
              </div>
            </div>
          </section>

          {/* Action CTAs */}
          <div className={styles.actionGroup}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => router.push(`/share?issue=${issueId}`)}
              id="btn-open-share-report"
              style={{ borderRadius: '1rem', padding: '0.875rem' }}
            >
              <Icon name="share" size={18} />
              <span>Buka Raport Visual 9:16 untuk Dibagikan →</span>
            </button>
            <button
              className="btn btn-outline btn-full"
              onClick={() => router.push(`/arguments?issue=${issueId}`)}
              id="btn-view-top-arguments"
              style={{ borderRadius: '1rem', padding: '0.75rem' }}
            >
              <Icon name="forum" size={18} />
              <span>Lihat Diskusi & Top Arguments</span>
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}

export default function ConsensusPage() {
  return (
    <Suspense
      fallback={
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      }
    >
      <ConsensusContent />
    </Suspense>
  );
}
