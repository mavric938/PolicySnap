'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_ISSUES, MOCK_USER, getRankForXP, getXPProgress } from '@/data/mock';
import { PolicyIssue, CatProfile } from '@/types';
import { getIssues } from '@/lib/issueService';
import { DEFAULT_CAT_PROFILE, getSavedCatProfile } from '@/data/catCostumes';
import CatAvatar from '@/components/CatAvatar';
import CatCreatorModal from '@/components/CatCreatorModal';
import RankBadge from '@/components/RankBadge';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/Icon';
import Toast from '@/components/Toast';
import SoundToggle from '@/components/SoundToggle';
import styles from './home.module.css';
import { useAuth } from '@/presentation/hooks/useAuth';
import UserAuthBadge from '@/presentation/components/UserAuthBadge';

function formatIssueDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const year = parts[0];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }
  return dateStr;
}

export default function HomePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();
  const [issues, setIssues] = useState<PolicyIssue[]>(MOCK_ISSUES);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [userXP, setUserXP] = useState(MOCK_USER.totalXP);
  const [catProfile, setCatProfile] = useState<CatProfile>(DEFAULT_CAT_PROFILE);
  const [showCatOnboarding, setShowCatOnboarding] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [evaluatedMap, setEvaluatedMap] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedXP = localStorage.getItem('policysnap_xp');
      if (savedXP) {
        setUserXP(Number(savedXP));
      }

      const savedCat = getSavedCatProfile();
      setCatProfile(savedCat);

      const hasCreatedCat = localStorage.getItem('policysnap_cat_profile_created');
      if (!hasCreatedCat) {
        setShowCatOnboarding(true);
      }

      // If authenticated, fetch profile from backend API
      if (authUser?.id) {
        fetch(`/api/user/profile?userId=${encodeURIComponent(authUser.id)}`)
          .then((res) => res.json())
          .then((p) => {
            if (p && !p.error) {
              if (p.totalXP !== undefined) {
                setUserXP(p.totalXP);
                localStorage.setItem('policysnap_xp', String(p.totalXP));
              }
              if (p.catAvatar) {
                setCatProfile((prev) => ({
                  ...prev,
                  ...p.catAvatar,
                  equipped: p.catAvatar.equipped || prev.equipped,
                }));
              }
            }
          })
          .catch(console.warn);
      }

      const notifDismissed = localStorage.getItem('policysnap_notif_dismissed');
      const notifEnabled = localStorage.getItem('policysnap_push_token');
      if (!notifDismissed && !notifEnabled) {
        setShowNotifBanner(true);
      }

      // Fetch dynamic issues from server
      getIssues().then((data) => {
        setIssues(data);
        const evalStatus: Record<string, boolean> = {};
        data.forEach((issue) => {
          if (localStorage.getItem(`evaluated_${issue.id}`)) {
            evalStatus[issue.id] = true;
          }
        });
        setEvaluatedMap(evalStatus);
      });
    }, 0);

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('SW registration error:', err));
    }

    return () => clearTimeout(timer);
  }, []);

  const handleEnablePush = async () => {
    if (typeof window !== 'undefined') {
      try {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const fakeToken = `ps_sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('policysnap_push_token', fakeToken);
            setToastMsg('Web Push Notifications aktif!');
            setShowToast(true);
          } else {
            setToastMsg('Izin notifikasi ditolak.');
            setShowToast(true);
          }
        } else {
          setToastMsg('Browser tidak mendukung notifikasi.');
          setShowToast(true);
        }
      } catch (err) {
        console.error('Push error:', err);
      }
      setShowNotifBanner(false);
    }
  };

  const handleDismissNotif = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('policysnap_notif_dismissed', 'true');
    }
    setShowNotifBanner(false);
  };

  const user = { ...MOCK_USER, totalXP: userXP };
  const rankInfo = getRankForXP(user.totalXP);
  const xpProgress = getXPProgress(user.totalXP);

  const filteredIssues = issues.filter((issue) => {
    if (activeFilter === 'all') return true;
    return issue.status === activeFilter;
  });

  return (
    <div className="page">
      {/* Brand Header Section */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brandGroup}>
            <div className={styles.brandIcon}>
              <Icon name="policy" size={20} />
            </div>
            <div className={styles.brandTitles}>
              <h1 className={styles.brandTitle}>PolicySnap</h1>
              <span className={styles.brandSubtitle}>Crowdsourcing Policy Analyst</span>
            </div>
          </div>

          <div className={styles.headerRight} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SoundToggle />
            <UserAuthBadge
              userXP={user.totalXP}
              rankName={`Lvl ${rankInfo.level} · ${rankInfo.name}`}
              catAvatarNode={
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#FFF1ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CatAvatar profile={catProfile} size={38} showBackground={false} animate={false} />
                </div>
              }
            />
          </div>
        </div>

        {/* XP Progress Card */}
        <div className={styles.xpCard}>
          <div className={styles.xpTop}>
            <RankBadge xp={user.totalXP} size="sm" />
            <span className={styles.xpText}>
              Level {rankInfo.level} · {rankInfo.name}
            </span>
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${xpProgress.percentage}%` }}
            />
          </div>
          <p className={styles.xpNextRank}>
            {xpProgress.current}/{xpProgress.max} XP menuju{' '}
            <strong>{rankInfo.level < 7 ? `Level ${rankInfo.level + 1}` : 'Level Maksimal (Negarawan)'}</strong>
          </p>
        </div>
      </header>

      {/* Push Notification Banner */}
      {showNotifBanner && (
        <div className={`${styles.notifBanner} animate-slide-up`} id="push-notif-banner">
          <div className={styles.notifLeft}>
            <div className={styles.notifIconBox}>
              <Icon name="notifications_active" size={20} style={{ color: '#D97706' }} />
            </div>
            <div>
              <h4 className={styles.notifTitle}>Aktifkan Notifikasi Kebijakan?</h4>
              <p className={styles.notifDesc}>
                Dapatkan pembaruan langsung saat ada isu regulasi baru yang memerlukan evaluasi publik.
              </p>
            </div>
          </div>
          <div className={styles.notifActions}>
            <button
              className={`btn btn-primary ${styles.notifBtnAccept}`}
              onClick={handleEnablePush}
              id="btn-enable-push"
            >
              Aktifkan
            </button>
            <button
              className={styles.notifBtnDismiss}
              onClick={handleDismissNotif}
              id="btn-dismiss-push"
            >
              Nanti
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className={styles.filters}>
        {(['all', 'active', 'closed'] as const).map((filter) => (
          <button
            key={filter}
            className={`${styles.filterBtn} ${activeFilter === filter ? styles.filterActive : ''}`}
            onClick={() => setActiveFilter(filter)}
            id={`filter-${filter}`}
          >
            {filter === 'all' ? 'Semua Isu' : filter === 'active' ? '🟢 Aktif' : '🔴 Ditutup'}
          </button>
        ))}
      </div>

      {/* Section Title */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Isu Kebijakan Publik</h2>
        <span className={styles.issueCount}>{filteredIssues.length} isu tersedia</span>
      </div>

      {/* Issue Cards */}
      <div className={`${styles.issueList} stagger-children`}>
        {filteredIssues.map((issue) => (
          <article
            key={issue.id}
            className={`glass-card ${styles.issueCard}`}
            onClick={() => {
              router.push(`/evaluate?issue=${issue.id}`);
            }}
            id={`issue-card-${issue.id}`}
          >
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge ${issue.status === 'active' ? 'badge-active' : 'badge-closed'}`}>
                  {issue.status === 'active' ? 'Aktif' : 'Ditutup'}
                </span>
                {issue.category && (
                  <span className="badge" style={{ background: '#F1F5F9', color: '#475569', borderColor: '#E2E8F0' }}>
                    {issue.category}
                  </span>
                )}
                {evaluatedMap[issue.id] && (
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Icon name="check_circle" size={13} style={{ color: '#059669' }} />
                    Sudah Dinilai
                  </span>
                )}
              </div>
              <span className={styles.cardDate}>
                {formatIssueDate(issue.createdAt)}
              </span>
            </div>

            <h3 className={styles.cardTitle}>{issue.title}</h3>
            <p className={styles.cardSummary}>{issue.summary}</p>

            {/* Tags */}
            <div className={styles.cardTags}>
              {issue.actorTags.slice(0, 3).map((tag) => (
                <span key={tag} className={styles.cardTag}>
                  {tag}
                </span>
              ))}
              {issue.actorTags.length > 3 && (
                <span className={styles.cardTag}>+{issue.actorTags.length - 3}</span>
              )}
            </div>

            {/* Footer */}
            <div className={styles.cardFooter}>
              <div className={styles.cardStat}>
                <Icon name="poll" size={16} style={{ color: 'var(--text-secondary)' }} />
                <span>{issue.totalEvaluations.toLocaleString('id-ID')} evaluasi publik</span>
              </div>
              <span className={styles.cardArrow}>
                <Icon name="arrow_forward" size={16} />
              </span>
            </div>
          </article>
        ))}
      </div>

      {showToast && (
        <Toast
          message={toastMsg}
          type={toastMsg.includes('aktif') ? 'success' : 'info'}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* First-time login Cat Creator Onboarding Modal */}
      <CatCreatorModal
        isOpen={showCatOnboarding}
        onClose={() => setShowCatOnboarding(false)}
        initialProfile={catProfile}
        isFirstTime={true}
        onSave={(newCat) => {
          setCatProfile(newCat);
          if (typeof window !== 'undefined') {
            localStorage.setItem('policysnap_cat_profile_created', 'true');
          }
          setShowCatOnboarding(false);
          setToastMsg(`🐱 Karakter ${newCat.name} berhasil dibuat! Siap mendampingi perjalananmu.`);
          setShowToast(true);
        }}
      />

      <BottomNav />
    </div>
  );
}
