'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MOCK_ARGUMENTS, MOCK_ISSUES, DEFAULT_FALLBACK_ISSUE } from '@/data/mock';
import { Argument, RankLevel, PolicyIssue, CatProfile } from '@/types';
import { getIssues } from '@/lib/issueService';
import { DEFAULT_CAT_PROFILE, getSavedCatProfile } from '@/data/catCostumes';
import CatAvatar from '@/components/CatAvatar';
import RankBadge from '@/components/RankBadge';
import BottomNav from '@/components/BottomNav';
import Toast from '@/components/Toast';
import Icon from '@/components/Icon';
import styles from './arguments.module.css';

function ArgumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueId = searchParams.get('issue') || 'issue-001';
  const [issue, setIssue] = useState<PolicyIssue>(
    MOCK_ISSUES.find((i) => i.id === issueId) || DEFAULT_FALLBACK_ISSUE
  );

  const [args, setArgs] = useState<Argument[]>(
    MOCK_ARGUMENTS.filter((a) => a.issueId === issueId).sort(
      (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
    )
  );

  const [activeFilter, setActiveFilter] = useState<'all' | 'dukung' | 'netral' | 'tolak'>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [catProfile, setCatProfile] = useState<CatProfile>(DEFAULT_CAT_PROFILE);

  useEffect(() => {
    // Abaikan respons milik issueId sebelumnya bila pengguna sudah berpindah isu
    let cancelled = false;
    const controller = new AbortController();

    getIssues().then((list) => {
      const found = list.find((i) => i.id === issueId);
      if (found && !cancelled) setIssue(found);
    });

    // Fetch live arguments from backend API
    fetch(`/api/arguments?issueId=${encodeURIComponent(issueId)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        // Ganti daftar isu sebelumnya, tapi pertahankan argumen lokal milik isu ini
        setArgs((prev) => {
          const localArg = prev.find((p) => p.id === `user-arg-${issueId}`);
          const merged = localArg && !list.some((m: Argument) => m.comment === localArg.comment) ? [localArg, ...list] : list;
          return merged.sort((a: Argument, b: Argument) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
        });
      })
      .catch((err) => {
        if (!cancelled) console.warn('Arguments fetch warning:', err);
      });

    const timer = setTimeout(() => {
      const savedCat = getSavedCatProfile();
      setCatProfile(savedCat);

      const savedEval = localStorage.getItem(`policysnap_eval_${issueId}`);
      if (savedEval) {
        try {
          const parsed = JSON.parse(savedEval);
          if (parsed.comment && parsed.comment.trim()) {
            const localName = localStorage.getItem('policysnap_user_name') || savedCat.name || 'Warga';
            const localUserId = localStorage.getItem('policysnap_user_id') || 'user-001';
            const userArg: Argument = {
              id: `user-arg-${issueId}`,
              userId: localUserId,
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
        } catch (e) {
          console.error(e);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [issueId]);

  const handleVote = (argId: string, direction: 'up' | 'down') => {
    const currentTarget = args.find((a) => a.id === argId);
    const wasUp = currentTarget?.userVote === 'up';

    // Optimistic local update
    setArgs((prev) =>
      prev.map((arg) => {
        if (arg.id !== argId) return arg;

        const isUp = arg.userVote === 'up';
        const isDown = arg.userVote === 'down';

        if (direction === 'up') {
          if (isUp) {
            return { ...arg, upvotes: arg.upvotes - 1, userVote: null };
          }
          return {
            ...arg,
            upvotes: arg.upvotes + 1,
            downvotes: isDown ? arg.downvotes - 1 : arg.downvotes,
            userVote: 'up' as const,
          };
        } else {
          if (isDown) {
            return { ...arg, downvotes: arg.downvotes - 1, userVote: null };
          }
          return {
            ...arg,
            downvotes: arg.downvotes + 1,
            upvotes: isUp ? arg.upvotes - 1 : arg.upvotes,
            userVote: 'down' as const,
          };
        }
      })
    );

    if (direction === 'up') {
      const currentCount = Number(localStorage.getItem('policysnap_upvotes_given') || 0);
      const nextCount = wasUp ? Math.max(0, currentCount - 1) : currentCount + 1;
      localStorage.setItem('policysnap_upvotes_given', String(nextCount));
    } else if (direction === 'down' && wasUp) {
      const currentCount = Number(localStorage.getItem('policysnap_upvotes_given') || 0);
      localStorage.setItem('policysnap_upvotes_given', String(Math.max(0, currentCount - 1)));
    }

    // Call backend API (Supabase / server)
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
          setToastMsg(data.error || 'Vote gagal diproses');
          setShowToast(true);
          return;
        }
        setArgs((prev) =>
          prev.map((arg) =>
            arg.id === argId
              ? {
                  ...arg,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                  userVote: data.userVote,
                }
              : arg
          ).sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
        );
      })
      .catch((err) => console.warn('Vote backend error:', err));

    setToastMsg(direction === 'up' ? 'Upvoted! +1 XP untuk reputasi argumen' : 'Downvoted');
    setShowToast(true);
  };

  const getStancePillStyle = (stance: string) => {
    if (stance.includes('Setuju') || stance.includes('Dukung')) {
      return { background: '#ECFDF5', color: '#047857', border: '1px solid #D1FAE5' };
    }
    if (stance.includes('Tidak') || stance.includes('Tolak')) {
      return { background: '#FFF1F2', color: '#BE123C', border: '1px solid #FFE4E6' };
    }
    return { background: '#F1F3F5', color: '#4B5563', border: '1px solid #E5E7EB' };
  };

  const filteredArgs = args.filter((a) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'dukung') return a.stance.includes('Setuju') || a.stance.includes('Dukung');
    if (activeFilter === 'tolak') return a.stance.includes('Tidak') || a.stance.includes('Tolak');
    if (activeFilter === 'netral') return a.stance.includes('Netral');
    return true;
  });

  return (
    <div className="page">
      {/* Header */}
      <header className={styles.header}>
        <button
          className="btn btn-ghost"
          onClick={() => router.back()}
          id="btn-back-arguments"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
        >
          <Icon name="arrow_back" size={18} />
          <span>Kembali</span>
        </button>
        <span className={styles.headerTitle}>Top Arguments</span>
        <div style={{ width: 60 }} />
      </header>

      {/* Issue Overview Card */}
      <div className={styles.issueCard}>
        <h1 className={styles.issueTitle}>{issue.title}</h1>
        <div className={styles.argSub}>
          <Icon name="forum" size={15} style={{ color: 'var(--primary-coral)' }} />
          <span>{args.length} Argumen Terverifikasi dari Komunitas</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.filterActive : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Semua ({args.length})
        </button>
        <button
          className={`${styles.filterBtn} ${activeFilter === 'dukung' ? styles.filterActive : ''}`}
          onClick={() => setActiveFilter('dukung')}
        >
          Dukung Penuh / Bersyarat
        </button>
        <button
          className={`${styles.filterBtn} ${activeFilter === 'netral' ? styles.filterActive : ''}`}
          onClick={() => setActiveFilter('netral')}
        >
          Netral
        </button>
        <button
          className={`${styles.filterBtn} ${activeFilter === 'tolak' ? styles.filterActive : ''}`}
          onClick={() => setActiveFilter('tolak')}
        >
          Tolak Kebijakan
        </button>
      </div>

      {/* Arguments Feed */}
      <div className={styles.argList}>
        {filteredArgs.map((arg, idx) => {
          const isTop3 = idx < 3 && activeFilter === 'all';
          const medals = ['🥇', '🥈', '🥉'];
          const pillStyle = getStancePillStyle(arg.stance);

          return (
            <div key={arg.id} className={`${styles.argCard} animate-fade-in`}>
              {isTop3 && <span className={styles.rankMedal}>{medals[idx]}</span>}

              <div className={styles.argHeader}>
                <div className={styles.argUser}>
                  {arg.userId === 'user-001' ? (
                    <div
                      className={styles.argAvatar}
                      style={{
                        overflow: 'hidden',
                        padding: 0,
                        background: '#FFF1ED',
                        border: '2px solid #FF6B4A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CatAvatar profile={catProfile} size={36} showBackground={false} animate={false} />
                    </div>
                  ) : (
                    <div className={styles.argAvatar}>{arg.userName.charAt(0)}</div>
                  )}
                  <div className={styles.argUserInfo}>
                    <div className={styles.argUserName}>{arg.userName}</div>
                    <div className={styles.argMeta}>
                      <RankBadge xp={85} size="sm" />
                      <span>•</span>
                      <span>{arg.submittedAt}</span>
                    </div>
                  </div>
                </div>

                <span className={styles.stancePill} style={pillStyle}>
                  {arg.stance}
                </span>
              </div>

              <p className={styles.argComment}>&quot;{arg.comment}&quot;</p>

              <div className={styles.voteBar}>
                <div className={styles.voteGroup}>
                  <button
                    className={`${styles.voteBtn} ${arg.userVote === 'up' ? styles.voteBtnUpActive : ''}`}
                    onClick={() => handleVote(arg.id, 'up')}
                    aria-label="Upvote"
                  >
                    <Icon name="thumb_up" size={15} />
                    <span>{arg.upvotes}</span>
                  </button>
                  <button
                    className={`${styles.voteBtn} ${arg.userVote === 'down' ? styles.voteBtnDownActive : ''}`}
                    onClick={() => handleVote(arg.id, 'down')}
                    aria-label="Downvote"
                  >
                    <Icon name="thumb_down" size={15} />
                    <span>{arg.downvotes}</span>
                  </button>
                </div>

                <span className={styles.voteScoreText}>
                  Net: {arg.upvotes - arg.downvotes > 0 ? `+${arg.upvotes - arg.downvotes}` : arg.upvotes - arg.downvotes}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showToast && (
        <Toast
          message={toastMsg}
          type="info"
          onClose={() => setShowToast(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default function ArgumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      }
    >
      <ArgumentsContent />
    </Suspense>
  );
}
