'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CatProfile, CatBreed, CatGender } from '@/types';
import {
  BREED_OPTIONS,
  COLOR_SWATCHES,
  DEFAULT_CAT_PROFILE,
  saveCatProfile,
} from '@/data/catCostumes';
import CatAvatar from '@/components/CatAvatar';
import Icon from '@/components/Icon';
import { useAuth } from '@/presentation/hooks/useAuth';
import styles from './onboarding.module.css';

const RANDOM_NAMES = [
  'Oyen Kebijakan',
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
  const [name, setName] = useState('Oyen Kebijakan');
  const [gender, setGender] = useState<CatGender>('male');
  const [breed, setBreed] = useState<CatBreed>('domestik');
  const [furColor, setFurColor] = useState('#F97316');
  const [bellyColor, setBellyColor] = useState('#FFEDD5');
  const [eyeColor, setEyeColor] = useState('#10B981');
  const [saving, setSaving] = useState(false);

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
    setBreed(preset.breed);
    setFurColor(preset.fur);
    setBellyColor(preset.belly);
    setEyeColor(preset.eye);
  };

  const handleRandomName = () => {
    const randomPick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setName(randomPick);
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    const finalProfile: CatProfile = {
      ...DEFAULT_CAT_PROFILE,
      name: name.trim() || 'Kucing Kebijakan',
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

    // Navigasi langsung ke kolom evaluasi sesuai urutan flow yang diminta user
    router.push('/evaluate');
  };

  const currentBreedObj = BREED_OPTIONS.find((b) => b.id === breed) || BREED_OPTIONS[0];

  return (
    <div className={styles.pageContainer}>
      {/* 1. Header Bar */}
      <header className={styles.topHeader}>
        <div className={styles.brandGroup}>
          <div className={styles.brandIcon}>
            <Icon name="pets" size={18} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>Kucing Pendamping</h1>
            <span className={styles.headerStep}>Tahap 1 dari 2 · Gamifikasi 2D</span>
          </div>
        </div>
        <button
          type="button"
          className={styles.skipBtn}
          onClick={handleSaveAndContinue}
        >
          Lewati →
        </button>
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

      {/* 3. SCROLLABLE CONTROLS BODY */}
      <div className={styles.controlsBody}>
        {/* Section: Gender */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="badge" size={18} style={{ color: '#FF6B4A' }} />
              <span>1. Jenis Kelamin Kucing</span>
            </h3>
            <span className={styles.sectionHelp}>Karakteristik visual</span>
          </div>
          <div className={styles.genderGrid}>
            <div
              className={`${styles.genderItem} ${gender === 'male' ? styles.genderItemActive : ''}`}
              onClick={() => setGender('male')}
            >
              <span className={styles.genderIcon}>♂️</span>
              <div>
                <div className={styles.genderTitle}>Laki-laki (Jantan)</div>
                <div className={styles.genderSub}>Pemberani &amp; tanggap</div>
              </div>
            </div>

            <div
              className={`${styles.genderItem} ${gender === 'female' ? styles.genderItemActive : ''}`}
              onClick={() => setGender('female')}
            >
              <span className={styles.genderIcon}>♀️</span>
              <div>
                <div className={styles.genderTitle}>Perempuan (Betina)</div>
                <div className={styles.genderSub}>Bulu mata &amp; elegan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Breed */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="pets" size={18} style={{ color: '#FF6B4A' }} />
              <span>2. Ras Kucing</span>
            </h3>
            <span className={styles.sectionHelp}>(3 Pilihan Ras)</span>
          </div>
          <div className={styles.breedGrid}>
            {BREED_OPTIONS.map((b) => (
              <div
                key={b.id}
                className={`${styles.breedItem} ${breed === b.id ? styles.breedItemActive : ''}`}
                onClick={() => setBreed(b.id)}
              >
                <span className={styles.breedTag}>{b.tagline}</span>
                <span className={styles.breedEmoji}>
                  {b.id === 'domestik' ? '🐈' : b.id === 'persia' ? '🦁' : '🐆'}
                </span>
                <div className={styles.breedName}>{b.name}</div>
                <div className={styles.breedDesc}>{b.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Presets */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="palette" size={18} style={{ color: '#FF6B4A' }} />
              <span>3. Preset Warna Siap Pakai</span>
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

        {/* Section: Custom Colors */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="tune" size={18} style={{ color: '#FF6B4A' }} />
              <span>4. Kustomisasi Warna Bagian Tubuh</span>
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
                  onClick={() => setFurColor(s.hex)}
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
                  onClick={() => setBellyColor(s.hex)}
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
                  onClick={() => setEyeColor(s.hex)}
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

        {/* Section: Name */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Icon name="edit" size={18} style={{ color: '#FF6B4A' }} />
              <span>5. Nama Kucing Pendamping</span>
            </h3>
          </div>
          <div className={styles.nameInputRow}>
            <input
              type="text"
              className={styles.nameInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="cth: Oyen Kebijakan"
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
            <span>{saving ? 'Menyimpan...' : 'Simpan & Mulai Evaluasi Kebijakan →'}</span>
            <Icon name="arrow_forward" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
