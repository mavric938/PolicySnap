'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MOCK_USER, RANKS, getRankForXP, getXPProgress } from '@/data/mock';
import {
  CAT_COSTUMES,
  getCostumeById,
  DEFAULT_CAT_PROFILE,
  getSavedCatProfile,
  saveCatProfile,
  BREED_OPTIONS,
} from '@/data/catCostumes';
import { CatProfile, CatCostumeItem, CatCostumeSlot } from '@/types';
import CatAvatar from '@/components/CatAvatar';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/Icon';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import styles from './profile.module.css';
import { useAuth } from '@/presentation/hooks/useAuth';
import GoogleLoginButton from '@/presentation/components/GoogleLoginButton';
import CatVisualIcon from '@/components/CatVisualIcon';
import SoundToggle from '@/components/SoundToggle';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, isAuthenticated, isAdmin, signOut } = useAuth();
  // Cache localStorage hanya dipakai selama sesi server masih dimuat (hindari kedip "profil orang lain")
  const sessionUserId = useCurrentUserId();
  const authName = authUser?.name;
  const currentUserId =
    sessionUserId || (typeof window !== 'undefined' ? localStorage.getItem('policysnap_user_id') || '' : '');

  const queryUserId = searchParams.get('userId');
  const isViewingOtherUser = Boolean(queryUserId && queryUserId !== currentUserId);
  const targetUserId = queryUserId || currentUserId;

  const { toast, showToast, hideToast } = useToast();
  const [profileName, setProfileName] = useState(MOCK_USER.name);
  const [userXP, setUserXP] = useState(MOCK_USER.totalXP);
  const [evalCount, setEvalCount] = useState(MOCK_USER.evaluationsCount);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [catProfile, setCatProfile] = useState<CatProfile>(DEFAULT_CAT_PROFILE);
  const [selectedSlotTab, setSelectedSlotTab] = useState<'all' | CatCostumeSlot>('all');

  // Server hanya menerima nama/avatar/kucing milik user yang login (userId dari cookie sesi)
  const syncProfileToBackend = (updates: { catAvatar: CatProfile }) => {
    if (isViewingOtherUser) return;
    fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((err) => console.warn('Profile sync warning:', err));
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (!isViewingOtherUser) {
      timer = setTimeout(() => {
        const savedCat = getSavedCatProfile();
        setCatProfile(savedCat);

        const savedName = localStorage.getItem('policysnap_user_name');
        if (savedName) setProfileName(savedName);
        else if (authName) setProfileName(authName);

        const savedXP = localStorage.getItem('policysnap_xp');
        if (savedXP) setUserXP(Number(savedXP));

        const savedCount = localStorage.getItem('policysnap_eval_count');
        if (savedCount) setEvalCount(Number(savedCount));

        const savedUpvotes = localStorage.getItem('policysnap_upvotes_given');
        if (savedUpvotes) setUpvoteCount(Number(savedUpvotes));
      }, 0);
    }

    // Fetch live profile from backend API (pengunjung anonim tanpa ?userId tidak punya profil)
    if (!targetUserId) {
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
    fetch(`/api/user/profile?userId=${encodeURIComponent(targetUserId)}`)
      .then((res) => res.json())
      .then((p) => {
        if (p && !p.error) {
          if (p.name) setProfileName(p.name);
          if (p.totalXP !== undefined) {
            setUserXP(p.totalXP);
            if (!isViewingOtherUser) localStorage.setItem('policysnap_xp', String(p.totalXP));
          }
          if (p.evaluationsCount !== undefined) {
            setEvalCount(p.evaluationsCount);
            if (!isViewingOtherUser) localStorage.setItem('policysnap_eval_count', String(p.evaluationsCount));
          }
          if (p.upvotesCount !== undefined) {
            setUpvoteCount(p.upvotesCount);
            if (!isViewingOtherUser) localStorage.setItem('policysnap_upvotes_given', String(p.upvotesCount));
          }
          if (p.catAvatar) {
            // Updater setState harus murni (StrictMode memanggilnya 2x) — simpan ke storage di luar updater
            const merge = (base: CatProfile): CatProfile => ({
              ...base,
              ...p.catAvatar,
              equipped: p.catAvatar.equipped || base.equipped,
            });
            setCatProfile((prev) => merge(prev));
            if (!isViewingOtherUser) {
              saveCatProfile(merge(getSavedCatProfile()));
            }
          }
        }
      })
      .catch((err) => console.warn('Backend profile fetch warning:', err));

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [targetUserId, isViewingOtherUser, authName]);

  const handleToggleCostume = (item: CatCostumeItem) => {
    const isUnlocked = userXP >= (RANKS.find((r) => r.level === item.requiredLevel)?.minXP || 0);
    if (!isUnlocked) {
      showToast(`🔒 Kostum ini terkunci! Capai Level ${item.requiredLevel} untuk membukanya.`, 'info');
      return;
    }

    const currentEquippedId = catProfile.equipped[item.slot];
    const isAlreadyEquipped = currentEquippedId === item.id;

    const newEquipped = {
      ...catProfile.equipped,
      [item.slot]: isAlreadyEquipped ? null : item.id,
    };

    const updatedProfile: CatProfile = {
      ...catProfile,
      equipped: newEquipped,
    };

    setCatProfile(updatedProfile);
    saveCatProfile(updatedProfile);
    syncProfileToBackend({ catAvatar: updatedProfile });

    showToast(
      isAlreadyEquipped
        ? `Melepas ${item.name}`
        : `✨ Memasang ${item.name} pada ${catProfile.name}!`
    , 'info');
  };

  const handleUnequipSlot = (slot: CatCostumeSlot) => {
    const item = getCostumeById(catProfile.equipped[slot]);
    if (!item) return;

    const updatedProfile: CatProfile = {
      ...catProfile,
      equipped: {
        ...catProfile.equipped,
        [slot]: null,
      },
    };
    setCatProfile(updatedProfile);
    saveCatProfile(updatedProfile);
    syncProfileToBackend({ catAvatar: updatedProfile });
    showToast(`Melepas ${item.name}`, 'info');
  };

  const currentRank = getRankForXP(userXP);
  const xpProgress = getXPProgress(userXP);
  const breedObj = BREED_OPTIONS.find((b) => b.id === catProfile.breed) || BREED_OPTIONS[0];

  const filteredCostumes = CAT_COSTUMES.filter((c) => {
    if (selectedSlotTab === 'all') return true;
    return c.slot === selectedSlotTab;
  });

  const badges = [
    { name: 'Pemberani Opini', emoji: '🏅', status: 'Terbuka', bg: '#FEF3C7', color: '#047857', badgeBg: '#ECFDF5' },
    { name: 'Akurasi Konsensus', emoji: '🎯', status: 'Terbuka', bg: '#DBEAFE', color: '#047857', badgeBg: '#ECFDF5' },
    { name: 'Megafon Rakyat', emoji: '📢', status: 'Terbuka', bg: '#FEE2E2', color: '#DC2626', badgeBg: '#FEF2F2' },
    { name: 'Saksi Perpres', emoji: '🏛️', status: '8 / 10', bg: '#F1F3F5', color: '#C2410C', badgeBg: '#FFF1ED' },
  ];

  const slotsMeta: { slot: CatCostumeSlot; label: string; icon: string }[] = [
    { slot: 'head', label: 'Topi', icon: '🧢' },
    { slot: 'eyes', label: 'Kacamata', icon: '👓' },
    { slot: 'body', label: 'Pakaian', icon: '👔' },
    { slot: 'accessory', label: 'Aksesoris', icon: '🎒' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <header className={styles.header}>
        {isViewingOtherUser ? (
          <button
            className="btn btn-ghost"
            onClick={() => router.push('/leaderboard')}
            id="btn-back-leaderboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
          >
            <Icon name="arrow_back" size={18} />
            <span>Leaderboard</span>
          </button>
        ) : (
          <button
            className="btn btn-ghost"
            onClick={() => router.back()}
            id="btn-back-profile"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
          >
            <Icon name="arrow_back" size={18} />
            <span>Kembali</span>
          </button>
        )}
        <span className={styles.headerTitle}>{isViewingOtherUser ? `Profil ${profileName}` : 'Profil'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SoundToggle />
        </div>
      </header>

      {/* 1. Hero 2D Cat Avatar Card */}
      <section className={styles.catHeroCard}>
        <div className={styles.catHeroBackdropGlow} />

        <div className={styles.catAvatarBox}>
          <CatAvatar profile={catProfile} size={170} animate={true} />
          <div className={styles.catStatusPill}>
            <span>{catProfile.gender === 'male' ? '♂' : '♀'}</span>
            <span>{breedObj.name}</span>
          </div>
        </div>

        <div className={styles.catNameRow}>
          <h1 className={styles.catName}>{catProfile.name}</h1>
          <span className={styles.catBreedTag}>{breedObj.tagline}</span>
        </div>

        <span className={styles.catRankPill}>
          ⭐ LEVEL {currentRank.level} · {currentRank.name}
        </span>

        <p className={styles.catBio}>
          {isViewingOtherUser
            ? `Profil warga analis ${profileName} dengan kucing ${catProfile.name} di PolicySnap.`
            : 'Kucing pendamping analisis kebijakan Anda. Selesaikan evaluasi publik dan buka berbagai kostum kehormatan di lemari kostum!'}
        </p>

        {/* Admin Exclusive Special Item Active Banner */}
        {isAdmin && !isViewingOtherUser && (
          <div className={styles.adminSpecialBanner}>
            <div className={styles.adminSpecialGlow} />
            <div className={styles.adminSpecialContent}>
              <div className={styles.adminSpecialIconWrapper}>
                <span className={styles.adminSpecialIcon}>✨</span>
              </div>
              <div className={styles.adminSpecialText}>
                <div className={styles.adminSpecialTitle}>
                  <span>Item Khusus Administrator Terpasang</span>
                  <span className={styles.adminExclusiveTag}>KHUSUS ADMIN</span>
                </div>
                <p className={styles.adminSpecialDesc}>
                  <strong>Bintang Kebijakan Berkilau</strong> kini bersinar dan berkilau di karakter kucing Anda. Item legendaris ini hanya dimiliki Admin dan tidak ada di lemari kostum umum.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3 Key Metrics */}
        <div className={styles.metricGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricVal} style={{ color: 'var(--primary-coral)' }}>
              {userXP}
            </span>
            <span className={styles.metricLabel}>Total XP</span>
            <span className={styles.metricSub} style={{ color: '#059669' }}>
              Level {currentRank.level}
            </span>
          </div>

          <div className={styles.metricBox}>
            <span className={styles.metricVal} style={{ color: '#2563EB' }}>
              {evalCount}
            </span>
            <span className={styles.metricLabel}>Evaluasi</span>
            <span className={styles.metricSub}>Tuntas Uji</span>
          </div>

          <div className={styles.metricBox}>
            <span className={styles.metricVal} style={{ color: '#059669' }}>
              {upvoteCount.toLocaleString('id-ID')}
            </span>
            <span className={styles.metricLabel}>Upvotes</span>
            <span className={styles.metricSub}>{isViewingOtherUser ? 'Diterima Warga' : 'Suara Diberikan'}</span>
          </div>
        </div>
      </section>

      {/* 2. Kostum Terpasang (Equipped Slots) */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionTitleGroup}>
            <div className={styles.sectionIconBox}>
              <Icon name="checkroom" size={18} style={{ color: 'var(--primary-coral)' }} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Kostum Terpasang Saat Ini</h2>
              <span className={styles.sectionSub}>Ornamen yang sedang dipakai oleh {catProfile.name}</span>
            </div>
          </div>
        </div>

        <div className={styles.equippedSlotsGrid}>
          {slotsMeta.map((slotInfo) => {
            const equippedId = catProfile.equipped[slotInfo.slot];
            const item = getCostumeById(equippedId);

            return (
              <div key={slotInfo.slot} className={styles.slotCard}>
                <div className={styles.slotLeft}>
                  <div className={styles.slotIconBox}>
                    {item ? (
                      <CatVisualIcon name={item.id} size={24} />
                    ) : (
                      <CatVisualIcon name={`slot_${slotInfo.slot}`} size={20} />
                    )}
                  </div>
                  <div className={styles.slotDetails}>
                    <span className={styles.slotCategory}>{slotInfo.label}</span>
                    <span className={styles.slotItemName}>
                      {item ? item.name : 'Kosong'}
                    </span>
                  </div>
                </div>

                {!isViewingOtherUser && item && (
                  <button
                    className={styles.slotUnequipBtn}
                    onClick={() => handleUnequipSlot(slotInfo.slot)}
                    title="Lepas ornamen"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {!isViewingOtherUser && (
        <>
          {/* 3. Lemari Kostum / Fitting Room */}
          <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionTitleGroup}>
            <div className={styles.sectionIconBox}>
              <Icon name="styler" size={18} style={{ color: '#2563EB' }} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Lemari Kostum &amp; Kamar Pas</h2>
              <span className={styles.sectionSub}>Klik untuk memakai atau melepas kostum</span>
            </div>
          </div>
        </div>

        {/* Slot Tabs Filter */}
        <div className={styles.tabRow}>
          <button
            className={`${styles.tabBtn} ${selectedSlotTab === 'all' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedSlotTab('all')}
          >
            Semua
          </button>
          <button
            className={`${styles.tabBtn} ${selectedSlotTab === 'head' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedSlotTab('head')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <CatVisualIcon name="slot_head" size={14} />
            <span>Topi</span>
          </button>
          <button
            className={`${styles.tabBtn} ${selectedSlotTab === 'eyes' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedSlotTab('eyes')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <CatVisualIcon name="slot_eyes" size={14} />
            <span>Kacamata</span>
          </button>
          <button
            className={`${styles.tabBtn} ${selectedSlotTab === 'body' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedSlotTab('body')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <CatVisualIcon name="slot_body" size={14} />
            <span>Pakaian</span>
          </button>
          <button
            className={`${styles.tabBtn} ${selectedSlotTab === 'accessory' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedSlotTab('accessory')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <CatVisualIcon name="slot_accessory" size={14} />
            <span>Aksesoris</span>
          </button>
        </div>

        {/* Costume Grid */}
        <div className={styles.costumeGrid}>
          {filteredCostumes.map((item) => {
            const isEquipped = catProfile.equipped[item.slot] === item.id;
            const requiredRank = RANKS.find((r) => r.level === item.requiredLevel);
            const isUnlocked = userXP >= (requiredRank?.minXP || 0);

            return (
              <div
                key={item.id}
                className={`${styles.costumeCard} ${
                  isEquipped ? styles.costumeCardEquipped : ''
                } ${!isUnlocked ? styles.costumeCardLocked : ''}`}
                onClick={() => handleToggleCostume(item)}
              >
                <div className={styles.costumeTopRow}>
                  <div className={styles.costumeEmojiBox}>
                    <CatVisualIcon name={item.id} size={28} />
                  </div>
                  {isEquipped ? (
                    <span className={styles.equippedBadge}>Dipakai</span>
                  ) : !isUnlocked ? (
                    <span className={styles.lockedBadge}>
                      <Icon name="lock" size={10} />
                      Lvl {item.requiredLevel}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: '#059669',
                        background: '#ECFDF5',
                        padding: '2px 6px',
                        borderRadius: '9999px',
                      }}
                    >
                      Terbuka
                    </span>
                  )}
                </div>

                <h3 className={styles.costumeName}>{item.name}</h3>
                <p className={styles.costumeDesc}>{item.description}</p>

                <div className={styles.costumeFooter}>
                  <span className={styles.costumeLvlTag}>
                    {requiredRank ? `Lvl ${requiredRank.level}: ${requiredRank.name}` : 'Reward'}
                  </span>
                  {isUnlocked && (
                    <button
                      className={`${styles.equipActionBtn} ${
                        isEquipped ? styles.equipActionBtnActive : styles.equipActionBtnPassive
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCostume(item);
                      }}
                    >
                      {isEquipped ? 'Lepas' : 'Pasang'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Roadmap Achievement & Kostum (Level 1–7) */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionTitleGroup}>
            <div className={styles.sectionIconBox}>
              <Icon name="military_tech" size={18} style={{ color: 'var(--primary-coral)' }} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Roadmap Strata &amp; Hadiah Kostum</h2>
              <span className={styles.sectionSub}>Jalur reward reputasi publik Level 1–7</span>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: 'var(--primary-coral)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {Math.round(xpProgress.percentage)}%
          </span>
        </div>

        {/* XP Progress Bar */}
        <div className={styles.xpBarContainer}>
          <div className={styles.xpBarLabels}>
            <span style={{ fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {userXP} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {currentRank.maxXP} XP</span>
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary-coral)' }}>
              +{Math.max(0, currentRank.maxXP - userXP)} XP ke Level {Math.min(7, currentRank.level + 1)}
            </span>
          </div>
          <div className={styles.xpBarTrack}>
            <div className={styles.xpBarFill} style={{ width: `${xpProgress.percentage}%` }} />
          </div>
        </div>

        {/* 7-Tier Roadmap List */}
        <div className={styles.roadmapContainer}>
          {RANKS.map((r) => {
            const isDone = userXP > r.maxXP;
            const isCurrent = userXP >= r.minXP && userXP <= r.maxXP;
            const isLocked = userXP < r.minXP;

            // Get costumes unlocked at this level
            const levelCostumes = CAT_COSTUMES.filter((c) => c.requiredLevel === r.level);

            return (
              <div
                key={r.key}
                className={`${styles.roadmapItem} ${
                  isDone ? styles.roadmapItemDone : isCurrent ? styles.roadmapItemActive : styles.roadmapItemLocked
                }`}
              >
                <div className={styles.roadmapHeader}>
                  <div className={styles.roadmapTitleGroup}>
                    <span className={styles.roadmapLevelNum} style={{ background: r.color }}>
                      Lvl {r.level}
                    </span>
                    <div>
                      <span className={styles.roadmapTierName}>{r.name}</span>
                      <span className={styles.roadmapXPRequired}> · {r.minXP}–{r.maxXP} XP</span>
                    </div>
                  </div>

                  <div>
                    {isDone && (
                      <span className={styles.roadmapStatusBadge} style={{ background: '#DCFCE7', color: '#15803D' }}>
                        ✓ Terbuka
                      </span>
                    )}
                    {isCurrent && (
                      <span className={styles.roadmapStatusBadge} style={{ background: '#FFF1ED', color: '#C2410C' }}>
                        🔥 Aktif
                      </span>
                    )}
                    {isLocked && (
                      <span className={styles.roadmapStatusBadge} style={{ background: '#F1F5F9', color: '#64748B' }}>
                        🔒 Terkunci
                      </span>
                    )}
                  </div>
                </div>

                {/* Unlocked / Upcoming Costume Reward Chips */}
                <div className={styles.rewardChipsList}>
                  {levelCostumes.map((costume) => {
                    const isEquipped = catProfile.equipped[costume.slot] === costume.id;
                    return (
                      <div
                        key={costume.id}
                        className={`${styles.rewardChip} ${
                          !isLocked ? styles.rewardChipUnlocked : ''
                        } ${isEquipped ? styles.rewardChipEquipped : ''}`}
                        title={costume.description}
                      >
                        <span>{costume.icon}</span>
                        <span>{costume.name}</span>
                        {isEquipped && <span>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Lencana Kehormatan */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.sectionTitle}>Lencana &amp; Pencapaian Khusus</h2>
            <span className={styles.sectionSub}>4 lencana terbuka · 2 dalam progres</span>
          </div>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary-coral)' }}>
            Semua (12) →
          </span>
        </div>

        <div className={styles.badgesGrid}>
          {badges.map((b) => (
            <div key={b.name} className={styles.badgeCard}>
              <div className={styles.badgeEmojiBox} style={{ background: b.bg }}>
                {b.emoji}
              </div>
              <div className={styles.badgeInfo}>
                <span className={styles.badgeName}>{b.name}</span>
                <span
                  className={styles.badgeStatus}
                  style={{
                    color: b.color,
                    background: b.badgeBg,
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Akun Pengguna & Sesi Otorisasi */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="verified_user" size={18} style={{ color: '#FF6B4A' }} />
              <span>Status Akun &amp; Sesi Pengguna</span>
            </h3>
            <span className={styles.sectionSub}>
              {isAuthenticated
                ? authUser?.provider === 'guest'
                  ? 'Aktif sebagai Tamu (Data tersimpan di cache offline peramban)'
                  : 'Akun aktif dan terverifikasi di PolicySnap'
                : 'Masuk untuk mengamankan reputasi dan riwayat evaluasi Anda'}
            </span>
          </div>
        </div>

        {isAuthenticated && authUser ? (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: '#F8FAFC',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {authUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={authUser.avatarUrl} alt={authUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Icon name="person" size={24} style={{ color: '#64748B' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {authUser.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {authUser.email}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: '#16A34A',
                  background: '#DCFCE7',
                  padding: '4px 8px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                }}
              >
                ✓ Aktif
              </span>
            </div>

            <button
              type="button"
              id="btn-profile-signout"
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#FFF1F2',
                color: '#E11D48',
                border: '1px solid #FECDD3',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name="logout" size={16} />
              <span>Keluar dari Akun Google</span>
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '12px' }}>
            <GoogleLoginButton
              onSuccess={() => {
                showToast('Berhasil masuk dengan Google!', 'info');
              }}
              buttonText="Masuk dengan Google"
            />
          </div>
        )}
      </section>

      {/* 8. Akses Administrator Panel */}
      <section className={styles.sectionCard} style={{ background: '#FFF1ED', borderColor: 'rgba(255, 107, 74, 0.3)' }}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h3 className={styles.sectionTitle} style={{ color: '#C2410C', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="admin_panel_settings" size={18} style={{ color: '#FF6B4A' }} />
              <span>Panel Admin Kebijakan</span>
            </h3>
            <span className={styles.sectionSub} style={{ color: '#EA580C' }}>
              Kelola, tambah, dan terbitkan isu kebijakan baru secara langsung
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={() => router.push('/admin')}
          id="btn-goto-admin"
          style={{
            marginTop: '8px',
            fontSize: '0.8125rem',
            padding: '10px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Icon name="admin_panel_settings" size={18} />
          <span>Buka Dashboard Admin →</span>
        </button>
      </section>
        </>
      )}

      {/* Toast Feedback */}
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}

      <BottomNav />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="page" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Memuat profil warga...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
