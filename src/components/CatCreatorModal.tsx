'use client';

import React, { useState } from 'react';
import { CatProfile, CatBreed, CatGender } from '@/types';
import {
  BREED_OPTIONS,
  COLOR_SWATCHES,
  saveCatProfile,
} from '@/data/catCostumes';
import CatAvatar from './CatAvatar';
import Icon from './Icon';
import styles from './CatCreatorModal.module.css';

interface CatCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: CatProfile;
  onSave: (savedProfile: CatProfile) => void;
  isFirstTime?: boolean;
}

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

export default function CatCreatorModal({
  isOpen,
  onClose,
  initialProfile,
  onSave,
  isFirstTime = false,
}: CatCreatorModalProps) {
  const [name, setName] = useState(initialProfile.name || 'Oyen Kebijakan');
  const [gender, setGender] = useState<CatGender>(initialProfile.gender || 'male');
  const [breed, setBreed] = useState<CatBreed>(initialProfile.breed || 'domestik');
  const [furColor, setFurColor] = useState(initialProfile.furColor || '#F97316');
  const [bellyColor, setBellyColor] = useState(initialProfile.bellyColor || '#FFEDD5');
  const [eyeColor, setEyeColor] = useState(initialProfile.eyeColor || '#10B981');

  if (!isOpen) return null;

  const currentPreview: CatProfile = {
    ...initialProfile,
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

  const handleSave = () => {
    const finalProfile: CatProfile = {
      ...initialProfile,
      name: name.trim() || 'Kucing Kebijakan',
      gender,
      breed,
      furColor,
      bellyColor,
      eyeColor,
    };
    saveCatProfile(finalProfile);
    onSave(finalProfile);
    onClose();
  };

  const currentBreedObj = BREED_OPTIONS.find((b) => b.id === breed) || BREED_OPTIONS[0];

  return (
    <div className={styles.backdrop} onClick={isFirstTime ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>
              <span>🐱</span>
              {isFirstTime ? 'Pilih Karakter Kucing 2D Anda' : 'Kustomisasi Karakter Kucing'}
            </h2>
            <span className={styles.subTitle}>
              {isFirstTime
                ? 'Pilih ras, jenis kelamin, dan warna tubuh untuk pendamping evaluasi Anda'
                : 'Ubah penampilan dasar kucing pelindung kebijakan Anda'}
            </span>
          </div>
          {!isFirstTime && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
              <Icon name="close" size={18} />
            </button>
          )}
        </div>

        {/* PINNED STICKY TOP PREVIEW (SELALU TAMPIL FULL & TIDAK TERTUTUP) */}
        <div className={styles.stickyPreviewDock}>
          <span className={styles.previewBadge}>
            {gender === 'male' ? '♂ Jantan' : '♀ Betina'} · {currentBreedObj.name}
          </span>
          <div className={styles.avatarWrapperFull}>
            <CatAvatar profile={currentPreview} size={140} animate={true} />
          </div>
          <h3 className={styles.previewTitle}>
            {name || 'Tanpa Nama'}
            <span style={{ fontSize: '0.8125rem', color: 'var(--primary-coral)' }}>
              {gender === 'male' ? '🐾' : '✨'}
            </span>
          </h3>
          <span className={styles.previewSub}>{currentBreedObj.tagline}</span>
        </div>

        {/* SCROLLABLE CONTROLS BODY */}
        <div className={styles.scrollContent}>
          {/* 1. Pilih Gender */}
          <div className={styles.sectionGroup}>
            <div className={styles.sectionLabel}>
              <Icon name="badge" size={16} style={{ color: 'var(--primary-coral)' }} />
              <span>1. Jenis Kelamin Kucing</span>
            </div>
            <div className={styles.genderRow}>
              <div
                className={`${styles.genderCard} ${gender === 'male' ? styles.genderCardActive : ''}`}
                onClick={() => setGender('male')}
              >
                <span className={styles.genderIcon}>♂️</span>
                <div className={styles.genderText}>
                  <span className={styles.genderTitle}>Laki-laki (Jantan)</span>
                  <span className={styles.genderSub}>Pemberani, lincah &amp; ramah</span>
                </div>
              </div>

              <div
                className={`${styles.genderCard} ${gender === 'female' ? styles.genderCardActive : ''}`}
                onClick={() => setGender('female')}
              >
                <span className={styles.genderIcon}>♀️</span>
                <div className={styles.genderText}>
                  <span className={styles.genderTitle}>Perempuan (Betina)</span>
                  <span className={styles.genderSub}>Bulu manis, bulu mata &amp; anggun</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Pilih Ras Kucing */}
          <div className={styles.sectionGroup}>
            <div className={styles.sectionLabel}>
              <Icon name="pets" size={16} style={{ color: 'var(--primary-coral)' }} />
              <span>2. Ras Kucing</span>
              <span className={styles.sectionLabelDesc}>(3 Pilihan)</span>
            </div>
            <div className={styles.breedGrid}>
              {BREED_OPTIONS.map((b) => (
                <div
                  key={b.id}
                  className={`${styles.breedCard} ${breed === b.id ? styles.breedCardActive : ''}`}
                  onClick={() => setBreed(b.id)}
                >
                  <span className={styles.breedTag}>{b.tagline}</span>
                  <span className={styles.breedEmoji}>
                    {b.id === 'domestik' ? '🐈' : b.id === 'persia' ? '🦁' : '🐆'}
                  </span>
                  <span className={styles.breedName}>{b.name}</span>
                  <span className={styles.breedDesc}>{b.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Preset Cepat */}
          <div className={styles.sectionGroup}>
            <div className={styles.sectionLabel}>
              <Icon name="palette" size={16} style={{ color: 'var(--primary-coral)' }} />
              <span>3. Preset Warna Siap Pakai</span>
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

          {/* 4. Kustomisasi Detail Warna */}
          <div className={styles.sectionGroup}>
            <div className={styles.sectionLabel}>
              <Icon name="tune" size={16} style={{ color: 'var(--primary-coral)' }} />
              <span>4. Kustomisasi Warna Spesifik Tubuh</span>
            </div>

            {/* Warna Bulu Utama */}
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

            {/* Warna Dada / Perut */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Warna Dada / Perut / Moncong:
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

            {/* Warna Mata */}
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

          {/* 5. Beri Nama Kucing */}
          <div className={styles.sectionGroup}>
            <div className={styles.sectionLabel}>
              <Icon name="edit" size={16} style={{ color: 'var(--primary-coral)' }} />
              <span>5. Beri Nama Kucing Pendamping</span>
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
                title="Acak nama keren"
              >
                <Icon name="casino" size={16} />
                <span>Acak</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          {!isFirstTime && (
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Batal
            </button>
          )}
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            id="btn-save-cat-profile"
          >
            <Icon name="check_circle" size={18} />
            <span>{isFirstTime ? 'Simpan Karakter & Mulai Bermain →' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
