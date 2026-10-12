'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CatProfile, CatBreed, CatGender } from '@/types';
import {
  BREED_OPTIONS,
  COLOR_SWATCHES,
  DEFAULT_CAT_PROFILE,
  saveCatProfile,
} from '@/data/catCostumes';
import CatAvatar from '@/components/CatAvatar';
import CatVisualIcon from '@/components/CatVisualIcon';
import SoundToggle from '@/components/SoundToggle';
import OnboardingTutorialModal from '@/components/OnboardingTutorialModal';
import Icon from '@/components/Icon';
import { useAuth } from '@/presentation/hooks/useAuth';
import { soundService } from '@/lib/soundService';
import styles from './onboarding.module.css';

const RANDOM_NAMES = [
  'Oyen',
  'Miko Kritis',
  'Luna Advokat',
  'Sultan Negarawan',
  'Boba Auditor',
  'Kiki Kritis',
  'Chiko Riset',
  'Milo Regulasi',
  'Cleo Konsultan',
  'Simba Parlemen',
];

const PRESETS = [
  {
    name: 'Oyen Bar-bar',
    breed: 'domestik' as CatBreed,
    fur: '#F97316',
    belly: '#FFEDD5',
    eye: '#10B981',
  },
  {
    name: 'Putih Fluffy',
    breed: 'persia' as CatBreed,
    fur: '#F8FAFC',
    belly: '#FFFFFF',
    eye: '#3B82F6',
  },
  {
    name: 'Siam Diplomat',
    breed: 'siam' as CatBreed,
    fur: '#E2E8F0',
    belly: '#F8FAFC',
    eye: '#0284C7',
  },
  {
    name: 'Hitam Panther',
    breed: 'domestik' as CatBreed,
    fur: '#1E293B',
    belly: '#334155',
    eye: '#F59E0B',
  },
  {
    name: 'Calico Belang',
    breed: 'persia' as CatBreed,
    fur: '#FED7AA',
    belly: '#FFFFFF',
    eye: '#10B981',
  },
  {
    name: 'Latte Mewah',
    breed: 'siam' as CatBreed,
    fur: '#A16207',
    belly: '#FEF3C7',
    eye: '#8B5CF6',
  },
];

export default function OnboardingCatPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Sesuai revisi poin 4: nama default adalah "Oyen"
  const [name, setName] = useState('Oyen');
  const [gender, setGender] = useState<CatGender>('male');
  const [breed, setBreed] = useState<CatBreed>('domestik');
  const [furColor, setFurColor] = useState('#F97316');
  const [bellyColor, setBellyColor] = useState('#FFEDD5');
  const [eyeColor, setEyeColor] = useState('#10B981');
  const [saving, setSaving] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Auto trigger tutorial for new visitors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('policysnap_tutorial_seen');
      if (!seen) {
        setShowTutorial(true);
      }
    }
  }, []);

  const currentPreview: CatProfile = {
    ...DEFAULT_CAT_PROFILE,
    name,
    gender,
    breed,
    furColor,
    bellyColor,
    eyeColor,
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    soundService.playSelect();
    setBreed(preset.breed);
    setFurColor(preset.fur);
    setBellyColor(preset.belly);
    setEyeColor(preset.eye);
  };

  const handleRandomName = () => {
    soundService.playTap();
    const randomPick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setName(randomPick);
  };

  const handleSaveAndContinue = async () => {
    soundService.playSuccess();
    setSaving(true);
    const finalProfile: CatProfile = {
      ...DEFAULT_CAT_PROFILE,
      name: name.trim() || 'Oyen',
      gender,
      breed,
      furColor,
      bellyColor,
      eyeColor,
    };

    saveCatProfile(finalProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('policysnap_cat_profile_created', 'true');
    }

    // Sync to user profile if user is active
    if (user?.id) {
      try {
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            catAvatar: finalProfile,
          }),
        });
      } catch (err) {
        console.warn('Could not sync cat to profile API:', err);
      }
    }

    // Sesuai revisi poin 6: setelah buat kucing masuk ke Beranda (/home) untuk memilih isu
    router.push('/home');
  };

  const currentBreedObj = BREED_OPTIONS.find((b) => b.id === breed) || BREED_OPTIONS[0];

  return (
    <div className={styles.pageContainer}>
      {/* Walkthrough Tutorial Modal */}
      <OnboardingTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* 1. Header Bar */}
      <header className={styles.topHeader}>
        <div className={styles.brandGroup}>
          <div className={styles.brandIcon}>
            <Icon name="pets" size={18} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>Kucing Pendamping</h1>
            <span className={styles.headerStep}>Personalisasi Karakter 2D</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '5px 8px', color: 'var(--primary-coral)' }}
            onClick={() => setShowTutorial(true)}
            title="Buka panduan awal aplikasi"
          >
            <span>💡 Tutorial</span>
          </button>
          <SoundToggle />
          <button
            type="button"
            className={styles.skipBtn}
            onClick={handleSaveAndContinue}
          >
            Lewati →
          </button>
        </div>
      </header>

      {/* 2. PINNED STICKY TOP PREVIEW DOCK (SELALU TAMPIL PENUH & TIDAK TERTUTUP) */}
      <div className={styles.stickyPreviewDock}>
        <span className={styles.previewBadge}>
          {gender === 'male' ? '♂ Jantan' : '♀ Betina'} · {currentBreedObj.name}
        </span>
        <div className={styles.avatarBox}>
          <CatAvatar profile={currentPreview} size={150} animate={true} />
        </div>
        <h2 className={styles.previewName}>
          {name || 'Tanpa Nama'}
          <span style={{ fontSize: '0.85rem', color: 'var(--primary-coral)' }}>
            {gender === 'male' ? '🐾' : '✨'}
          </span>
        </h2>
        <span className={styles.previewTagline}>{currentBreedObj.tagline}</span>
      </div>

      {/* 3. SCROLLABLE CONTROLS BODY (URUTAN SESUAI PERMINTAAN USER) */}
      <div className={styles.controlsBody}>
        {/* REVISI POIN 4: NOMOR 1 ADALAH NAMA KUCING PENDAMPING */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="edit" size={18} style={{ color: '#FF6B4A' }} />
              <span>1. Nama Kucing Pendamping</span>
            </h3>
            <span className={styles.sectionHelp}>Default: Oyen</span>
          </div>
          <div className={styles.nameInputRow}>
            <input
              type="text"
              className={styles.nameInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Oyen"
            />
            <button
              type="button"
              className={styles.randomNameBtn}
              onClick={handleRandomName}
            >
              <Icon name="casino" size={16} />
              <span>Acak</span>
            </button>
          </div>
        </div>

        {/* REVISI POIN 4: NOMOR 2 ADALAH JENIS KELAMIN KUCING */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="badge" size={18} style={{ color: '#FF6B4A' }} />
              <span>2. Jenis Kelamin Kucing</span>
            </h3>
            <span className={styles.sectionHelp}>Karakteristik visual</span>
          </div>
          <div className={styles.genderGrid}>
            <div
              className={`${styles.genderItem} ${gender === 'male' ? styles.genderItemActive : ''}`}
              onClick={() => {
                soundService.playTap();
                setGender('male');
              }}
            >
              <span className={styles.genderIcon}>♂️</span>
              <div>
                <div className={styles.genderTitle}>Laki-laki (Jantan)</div>
                <div className={styles.genderSub}>Pemberani &amp; tanggap</div>
              </div>
            </div>

            <div
              className={`${styles.genderItem} ${gender === 'female' ? styles.genderItemActive : ''}`}
              onClick={() => {
                soundService.playTap();
                setGender('female');
              }}
            >
              <span className={styles.genderIcon}>♀️</span>
              <div>
                <div className={styles.genderTitle}>Perempuan (Betina)</div>
                <div className={styles.genderSub}>Bulu mata &amp; elegan</div>
              </div>
            </div>
          </div>
        </div>

        {/* REVISI POIN 2 & 4: NOMOR 3 ADALAH RAS KUCING DENGAN IKON ORIGINAL NON-EMOJI */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="pets" size={18} style={{ color: '#FF6B4A' }} />
              <span>3. Ras Kucing</span>
            </h3>
            <span className={styles.sectionHelp}>(3 Pilihan Ras Original)</span>
          </div>
          <div className={styles.breedGrid}>
            {BREED_OPTIONS.map((b) => (
              <div
                key={b.id}
                className={`${styles.breedItem} ${breed === b.id ? styles.breedItemActive : ''}`}
                onClick={() => {
                  soundService.playSelect();
                  setBreed(b.id);
                }}
              >
                <span className={styles.breedTag}>{b.tagline}</span>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                  <CatVisualIcon name={b.id} size={46} />
                </div>
                <div className={styles.breedName}>{b.name}</div>
                <div className={styles.breedDesc}>{b.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Presets */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="palette" size={18} style={{ color: '#FF6B4A' }} />
              <span>4. Preset Warna Siap Pakai</span>
            </h3>
            <span className={styles.sectionHelp}>1-klik ubah tema</span>
          </div>
          <div className={styles.presetGrid}>
            {PRESETS.map((p, idx) => (
              <div key={idx} className={styles.presetCard} onClick={() => handleApplyPreset(p)}>
                <div
                  className={styles.presetDot}
                  style={{
                    background: `linear-gradient(135deg, ${p.fur} 50%, ${p.belly} 50%)`,
                  }}
                />
                <span className={styles.presetTitle}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Custom Colors */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="tune" size={18} style={{ color: '#FF6B4A' }} />
              <span>5. Kustomisasi Warna Bagian Tubuh</span>
            </h3>
          </div>

          {/* Fur color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Warna Bulu Utama:
            </span>
            <div className={styles.swatchRow}>
              {COLOR_SWATCHES.fur.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  className={`${styles.swatchBtn} ${furColor === s.hex ? styles.swatchBtnActive : ''}`}
                  style={{ backgroundColor: s.hex }}
                  onClick={() => {
                    soundService.playTap();
                    setFurColor(s.hex);
                  }}
                  title={s.label}
                >
                  {furColor === s.hex && (
                    <span className={styles.swatchCheck}>
                      <Icon name="check" size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Belly color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Warna Dada &amp; Moncong:
            </span>
            <div className={styles.swatchRow}>
              {COLOR_SWATCHES.belly.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  className={`${styles.swatchBtn} ${bellyColor === s.hex ? styles.swatchBtnActive : ''}`}
                  style={{ backgroundColor: s.hex }}
                  onClick={() => {
                    soundService.playTap();
                    setBellyColor(s.hex);
                  }}
                  title={s.label}
                >
                  {bellyColor === s.hex && (
                    <span className={styles.swatchCheck}>
                      <Icon name="check" size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Eye color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Warna Mata Kucing:
            </span>
            <div className={styles.swatchRow}>
              {COLOR_SWATCHES.eye.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  className={`${styles.swatchBtn} ${eyeColor === s.hex ? styles.swatchBtnActive : ''}`}
                  style={{ backgroundColor: s.hex }}
                  onClick={() => {
                    soundService.playTap();
                    setEyeColor(s.hex);
                  }}
                  title={s.label}
                >
                  {eyeColor === s.hex && (
                    <span className={styles.swatchCheck}>
                      <Icon name="check" size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. FIXED BOTTOM CTA DOCK */}
      <div className={styles.fixedBottomDock}>
        <div className={styles.fixedBottomInner}>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSaveAndContinue}
            disabled={saving}
            id="btn-onboarding-finish"
          >
            <span>{saving ? 'Menyimpan...' : 'Simpan & Masuk ke Beranda Isu →'}</span>
            <Icon name="arrow_forward" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
