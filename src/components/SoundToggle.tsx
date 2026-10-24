'use client';

import React, { useState } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import { soundService } from '@/lib/soundService';
import Icon from './Icon';

interface SoundToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function SoundToggle({ className = '', style = {} }: SoundToggleProps) {
  // null = belum diubah user → ikuti status soundService (dibaca setelah hidrasi)
  const hydrated = useHydrated();
  const [mutedOverride, setIsMuted] = useState<boolean | null>(null);
  const [bgmOverride, setBgmActive] = useState<boolean | null>(null);
  const isMuted = mutedOverride ?? (hydrated && soundService.getIsMuted());
  const bgmActive = bgmOverride ?? (hydrated && soundService.isBgmPlaying());
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggleMute = () => {
    const nextMuted = soundService.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundService.playTap();
    }
  };

  const handleToggleBgm = () => {
    const nextBgm = soundService.toggleBgm();
    setBgmActive(nextBgm);
    if (nextBgm) {
      setIsMuted(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        ...style,
      }}
      className={className}
    >
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        title={isMuted ? 'Suara Senyap (Klik untuk atur)' : 'Suara Aktif (Klik untuk atur)'}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.08)',
          background: isMuted ? '#F1F5F9' : '#FFF1ED',
          color: isMuted ? '#94A3B8' : '#FF6B4A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <Icon name={isMuted ? 'volume_off' : bgmActive ? 'music_note' : 'volume_up'} size={17} />
      </button>

      {/* Popover Controls Menu */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '0',
            zIndex: 100,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '10px',
            minWidth: '180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '2px 6px',
            }}
          >
            Audio &amp; Musik
          </div>

          <button
            type="button"
            onClick={handleToggleMute}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '10px',
              border: 'none',
              background: isMuted ? '#F8FAFC' : '#EFF6FF',
              color: isMuted ? '#64748B' : '#1D4ED8',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name={isMuted ? 'volume_off' : 'volume_up'} size={15} />
              <span>Efek Suara</span>
            </span>
            <span style={{ fontSize: '0.6875rem' }}>{isMuted ? 'Mati' : 'Aktif'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleBgm}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '10px',
              border: 'none',
              background: bgmActive ? '#FFF1ED' : '#F8FAFC',
              color: bgmActive ? '#FF6B4A' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="music_note" size={15} />
              <span>Musik Cozy BGM</span>
            </span>
            <span style={{ fontSize: '0.6875rem' }}>{bgmActive ? 'Menyala 🎵' : 'Mati'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playCatMeow();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '10px',
              border: '1px dashed #CBD5E1',
              background: 'transparent',
              color: '#475569',
              fontSize: '0.75rem',
              cursor: 'pointer',
              justifyContent: 'center',
            }}
          >
            <span>🐱 Suara Meong</span>
          </button>
        </div>
      )}
    </div>
  );
}
