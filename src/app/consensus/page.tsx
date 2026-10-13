'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { MOCK_ISSUES, MOCK_CONSENSUS, DEFAULT_FALLBACK_ISSUE } from '@/data/mock';
import { PolicyIssue, Argument, CatProfile, RankLevel } from '@/types';
import { getIssues } from '@/lib/issueService';
import { DEFAULT_CAT_PROFILE, getSavedCatProfile } from '@/data/catCostumes';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/Icon';
import RadarChart from '@/components/RadarChart';
import CatAvatar from '@/components/CatAvatar';
import Toast from '@/components/Toast';
import { soundService } from '@/lib/soundService';
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

  const [isEvaluated, setIsEvaluated] = useState(false);
  const [personalScores, setPersonalScores] = useState({
    effectiveness: 7.0,
    efficiency: 5.0,
    equity: 4.0,
    responsiveness: 6.0,
  });

  // Comments / Arguments state
  const [args, setArgs] = useState<Argument[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'dukung' | 'netral' | 'tolak'>('all');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newStance, setNewStance] = useState('Dukung Bersyarat');
  const [isPosting, setIsPosting] = useState(false);

  // User details
  const [catProfile, setCatProfile] = useState<CatProfile>(DEFAULT_CAT_PROFILE);
  const [currentUserId, setCurrentUserId] = useState('user-001');
  const [userName, setUserName] = useState('Warga');

  useEffect(() => {
    // 1. Fetch current issue details
    getIssues().then((list) => {
      const found = list.find((i) => i.id === issueId);
      if (found) setIssue(found);
    });

    // 2. Fetch live consensus from API
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
            totalVoters: data.totalParticipants || data.totalVoters || 142,
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

    // 3. Fetch live comments / arguments for this issue
    fetch(`/api/arguments?issueId=${encodeURIComponent(issueId)}`)
      .then((res) => res.json())
      .then((list) => {
        if (Array.isArray(list)) {
          setArgs(list);
        }
      })
      .catch((err) => console.warn('Arguments fetch warning:', err));

    // 4. Load local storage status & user profile
    const timer = setTimeout(() => {
      const savedCat = getSavedCatProfile();
      setCatProfile(savedCat);

      const localId = localStorage.getItem('policysnap_user_id') || 'user-001';
      setCurrentUserId(localId);

      const localName = localStorage.getItem('policysnap_user_name') || savedCat.name || 'Warga';
      setUserName(localName);

      const evaluated = localStorage.getItem(`evaluated_${issueId}`);
      const savedEval = localStorage.getItem(`policysnap_eval_${issueId}`);

      if (savedEval) {
        try {
          const parsed = JSON.parse(savedEval);
          if (parsed.scores) {
            setPersonalScores(parsed.scores);
          }
          setIsEvaluated(true);

          if (parsed.comment && parsed.comment.trim()) {
            const userArg: Argument = {
              id: `user-arg-${issueId}`,
              userId: localId,
              userName: `${localName} (Anda)`,
              userAvatar: '',
              userRank: 'netizen-kritis' as RankLevel,
              userCatAvatar: savedCat,
              issueId: issueId,
              stance: parsed.stance || 'Dukung Bersyarat',
              comment: parsed.comment,
              upvotes: 1,
              downvotes: 0,
              userVote: 'up',
              submittedAt: parsed.timestamp ? parsed.timestamp.split('T')[0] : 'Hari ini',
            };
            setArgs((prev) => {
              if (prev.some((a) => a.id === userArg.id || a.comment === userArg.comment)) return prev;
              return [userArg, ...prev].sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
            });
          }
        } catch {
          setIsEvaluated(true);
        }
      } else if (evaluated) {
        setIsEvaluated(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [issueId]);

  // Handle Upvote / Downvote on an Argument
  const handleVote = (argId: string, direction: 'up' | 'down') => {
    soundService.playTap();
    const currentTarget = args.find((a) => a.id === argId);
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
        userId: currentUserId,
        voteType: direction,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setArgs((prev) =>
            prev.map((arg) =>
              arg.id === argId
                ? { ...arg, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote }
                : arg
            ).sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
          );
        }
      })
      .catch((err) => console.warn('Vote error:', err));

    setToastMsg(direction === 'up' ? 'Upvoted! +1 XP reputasi argumen' : 'Downvoted');
    setShowToast(true);
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
          userId: currentUserId,
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
        setToastMsg('Argumen Anda berhasil dipublikasikan!');
        setShowToast(true);
      }
    } catch (err) {
      console.warn('Post comment error:', err);
    } finally {
      setIsPosting(false);
    }
  };

  // Deltas for 4 Dimensions
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

  const filteredArgs = args.filter((a) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'dukung') return a.stance.includes('Setuju') || a.stance.includes('Dukung');
    if (activeFilter === 'netral') return a.stance.includes('Netral') || a.stance.includes('Bersyarat');
    if (activeFilter === 'tolak') return a.stance.includes('Tolak') || a.stance.includes('Tidak');
    return true;
  });

  const getStanceBadgeStyle = (stance: string) => {
    if (stance.includes('Setuju') || (stance.includes('Dukung') && !stance.includes('Bersyarat'))) {
      return { background: '#ECFDF5', color: '#047857', border: '1px solid #D1FAE5' };
    }
    if (stance.includes('Bersyarat') || stance.includes('Netral')) {
      return { background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' };
    }
    return { background: '#FFF1F2', color: '#BE123C', border: '1px solid #FFE4E6' };
  };

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
          onClick={() => router.push('/leaderboard')}
          style={{ fontSize: '0.8125rem', color: 'var(--primary-coral)' }}
        >
          <span>Leaderboard →</span>
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
            <span>{consensus.totalVoters.toLocaleString('id-ID')} Warga Berpartisipasi</span>
          </div>
        </div>

        <h1 className={styles.issueTitle}>Konsensus Publik: {issue.title}</h1>

        <div className={styles.officialRef}>
          <Icon name="verified" size={15} style={{ color: 'var(--primary-coral)' }} />
          <span>Rujukan Terverifikasi · PolicySnap Crowdsourcing Insight</span>
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
              <div className={styles.verdictBadge}>
                <Icon name="info" size={15} />
                <span>Layak Bersyarat</span>
              </div>
            </div>

            <div className={styles.narrativeNote}>
              <Icon name="forum" size={18} style={{ color: 'var(--primary-coral)', flexShrink: 0, marginTop: '2px' }} />
              <p className={styles.narrativeText}>
                <strong style={{ color: 'var(--text-main)' }}>Sentimen Inti:</strong> Publik sepakat kebijakan ini relevan, namun menuntut transparansi implementasi lapangan, dispensasi bagi kelompok rentan, serta pengawasan akuntabel.
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

            {/* Radar Chart */}
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
                style={{ width: `${Math.max(10, 100 - consensus.winnerPercentage - 15)}%`, background: '#F59E0B' }}
              >
                {Math.max(10, 100 - consensus.winnerPercentage - 15)}%
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
                <span>Bersyarat ({Math.max(10, 100 - consensus.winnerPercentage - 15)}%)</span>
              </div>
              <div className={styles.distLegendItem}>
                <span className={styles.distDot} style={{ background: '#F43F5E' }} />
                <span>Tolak (15%)</span>
              </div>
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
              <span className={styles.argCountBadge}>{args.length} Pendapat</span>
            </div>

            {/* Filter Tabs */}
            <div className={styles.argFilters}>
              <button
                type="button"
                className={`${styles.argFilterBtn} ${activeFilter === 'all' ? styles.argFilterBtnActive : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Semua ({args.length})
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
              onClick={() => router.push('/leaderboard')}
              id="btn-view-leaderboard"
              style={{ borderRadius: '1rem', padding: '0.75rem' }}
            >
              <Icon name="leaderboard" size={18} />
              <span>Lihat Leaderboard Warga (Peringkat Kucing)</span>
            </button>
          </div>
        </>
      )}

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
