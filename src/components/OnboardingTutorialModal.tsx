'use client';

import React, { useState } from 'react';
import Icon from './Icon';
import CatVisualIcon from './CatVisualIcon';
import styles from './OnboardingTutorialModal.module.css';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const TUTORIAL_SLIDES = [
  {
    step: 1,
    badge: 'Langkah 1/5 · Selamat Datang',
    title: 'Selamat Datang di PolicySnap',
    subtitle: 'Platform evaluasi kebijakan publik partisipatif pertama dengan gamifikasi kucing 2D.',
    icon: 'verified_user',
    iconColor: '#FF6B4A',
    bullets: [
      {
        emoji: '🏛️',
        title: 'Suara Publik yang Berdampak',
        desc: 'Berpartisipasi aktif menilai kebijakan pemerintah secara obyektif dan terukur.',
      },
      {
        emoji: '⚖️',
        title: 'Bebas Polarisasi Negatif',
        desc: 'Penilaian berbasis 4 pilar analisis rasional, bukan sekadar saling serang opini.',
      },
      {
        emoji: '📊',
        title: 'Konsensus Komunitas Terbuka',
        desc: 'Lihat peta radar konsensus warga dan perbandingannya dengan penilaian pribadi Anda.',
      },
    ],
  },
  {
    step: 2,
    badge: 'Langkah 2/5 · Karakter Pendamping',
    title: 'Kustomisasi Kucing Pendamping 2D',
    subtitle: 'Kucing setia yang menemani perjalanan analisis kebijakan Anda dari nol.',
    customVisual: 'cat_breeds',
    bullets: [
      {
        emoji: '🐈',
        title: 'Beri Nama Kucing (Default: Oyen)',
        desc: 'Bebas memberi nama kucing kesayangan atau gunakan tombol acak yang tersedia.',
      },
      {
        emoji: '🎨',
        title: 'Pilih Ras & Palet Warna',
        desc: 'Tersedia 3 pilihan ras original (Domestik, Persia, Siam) serta kombinasi warna bulu dan mata.',
      },
      {
        emoji: '👔',
        title: 'Buka Ornamen & Kostum',
        desc: 'Dapatkan topi, kacamata, pakaian, dan lencana baru di lemari seiring kenaikan level XP Anda.',
      },
    ],
  },
  {
    step: 3,
    badge: 'Langkah 3/5 · Navigasi Isu',
    title: 'Pilih Isu di Menu Beranda',
    subtitle: 'Temukan isu-isu regulasi hangat dan mutakhir yang sedang berdampak ke masyarakat.',
    icon: 'explore',
    iconColor: '#3B82F6',
    bullets: [
      {
        emoji: '🏠',
        title: 'Menu Beranda Isu Terkini',
        desc: 'Telusuri daftar isu berdasarkan kategori (Ekonomi, Pendidikan, Energi, Sosial, dll).',
      },
      {
        emoji: '📋',
        title: 'Ringkasan & Aktor Terdampak',
        desc: 'Pelajari ringkasan latar belakang, dokumen rujukan resmi, serta pihak-pihak terkait.',
      },
      {
        emoji: '⚡',
        title: 'Pilih Isu & Mulai Evaluasi',
        desc: 'Cukup klik kartu isu untuk langsung masuk ke Studio Evaluasi kebijakan.',
      },
    ],
  },
  {
    step: 4,
    badge: 'Langkah 4/5 · Studio Evaluasi',
    title: 'Evaluasi 4 Dimensi Kebijakan',
    subtitle: 'Gunakan slider intuitif untuk menilai kebijakan secara komprehensif.',
    icon: 'tune',
    iconColor: '#10B981',
    bullets: [
      {
        emoji: '🎯',
        title: 'Efektivitas & Efisiensi Anggaran',
        desc: 'Beri skor 1 - 10 untuk ketercapaian target kuantitatif dan penghematan fiskal publik.',
      },
      {
        emoji: '🤝',
        title: 'Keadilan Sosial & Responsivitas',
        desc: 'Nilai keadilan distribusi perlindungan masyarakat rentan serta ketanggapan aspirasi.',
      },
      {
        emoji: '🗳️',
        title: 'Tentukan Stans Anda',
        desc: 'Pilih apakah Anda Setuju, Dukung Bersyarat, atau Tolak Kebijakan tersebut.',
      },
    ],
  },
  {
    step: 5,
    badge: 'Langkah 5/5 · Gamifikasi & Hasil',
    title: 'Naik Strata & Bagikan Raport',
    subtitle: 'Tingkatkan reputasi akun dan pamerkan raport digital 9:16 Anda ke media sosial!',
    icon: 'military_tech',
    iconColor: '#8B5CF6',
    bullets: [
      {
        emoji: '🌟',
        title: 'Klaim +50 XP Tiap Evaluasi',
        desc: 'Tingkatkan peringkat Anda dari Warga Aktif (Level 1) hingga Negarawan (Level 7).',
      },
      {
        emoji: '📁',
        title: 'Menu Hasil Evaluasi',
        desc: 'Semua isu yang telah Anda nilai tersimpan rapi dan dapat ditinjau kembali sewaktu-waktu.',
      },
      {
        emoji: '📱',
        title: 'Raport Digital Siap Share 9:16',
        desc: 'Unduh kartu raport estetis untuk dibagikan ke Instagram Story atau WhatsApp Status.',
      },
    ],
  },
];

export default function OnboardingTutorialModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingTutorialModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Mulai dari slide pertama setiap kali modal dibuka (adjust state saat render, tanpa effect)
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setCurrentSlideIndex(0);
  }

  if (!isOpen) return null;

  const slide = TUTORIAL_SLIDES[currentSlideIndex];
  const isLastSlide = currentSlideIndex === TUTORIAL_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('policysnap_tutorial_seen', 'true');
      }
      onClose();
      if (onComplete) onComplete();
    } else {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('policysnap_tutorial_seen', 'true');
    }
    onClose();
    if (onComplete) onComplete();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard} role="dialog" aria-modal="true">
        {/* Header Bar */}
        <div className={styles.headerRow}>
          <span className={styles.badgeStep}>{slide.badge}</span>
          <button
            type="button"
            className={styles.skipBtn}
            onClick={handleSkip}
            title="Lewati panduan"
          >
            Lewati Tutorial ✕
          </button>
        </div>

        {/* Visual Hero */}
        <div className={styles.heroBox}>
          {slide.customVisual === 'cat_breeds' ? (
            <div className={styles.breedIconsRow}>
              <div className={styles.breedIconItem}>
                <CatVisualIcon name="breed_domestik" size={54} />
                <span>Domestik</span>
              </div>
              <div className={styles.breedIconItem}>
                <CatVisualIcon name="breed_persia" size={54} />
                <span>Persia</span>
              </div>
              <div className={styles.breedIconItem}>
                <CatVisualIcon name="breed_siam" size={54} />
                <span>Siam</span>
              </div>
            </div>
          ) : (
            <div
              className={styles.heroIconCircle}
              style={{
                background: `linear-gradient(135deg, ${slide.iconColor} 0%, #FFA07A 100%)`,
              }}
            >
              <Icon name={slide.icon || 'star'} size={36} style={{ color: 'white' }} />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className={styles.contentBody}>
          <h2 className={styles.title}>{slide.title}</h2>
          <p className={styles.subtitle}>{slide.subtitle}</p>

          <div className={styles.bulletList}>
            {slide.bullets.map((b, idx) => (
              <div key={idx} className={styles.bulletItem}>
                <span className={styles.bulletEmoji}>{b.emoji}</span>
                <div>
                  <div className={styles.bulletTitle}>{b.title}</div>
                  <div className={styles.bulletDesc}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot Indicators */}
        <div className={styles.dotsRow}>
          {TUTORIAL_SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={`${styles.dot} ${idx === currentSlideIndex ? styles.dotActive : ''}`}
              onClick={() => setCurrentSlideIndex(idx)}
            />
          ))}
        </div>

        {/* Action Buttons Footer */}
        <div className={styles.footerRow}>
          {currentSlideIndex > 0 ? (
            <button
              type="button"
              className={styles.prevBtn}
              onClick={handlePrev}
            >
              ← Kembali
            </button>
          ) : (
            <div style={{ width: 80 }} />
          )}

          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleNext}
          >
            <span>{isLastSlide ? 'Mulai Kustomisasi Kucing! ✨' : 'Lanjut →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
