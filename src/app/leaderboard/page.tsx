'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, CatProfile } from '@/types';
import { getRankForXP, MOCK_USER } from '@/data/mock';
import { DEFAULT_CAT_PROFILE, getSavedCatProfile } from '@/data/catCostumes';
import CatAvatar from '@/components/CatAvatar';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/Icon';
import SoundToggle from '@/components/SoundToggle';
import { useAuth } from '@/presentation/hooks/useAuth';
import styles from './leaderboard.module.css';

type LeaderboardTab = 'all' | 'upvotes' | 'xp' | 'analysis';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('policysnap_user_id') || 'user-001' : 'user-001');

  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('all');
  const [loading, setLoading] = useState(true);

  // Load current user details from localStorage
  const [myXP, setMyXP] = useState(MOCK_USER.totalXP);
  const [myEvalCount, setMyEvalCount] = useState(MOCK_USER.evaluationsCount);
  const [myUpvotes, setMyUpvotes] = useState(0);
  const [myCat, setMyCat] = useState<CatProfile>(DEFAULT_CAT_PROFILE);

  useEffect(() => {
    // 1. Load local user stats
    const timer = setTimeout(() => {
      const savedXP = localStorage.getItem('policysnap_xp');
      if (savedXP) setMyXP(Number(savedXP));

      const savedCount = localStorage.getItem('policysnap_eval_count');
      if (savedCount) setMyEvalCount(Number(savedCount));

      const savedUpvotes = localStorage.getItem('policysnap_upvotes_given');
      if (savedUpvotes) setMyUpvotes(Number(savedUpvotes));

      const savedCat = getSavedCatProfile();
      setMyCat(savedCat);
    }, 0);

    // 2. Fetch live leaderboard data from API
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data: User[]) => {
        if (Array.isArray(data)) {
          setUsers(data);
        }
      })
      .catch((err) => console.warn('Leaderboard fetch warning:', err))
      .finally(() => setLoading(false));

    return () => clearTimeout(timer);
  }, []);

  // Merge current user's active session stats into leaderboard
  const enrichedUsers = useMemo(() => {
    const list = [...users];
    const userIndex = list.findIndex((u) => u.id === currentUserId);

    const localName = typeof window !== 'undefined' ? localStorage.getItem('policysnap_user_name') : null;
    const displayName = authUser?.name || localName || myCat.name || 'Saya (Warga Aktif)';

    const currentUserEntry: User = {
      id: currentUserId,
      name: displayName,
      email: authUser?.email || 'warga@policysnap.id',
      avatar: authUser?.avatarUrl || '',
      totalXP: myXP,
      rankLevel: getRankForXP(myXP).key,
      evaluationsCount: myEvalCount,
      upvotesCount: myUpvotes,
      joinedAt: '2026-10-12',
      catAvatar: myCat,
    };

    if (userIndex !== -1) {
      list[userIndex] = {
        ...list[userIndex],
        name: list[userIndex].name && list[userIndex].name !== 'Saya (Warga Aktif)' ? list[userIndex].name : displayName,
        totalXP: Math.max(list[userIndex].totalXP, myXP),
        evaluationsCount: Math.max(list[userIndex].evaluationsCount, myEvalCount),
        upvotesCount: Math.max(list[userIndex].upvotesCount || 0, myUpvotes),
        catAvatar: myCat,
      };
    } else {
      list.push(currentUserEntry);
    }

    // Sort according to active tab
    if (activeTab === 'upvotes') {
      return list.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
    }
    if (activeTab === 'analysis') {
      return list.sort((a, b) => b.evaluationsCount - a.evaluationsCount);
    }
    // Default: 'all' or 'xp'
    return list.sort((a, b) => b.totalXP - a.totalXP);
  }, [users, currentUserId, myXP, myEvalCount, myUpvotes, myCat, authUser, activeTab]);

  // Find my current rank position
  const myRankPosition = useMemo(() => {
    const idx = enrichedUsers.findIndex((u) => u.id === currentUserId);
    return idx !== -1 ? idx + 1 : enrichedUsers.length;
  }, [enrichedUsers, currentUserId]);

  const top3 = enrichedUsers.slice(0, 3);
  const restOfList = enrichedUsers.slice(3);

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="page">
      {/* Header Sticky */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brandGroup}>
            <div className={styles.brandIcon}>
              <Icon name="leaderboard" size={20} />
            </div>
            <div>
              <h1 className={styles.brandTitle}>Leaderboard Warga</h1>
              <span className={styles.brandSubtitle}>Peringkat Analis Kebijakan &amp; Persona Kucing</span>
            </div>
          </div>
          <SoundToggle />
        </div>
      </header>

      {/* Floating My Rank Banner */}
      <section className={styles.myRankBanner}>
        <div className={styles.myRankLeft}>
          <div className={styles.myCatThumb}>
            <CatAvatar profile={myCat} size={40} animate={false} showBackground={false} />
          </div>
          <div className={styles.myRankInfo}>
            <h4>{myCat.name} · Posisi #{myRankPosition}</h4>
            <p>
              {myXP} XP · {myEvalCount} Analisis · {myUpvotes} Upvote
            </p>
          </div>
        </div>
        <div className={styles.myRankBadge}>
          <span>Lvl {getRankForXP(myXP).level}</span>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('all')}
          id="tab-all-citizens"
        >
          Semua Peringkat
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'xp' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('xp')}
          id="tab-highest-xp"
        >
          Level &amp; XP Tertinggi
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'upvotes' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('upvotes')}
          id="tab-most-upvotes"
        >
          Paling Berpengaruh (Upvotes)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'analysis' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('analysis')}
          id="tab-most-analysis"
        >
          Paling Kritis (Analisis)
        </button>
      </div>

      {/* Podium Top 3 */}
      {top3.length >= 3 && (
        <section className={styles.podiumSection}>
          {/* Rank 2 (Silver) */}
          <div
            className={`${styles.podiumCard} ${styles.podiumCard2}`}
            onClick={() => router.push(`/profile?userId=${top3[1].id}`)}
            title={`Lihat profil ${top3[1].name}`}
            id={`podium-rank-2`}
          >
            <div className={styles.podiumAvatarWrap}>
              <span className={styles.crownBadge}>🥈</span>
              <div className={styles.podiumAvatarBox}>
                <CatAvatar profile={top3[1].catAvatar || DEFAULT_CAT_PROFILE} size={64} animate={false} showBackground={false} />
              </div>
              <span className={`${styles.rankPillMini} ${styles.rank2Pill}`}>#2</span>
            </div>
            <span className={styles.podiumCatName}>{top3[1].catAvatar?.name || 'Kucing Warga'}</span>
            <span className={styles.podiumName}>{top3[1].name}</span>
            <span className={styles.podiumXP}>{top3[1].totalXP} XP</span>
            <span className={styles.podiumSubStat}>{top3[1].upvotesCount || 0} Upvote</span>
          </div>

          {/* Rank 1 (Gold / Crown) */}
          <div
            className={`${styles.podiumCard} ${styles.podiumCard1}`}
            onClick={() => router.push(`/profile?userId=${top3[0].id}`)}
            title={`Lihat profil ${top3[0].name}`}
            id={`podium-rank-1`}
          >
            <div className={styles.podiumAvatarWrap}>
              <span className={styles.crownBadge}>👑</span>
              <div className={styles.podiumAvatarBox}>
                <CatAvatar profile={top3[0].catAvatar || DEFAULT_CAT_PROFILE} size={76} animate={true} showBackground={false} />
              </div>
              <span className={`${styles.rankPillMini} ${styles.rank1Pill}`}>#1 Juara</span>
            </div>
            <span className={styles.podiumCatName}>{top3[0].catAvatar?.name || 'Kucing Warga'}</span>
            <span className={styles.podiumName}>{top3[0].name}</span>
            <span className={styles.podiumXP}>{top3[0].totalXP} XP</span>
            <span className={styles.podiumSubStat}>{top3[0].upvotesCount || 0} Upvote</span>
          </div>

          {/* Rank 3 (Bronze) */}
          <div
            className={`${styles.podiumCard} ${styles.podiumCard3}`}
            onClick={() => router.push(`/profile?userId=${top3[2].id}`)}
            title={`Lihat profil ${top3[2].name}`}
            id={`podium-rank-3`}
          >
            <div className={styles.podiumAvatarWrap}>
              <span className={styles.crownBadge}>🥉</span>
              <div className={styles.podiumAvatarBox}>
                <CatAvatar profile={top3[2].catAvatar || DEFAULT_CAT_PROFILE} size={64} animate={false} showBackground={false} />
              </div>
              <span className={`${styles.rankPillMini} ${styles.rank3Pill}`}>#3</span>
            </div>
            <span className={styles.podiumCatName}>{top3[2].catAvatar?.name || 'Kucing Warga'}</span>
            <span className={styles.podiumName}>{top3[2].name}</span>
            <span className={styles.podiumXP}>{top3[2].totalXP} XP</span>
            <span className={styles.podiumSubStat}>{top3[2].upvotesCount || 0} Upvote</span>
          </div>
        </section>
      )}

      {/* Ranking List */}
      <section className={styles.listSection}>
        <div className={styles.listHeader}>
          <h3 className={styles.listTitle}>Daftar Peringkat Lengkap</h3>
          <span className={styles.listSub}>{enrichedUsers.length} Warga Terdaftar</span>
        </div>

        {enrichedUsers.map((citizen, idx) => {
          const rank = idx + 1;
          const isSelf = citizen.id === currentUserId;
          const rankInfo = getRankForXP(citizen.totalXP);

          return (
            <article
              key={citizen.id}
              className={`${styles.citizenCard} ${isSelf ? styles.citizenCardSelf : ''}`}
              onClick={() => router.push(`/profile?userId=${citizen.id}`)}
              id={`citizen-rank-${rank}`}
            >
              <div className={styles.rankNumberCol}>
                {rank <= 3 ? getRankMedal(rank) : rank}
              </div>

              <div className={styles.avatarCol}>
                <CatAvatar
                  profile={citizen.catAvatar || DEFAULT_CAT_PROFILE}
                  size={42}
                  animate={false}
                  showBackground={false}
                />
              </div>

              <div className={styles.infoCol}>
                <div className={styles.nameRow}>
                  <span className={styles.citizenName}>{citizen.name}</span>
                  {isSelf && <span className={styles.catBadgePill}>Anda</span>}
                </div>
                <div className={styles.metaRow}>
                  <span style={{ color: 'var(--primary-coral)', fontWeight: 600 }}>
                    🐾 {citizen.catAvatar?.name || 'Kucing Analis'}
                  </span>
                  <span>·</span>
                  <span>Lvl {rankInfo.level} {rankInfo.name}</span>
                </div>
              </div>

              <div className={styles.statsCol}>
                <span className={styles.statXP}>{citizen.totalXP} XP</span>
                <div className={styles.statDetails}>
                  <span className={styles.statDetailItem}>
                    <Icon name="fact_check" size={12} />
                    <span>{citizen.evaluationsCount} uji</span>
                  </span>
                  <span>·</span>
                  <span className={styles.statDetailItem} style={{ color: '#059669', fontWeight: 600 }}>
                    <Icon name="thumb_up" size={12} />
                    <span>{citizen.upvotesCount || 0}</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={styles.visitBtn}
                title="Kunjungi Profil Warga"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile?userId=${citizen.id}`);
                }}
              >
                <Icon name="open_in_new" size={16} />
              </button>
            </article>
          );
        })}
      </section>

      <BottomNav />
    </div>
  );
}
