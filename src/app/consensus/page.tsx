'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useMemo } from 'react';
import { MOCK_ISSUES, DEFAULT_FALLBACK_ISSUE } from '@/data/mock';
import { PolicyIssue, Argument, EvaluationScores, RankLevel } from '@/types';
import { getIssues } from '@/lib/issueService';
import { DEFAULT_CAT_PROFILE, getSavedCatProfile } from '@/data/catCostumes';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/Icon';
import RadarChart from '@/components/RadarChart';
import CatAvatar from '@/components/CatAvatar';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useHydrated } from '@/hooks/useHydrated';
import { readLocalEvaluation } from '@/lib/localEvaluation';
import { soundService } from '@/lib/soundService';
import { classifyStance, compareByNetVotes, getStanceBadgeStyle, matchesStanceFilter, StanceFilter, STANCE_COLORS } from '@/lib/stance';
import { averageScore, getVerdict } from '@/lib/scoring';
import styles from './consensus.module.css';

// Skor tampilan default sebelum ada evaluasi (lokal maupun server)
const DEFAULT_PERSONAL_SCORES: EvaluationScores = {
  effectiveness: 7.0,
  efficiency: 5.0,
  equity: 4.0,
  responsiveness: 6.0,
};

function ConsensusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueId = searchParams.get('issue') || 'issue-001';

  const [issue, setIssue] = useState<PolicyIssue>(
    MOCK_ISSUES.find((i) => i.id === issueId) || DEFAULT_FALLBACK_ISSUE
  );
  // Nilai awal nol sampai data komunitas asli dimuat (tanpa angka rekaan)
  const [consensus, setConsensus] = useState({
    issueId,
    avgEffectiveness: 0,
    avgEfficiency: 0,
    avgEquity: 0,
    avgResponsiveness: 0,
    totalVoters: 0,
    winnerPercentage: 0,
    loserPercentage: 0,
    stanceDistribution: { support: 0, conditional: 0, reject: 0 },
  });

  const { toast, showToast, hideToast } = useToast();
  // Evaluasi milik user menurut server (cookie sesi); cache lokal dipakai sampai/bila server belum punya
  const [serverEval, setServerEval] = useState<{
    hasEvaluated: boolean;
    userScores?: EvaluationScores;
    userStance?: string;
  } | null>(null);

  // Comments / Arguments state
  const [args, setArgs] = useState<Argument[]>([]);
  const [activeFilter, setActiveFilter] = useState<StanceFilter>('all');
  const [newComment, setNewComment] = useState('');
  const [newStance, setNewStance] = useState('Dukung Bersyarat');
  const [isPosting, setIsPosting] = useState(false);

  // Data lokal (localStorage) dibaca setelah hidrasi, sebagai nilai turunan — bukan setState di effect
  const hydrated = useHydrated();
  const localUser = useMemo(
    () =>
      hydrated
        ? {
            id: localStorage.getItem('policysnap_user_id') || '',
            name: localStorage.getItem('policysnap_user_name') || 'Warga',
            cat: getSavedCatProfile(),
          }
        : { id: '', name: 'Warga', cat: DEFAULT_CAT_PROFILE },
    [hydrated]
  );
  const catProfile = localUser.cat;
  const userName = localUser.name;
  const localEval = useMemo(() => (hydrated ? readLocalEvaluation(issueId) : null), [hydrated, issueId]);

  const isEvaluated = Boolean(serverEval?.hasEvaluated || localEval?.evaluated);
  const personalScores = serverEval?.userScores ?? localEval?.scores ?? DEFAULT_PERSONAL_SCORES;
  const personalStance = serverEval?.userStance ?? localEval?.stance ?? 'Dukung Bersyarat';

  // Argumen lokal user (dari komentar evaluasi) ditampilkan sampai versi server-nya muncul
  const displayArgs = useMemo(() => {
    if (!localEval?.comment?.trim()) return args;
    if (args.some((a) => a.comment === localEval.comment)) return args;
    const userArg: Argument = {
      id: `user-arg-${issueId}`,
      userId: localUser.id,
      userName: `${localUser.name} (Anda)`,
      userAvatar: '',
      userRank: 'netizen-kritis' as RankLevel,
      userCatAvatar: localUser.cat,
      issueId,
      stance: localEval.stance || 'Dukung Bersyarat',
      comment: localEval.comment,
      upvotes: 1,
      downvotes: 0,
      userVote: 'up',
      submittedAt: localEval.timestamp ? localEval.timestamp.split('T')[0] : 'Hari ini',
    };
    return [userArg, ...args].sort(compareByNetVotes);
  }, [args, localEval, localUser, issueId]);

  useEffect(() => {
    // Abaikan respons milik issueId sebelumnya bila pengguna sudah berpindah isu
    let cancelled = false;
    const controller = new AbortController();

    // 1. Fetch current issue details
    getIssues().then((list) => {
      const found = list.find((i) => i.id === issueId);
      if (found && !cancelled) setIssue(found);
    });

    // 3. Fetch live consensus from API (user diidentifikasi lewat cookie sesi)
    fetch(`/api/consensus?issueId=${encodeURIComponent(issueId)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && data.scores) {
          setConsensus({
            issueId,
            avgEffectiveness: data.scores.effectiveness,
            avgEfficiency: data.scores.efficiency,
            avgEquity: data.scores.equity,
            avgResponsiveness: data.scores.responsiveness,
            totalVoters: data.totalParticipants || data.totalVoters || 0,
            winnerPercentage: data.winnerPercentage ?? 0,
            loserPercentage: data.loserPercentage ?? 0,
            stanceDistribution: data.stanceDistribution ?? { support: 0, conditional: 0, reject: 0 },
          });

          setServerEval({
            hasEvaluated: Boolean(data.hasEvaluated),
            userScores: data.userScores,
            userStance: data.userStance,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) console.warn('Live consensus fetch warning:', err);
      });

    // 4. Fetch live comments / arguments for this issue
    fetch(`/api/arguments?issueId=${encodeURIComponent(issueId)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((list) => {
        if (cancelled) return;
        if (Array.isArray(list)) {
          setArgs([...list].sort(compareByNetVotes));
        }
      })
      .catch((err) => {
        if (!cancelled) console.warn('Arguments fetch warning:', err);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [issueId]);

  // Handle Upvote / Downvote on an Argument
  const handleVote = (argId: string, direction: 'up' | 'down') => {
    soundService.playTap();
    const currentTarget = displayArgs.find((a) => a.id === argId);
    const wasUp = currentTarget?.userVote === 'up';

    setArgs((prev) =>
      prev.map((arg) => {
        if (arg.id !== argId) return arg;
        const isUp = arg.userVote === 'up';
        const isDown = arg.userVote === 'down';

        if (direction === 'up') {
          if (isUp) {
            return { ...arg, upvotes: Math.max(0, arg.upvotes - 1), userVote: null };
          }
          return {
            ...arg,
            upvotes: arg.upvotes + 1,
            downvotes: isDown ? Math.max(0, arg.downvotes - 1) : arg.downvotes,
            userVote: 'up' as const,
          };
        } else {
          if (isDown) {
            return { ...arg, downvotes: Math.max(0, arg.downvotes - 1), userVote: null };
          }
          return {
            ...arg,
            downvotes: arg.downvotes + 1,
            upvotes: isUp ? Math.max(0, arg.upvotes - 1) : arg.upvotes,
            userVote: 'down' as const,
          };
        }
      })
    );

    if (direction === 'up') {
      const currentCount = Number(localStorage.getItem('policysnap_upvotes_given') || 0);
      const nextCount = wasUp ? Math.max(0, currentCount - 1) : currentCount + 1;
      localStorage.setItem('policysnap_upvotes_given', String(nextCount));
    }

    fetch('/api/arguments/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        argumentId: argId,
        voteType: direction,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          // Gagal di server (mis. sesi habis): kembalikan tampilan optimistis ke kondisi semula
          if (currentTarget) {
            setArgs((prev) => prev.map((arg) => (arg.id === argId ? currentTarget : arg)));
          }
          showToast(data.error || 'Vote gagal diproses', 'error');
          return;
        }
        setArgs((prev) =>
          prev.map((arg) =>
            arg.id === argId
              ? { ...arg, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote }
              : arg
          ).sort(compareByNetVotes)
        );
      })
      .catch((err) => console.warn('Vote error:', err));

    showToast(direction === 'up' ? 'Upvoted! +1 XP reputasi argumen' : 'Downvoted', 'success');
  };

  // Handle Post New Comment / Argument directly in Consensus
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsPosting(true);
    soundService.playSuccess();
    try {
      const res = await fetch('/api/arguments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId,
          stance: newStance,
          comment: newComment.trim(),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setArgs((prev) => [
          {
            ...created,
            userName: `${userName} (Anda)`,
            userCatAvatar: catProfile,
          },
          ...prev,
        ]);
        setNewComment('');
        showToast('Argumen Anda berhasil dipublikasikan!', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Gagal mempublikasikan argumen', 'error');
      }
    } catch (err) {
      console.warn('Post comment error:', err);
    } finally {
      setIsPosting(false);
    }
  };

  // User yang sudah menilai minimal terhitung 1 partisipan meski server belum mengembalikan datanya
  const totalVoters = consensus.totalVoters || (isEvaluated ? 1 : 0);
  const isSoleVoter = totalVoters <= 1;

  // Deltas for 4 Dimensions
  const deltas = [
    {
      label: 'Efektivitas',
      user: personalScores.effectiveness,
      pub: isSoleVoter ? personalScores.effectiveness : consensus.avgEffectiveness,
    },
    {
      label: 'Efisiensi',
      user: personalScores.efficiency,
      pub: isSoleVoter ? personalScores.efficiency : consensus.avgEfficiency,
    },
    {
      label: 'Keadilan',
      user: personalScores.equity,
      pub: isSoleVoter ? personalScores.equity : consensus.avgEquity,
    },
    {
      label: 'Responsivitas',
      user: personalScores.responsiveness,
      pub: isSoleVoter ? personalScores.responsiveness : consensus.avgResponsiveness,
    },
  ].map((d) => {
    const diff = Number((d.user - d.pub).toFixed(1));
    const status = isSoleVoter
      ? 'Penilaian Awal'
      : diff > 0.3
      ? `+${diff} Lebih Optimis`
      : diff < -0.3
      ? `${diff} Lebih Kritis`
      : `±0.0 Seimbang`;
    const color = isSoleVoter ? '#0284C7' : diff > 0.3 ? '#10B981' : diff < -0.3 ? '#F43F5E' : '#6B7280';
    return { ...d, diff, status, color };
  });

  // Indeks nasional = rata-rata komunitas; skor pribadi hanya bila belum ada warga lain
  const scoreSource = isSoleVoter
    ? personalScores
    : {
        effectiveness: consensus.avgEffectiveness,
        efficiency: consensus.avgEfficiency,
        equity: consensus.avgEquity,
        responsiveness: consensus.avgResponsiveness,
      };
  const nationalScoreValue = averageScore(scoreSource);
  const nationalScore = nationalScoreValue.toFixed(1);
  const nationalVerdict = getVerdict(nationalScoreValue).label;
  const personalStanceColor = STANCE_COLORS[classifyStance(personalStance)];

  const distribution = [
    { key: 'support', label: 'Dukung Penuh', color: STANCE_COLORS.support, value: consensus.stanceDistribution.support },
    { key: 'conditional', label: 'Bersyarat', color: STANCE_COLORS.conditional, value: consensus.stanceDistribution.conditional },
    { key: 'reject', label: 'Tolak', color: STANCE_COLORS.reject, value: consensus.stanceDistribution.reject },
  ];

  const filteredArgs = displayArgs.filter((a) => matchesStanceFilter(a.stance, activeFilter));


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
        <button
          className="btn btn-ghost"
          onClick={() => router.push('/home')}
          style={{ fontSize: '0.8125rem', color: 'var(--primary-coral)' }}
        >
          <span>Beranda →</span>
        </button>
      </header>

      {/* 1. Header & Topic Overview */}
      <section className={styles.overviewSection}>
        <div className={styles.badgesRow}>
          <div className={styles.categoryPill}>
            <Icon name="policy" size={14} />
            <span>{issue.category}</span>
          </div>
          <div className={styles.votersPill}>
            <span className={styles.pulseDot} />
            <span>
              {isSoleVoter
                ? '1 Warga (Penilaian Perdana Anda)'
                : `${totalVoters.toLocaleString('id-ID')} Warga Berpartisipasi`}
            </span>
          </div>
        </div>

        <h1 className={styles.issueTitle}>Konsensus Publik: {issue.title}</h1>

        <div className={styles.officialRef}>
          <Icon name="verified" size={15} style={{ color: 'var(--primary-coral)' }} />
          <span>Rujukan Terverifikasi · PolicySnap Crowdsourcing Insight</span>
        </div>
      </section>

      {/* Notice Banner jika baru satu warga (Evaluator Pertama) */}
      {isEvaluated && isSoleVoter && (
        <div className={styles.soleVoterBanner} id="sole-voter-banner">
          <div className={styles.soleVoterIconBox}>
            <Icon name="campaign" size={24} style={{ color: '#D97706' }} />
          </div>
          <div className={styles.soleVoterText}>
            <h3 className={styles.soleVoterTitle}>Anda yang pertama menilai isu ini!</h3>
            <p className={styles.soleVoterDesc}>
              Belum ada konsensus agregat publik dari warga lain. Grafik dan skor saat ini mencerminkan evaluasi mandiri Anda. Pantau kembali nanti saat lebih banyak warga berpartisipasi.
            </p>
          </div>
        </div>
      )}

      {/* If locked (Anti-bandwagon mechanism) */}
      {!isEvaluated ? (
        <div className={`${styles.lockedCard} animate-fade-in`}>
          <div className={styles.lockedIconBox}>
            <Icon name="lock" size={32} />
          </div>
          <h2 className={styles.lockedTitle}>Konsensus Terkunci Demi Integritas</h2>
          <p className={styles.lockedDesc}>
            Untuk mencegah <em>bandwagon effect</em> (bias ikut-ikutan), Anda diwajibkan menyelesaikan evaluasi mandiri terlebih dahulu sebelum dapat mengakses agregasi suara publik dan kolom diskusi.
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
              <div
                className={styles.verdictBadge}
                style={
                  isSoleVoter
                    ? { background: '#FEF3C7', color: '#B45309', borderColor: '#FDE68A' }
                    : undefined
                }
              >
                <Icon name={isSoleVoter ? 'person' : 'info'} size={15} />
                <span>{isSoleVoter ? 'Penilaian Mandiri' : nationalVerdict}</span>
              </div>
            </div>

            <div className={styles.narrativeNote}>
              <Icon name="forum" size={18} style={{ color: 'var(--primary-coral)', flexShrink: 0, marginTop: '2px' }} />
              <p className={styles.narrativeText}>
                {isSoleVoter ? (
                  <>
                    <strong style={{ color: 'var(--text-main)' }}>Sentimen Awal:</strong> Anda adalah penilai pertama pada isu ini dengan skor indeks mandiri {nationalScore}/10. Rekomendasi kebijakan akan terus diperbarui secara dinamis seiring masuknya evaluasi dari warga lain.
                  </>
                ) : (
                  <>
                    <strong style={{ color: 'var(--text-main)' }}>Sentimen Inti:</strong> Publik sepakat kebijakan ini relevan, namun menuntut transparansi implementasi lapangan, dispensasi bagi kelompok rentan, serta pengawasan akuntabel.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* 2. Visual Komparasi 4 Dimensi (Radar) */}
          <section className={styles.comparisonCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Visual Komparasi 4 Dimensi</h2>
                <span className={styles.cardSubtitle}>
                  {isSoleVoter
                    ? 'Evaluasi Mandiri Anda (Menunggu Pembanding Warga Lain)'
                    : 'Evaluasi Anda vs Agregat Suara Publik'}
                </span>
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
                <span style={{ color: 'var(--text-secondary)' }}>
                  {isSoleVoter ? 'Konsensus Publik (Belum Ada Warga Lain)' : 'Rata-rata Publik'}
                </span>
              </div>
            </div>

            {/* Radar Chart */}
            <div className={styles.chartContainer}>
              <RadarChart
                userScores={personalScores}
                publicScores={
                  isSoleVoter
                    ? personalScores
                    : {
                        effectiveness: consensus.avgEffectiveness,
                        efficiency: consensus.avgEfficiency,
                        equity: consensus.avgEquity,
                        responsiveness: consensus.avgResponsiveness,
                      }
                }
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
                    <span className={styles.deltaPubScore}>
                      {isSoleVoter ? 'Publik: Menunggu' : `Publik: ${d.pub}`}
                    </span>
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

            {isSoleVoter ? (
              <div className={styles.distributionBar}>
                <div
                  className={styles.distSegment}
                  style={{
                    width: '100%',
                    background:
                      personalStanceColor,
                  }}
                >
                  100% {personalStance}
                </div>
              </div>
            ) : (
              <div className={styles.distributionBar}>
                {distribution
                  .filter((seg) => seg.value > 0)
                  .map((seg) => (
                    <div
                      key={seg.key}
                      className={styles.distSegment}
                      style={{ width: `${seg.value}%`, background: seg.color }}
                    >
                      {seg.value}%
                    </div>
                  ))}
              </div>
            )}

            <div className={styles.distLegend}>
              {isSoleVoter ? (
                <div className={styles.distLegendItem}>
                  <span
                    className={styles.distDot}
                    style={{
                      background:
                        personalStanceColor,
                    }}
                  />
                  <span>100% Suara Mandiri Anda ({personalStance})</span>
                </div>
              ) : (
                <>
                  {distribution.map((seg) => (
                    <div key={seg.key} className={styles.distLegendItem}>
                      <span className={styles.distDot} style={{ background: seg.color }} />
                      <span>
                        {seg.label} ({seg.value}%)
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>

          {/* 4. Kolom Argumen & Komentar Komunitas Warga */}
          <section className={styles.argumentsSection} id="consensus-arguments">
            <div className={styles.argSectionHeader}>
              <div>
                <h3 className={styles.argTitle}>Aspirasi &amp; Komentar Komunitas</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Beri upvote pada argumen paling solutif dan kritis
                </span>
              </div>
              <span className={styles.argCountBadge}>{displayArgs.length} Pendapat</span>
            </div>

            {/* Filter Tabs */}
            <div className={styles.argFilters}>
              <button
                type="button"
                className={`${styles.argFilterBtn} ${activeFilter === 'all' ? styles.argFilterBtnActive : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Semua ({displayArgs.length})
              </button>
              <button
                type="button"
                className={`${styles.argFilterBtn} ${activeFilter === 'dukung' ? styles.argFilterBtnActive : ''}`}
                onClick={() => setActiveFilter('dukung')}
              >
                👍 Setuju / Dukung
              </button>
              <button
                type="button"
                className={`${styles.argFilterBtn} ${activeFilter === 'netral' ? styles.argFilterBtnActive : ''}`}
                onClick={() => setActiveFilter('netral')}
              >
                🤔 Bersyarat / Netral
              </button>
              <button
                type="button"
                className={`${styles.argFilterBtn} ${activeFilter === 'tolak' ? styles.argFilterBtnActive : ''}`}
                onClick={() => setActiveFilter('tolak')}
              >
                👎 Tolak
              </button>
            </div>

            {/* Arguments List */}
            <div className={styles.argList}>
              {filteredArgs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Belum ada argumen pada kategori ini. Jadilah yang pertama memberikan suara!
                </div>
              ) : (
                filteredArgs.map((arg) => (
                  <article key={arg.id} className={styles.argCard} id={`arg-${arg.id}`}>
                    <div className={styles.argCardTop}>
                      <div className={styles.argUserBox}>
                        <div className={styles.argCatAvatar}>
                          <CatAvatar
                            profile={arg.userCatAvatar || DEFAULT_CAT_PROFILE}
                            size={32}
                            animate={false}
                            showBackground={false}
                          />
                        </div>
                        <div className={styles.argUserInfo}>
                          <span className={styles.argUserName}>{arg.userName}</span>
                          <span className={styles.argUserRank}>
                            🐾 {arg.userCatAvatar?.name || 'Kucing Analis'} · Lvl {arg.userRank}
                          </span>
                        </div>
                      </div>

                      <span
                        className={styles.argStanceBadge}
                        style={getStanceBadgeStyle(arg.stance)}
                      >
                        {arg.stance}
                      </span>
                    </div>

                    <p className={styles.argCommentText}>{arg.comment}</p>

                    <div className={styles.argFooter}>
                      <span className={styles.argDate}>{arg.submittedAt || 'Hari ini'}</span>

                      <div className={styles.voteGroup}>
                        <button
                          type="button"
                          className={`${styles.voteBtn} ${arg.userVote === 'up' ? styles.voteBtnUpActive : ''}`}
                          onClick={() => handleVote(arg.id, 'up')}
                          title="Beri Upvote"
                          id={`btn-upvote-${arg.id}`}
                        >
                          <Icon name="thumb_up" size={14} />
                          <span>{arg.upvotes}</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.voteBtn} ${arg.userVote === 'down' ? styles.voteBtnDownActive : ''}`}
                          onClick={() => handleVote(arg.id, 'down')}
                          title="Beri Downvote"
                          id={`btn-downvote-${arg.id}`}
                        >
                          <Icon name="thumb_down" size={14} />
                          <span>{arg.downvotes}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Quick Comment Input Form */}
            <form className={styles.addCommentBox} onSubmit={handlePostComment}>
              <label className={styles.addCommentLabel}>
                <Icon name="edit_note" size={16} style={{ color: 'var(--primary-coral)' }} />
                <span>Tambahkan Opini atau Catatan Solutif Anda</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <select
                  value={newStance}
                  onChange={(e) => setNewStance(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.75rem',
                    background: '#FFFFFF',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                  }}
                >
                  <option value="Dukung Bersyarat">Dukung Bersyarat</option>
                  <option value="Setuju">Setuju Penuh</option>
                  <option value="Netral">Netral</option>
                  <option value="Tidak Setuju">Tidak Setuju</option>
                </select>
              </div>
              <div className={styles.addCommentRow}>
                <input
                  type="text"
                  className={styles.addCommentInput}
                  placeholder="Ketik argumen atau rekomendasi konstruktif Anda..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={isPosting}
                />
                <button
                  type="submit"
                  className={styles.addCommentSubmit}
                  disabled={isPosting || !newComment.trim()}
                  id="btn-submit-consensus-comment"
                >
                  <span>{isPosting ? '...' : 'Kirim'}</span>
                  <Icon name="send" size={14} />
                </button>
              </div>
            </form>
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
              onClick={() => router.push('/evaluate')}
              id="btn-view-evaluated-history"
              style={{ borderRadius: '1rem', padding: '0.75rem' }}
            >
              <Icon name="fact_check" size={18} />
              <span>Kembali ke Riwayat Evaluasi Saya</span>
            </button>
          </div>
        </>
      )}

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}

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
