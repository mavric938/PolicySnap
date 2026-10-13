'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_ISSUES, MOCK_USER, getRankForXP, getXPProgress } from '@/data/mock';
import { PolicyIssue, CatProfile } from '@/types';
import { getIssues } from '@/lib/issueService';
import { DEFAULT_CAT_PROFILE, getSavedCatProfile } from '@/data/catCostumes';
import { getIssueBannerImage, getCategoryIllustration } from '@/lib/categoryTheme';
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

function getCategoryIcon(cat?: string): string {
  if (!cat) return 'policy';
  const lower = cat.toLowerCase();
  if (lower.includes('energi') || lower.includes('bbm') || lower.includes('subsidi')) return 'local_gas_station';
  if (lower.includes('kesehatan') || lower.includes('medis')) return 'health_and_safety';
  if (lower.includes('pendidikan') || lower.includes('sekolah')) return 'school';
  if (lower.includes('lingkungan') || lower.includes('emisi') || lower.includes('iklim')) return 'forest';
  if (lower.includes('ekonomi') || lower.includes('fiskal') || lower.includes('pajak') || lower.includes('keuangan')) return 'account_balance';
  if (lower.includes('digital') || lower.includes('teknologi') || lower.includes('ai')) return 'devices';
  return 'policy';
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
        {filteredIssues.map((issue) => {
          const bannerImg = getIssueBannerImage(issue);

          return (
            <article
              key={issue.id}
              className={styles.issueCard}
              onClick={() => {
                router.push(`/evaluate?issue=${issue.id}`);
              }}
              id={`issue-card-${issue.id}`}
            >
              {/* 1. Header Badges: Aktif Menilai (green pulse) + Kategori + Tanggal */}
              <div className={styles.cardHeader}>
                <div className={styles.badgeRow}>
                  {issue.status === 'active' ? (
                    <div className={styles.activeBadge}>
                      <span className={styles.pulseDot} />
                      <span>Aktif Menilai</span>
                    </div>
                  ) : (
                    <div className={styles.closedBadge}>
                      <span>Ditutup</span>
                    </div>
                  )}

                  {issue.category && (
                    <div className={styles.categoryBadge}>
                      <Icon name={getCategoryIcon(issue.category)} size={13} />
                      <span>{issue.category}</span>
                    </div>
                  )}
                </div>

                <span className={styles.cardDate}>
                  {formatIssueDate(issue.createdAt)}
                </span>
              </div>

              {/* 2. Judul Isu Kebijakan */}
              <h3 className={styles.cardTitle}>{issue.title}</h3>

              {/* 3. Ringkasan Isu */}
              <p className={styles.cardSummary}>{issue.summary}</p>

              {/* 4. Visual Context Snapshot Banner dengan Badge XP */}
              <div className={styles.visualBanner}>
                <img
                  src={bannerImg}
                  alt={issue.title}
                  className={styles.visualImg}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = getCategoryIllustration(issue.category);
                  }}
                />
                <div className={styles.visualOverlay} />
                <div className={styles.visualXpPill}>
                  <Icon name="bolt" size={15} style={{ color: '#F59E0B' }} />
                  <span>+10 XP Analisis Saat Dikirim</span>
                </div>
              </div>

              {/* 5. Kolom Aktor Terkait (Stakeholder Chips Sesuai Stitch) */}
              <div className={styles.actorSection}>
                <div className={styles.actorSectionHeader}>
                  <Icon name="groups" size={15} style={{ color: 'var(--primary-coral)' }} />
                  <span className={styles.actorSectionTitle}>Kolom Aktor Terkait:</span>
                </div>
                <div className={styles.actorChipGrid}>
                  {issue.actorCards && issue.actorCards.length > 0 ? (
                    issue.actorCards.slice(0, 3).map((act) => (
                      <div key={act.id} className={styles.actorChip}>
                        <span className={styles.actorChipEmoji}>{act.imageEmoji || '👥'}</span>
                        <span className={styles.actorChipName}>{act.name}</span>
                      </div>
                    ))
                  ) : (
                    issue.actorTags.slice(0, 3).map((tag, idx) => {
                      const emojis = ['🏛️', '💼', '👥', '⛽'];
                      return (
                        <div key={tag} className={styles.actorChip}>
                          <span className={styles.actorChipEmoji}>{emojis[idx % emojis.length]}</span>
                          <span className={styles.actorChipName}>{tag}</span>
                        </div>
                      );
                    })
                  )}
                  {issue.actorTags.length > 3 && (
                    <span className={styles.actorChipMore}>+{issue.actorTags.length - 3} pihak</span>
                  )}
                </div>
              </div>

              {/* 6. Card Footer: Total Evaluasi Publik + Tombol Evaluasi Isu CTA */}
              <div className={styles.cardFooter}>
                <div className={styles.cardStat}>
                  <Icon name="poll" size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span>{issue.totalEvaluations.toLocaleString('id-ID')} evaluasi publik</span>
                </div>

                {evaluatedMap[issue.id] ? (
                  <div className={styles.evaluatedCta}>
                    <Icon name="check_circle" size={15} style={{ color: '#059669' }} />
                    <span>Lihat Evaluasi →</span>
                  </div>
                ) : (
                  <button
                    className={styles.ctaButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/evaluate?issue=${issue.id}`);
                    }}
                    id={`btn-eval-${issue.id}`}
                  >
                    <span>Evaluasi Isu</span>
                    <Icon name="arrow_forward" size={14} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
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
