'use client';

import React from 'react';
import { CatProfile } from '@/types';

interface CatAvatarProps {
  profile: CatProfile;
  size?: number | string;
  className?: string;
  showBackground?: boolean;
  animate?: boolean;
}

export default function CatAvatar({
  profile,
  size = 180,
  className = '',
  showBackground = true,
  animate = true,
}: CatAvatarProps) {
  const {
    gender = 'male',
    breed = 'domestik',
    furColor = '#F97316',
    bellyColor = '#FFEDD5',
    eyeColor = '#10B981',
    earColor = '#FDA4AF',
    equipped = {},
  } = profile;

  // Determine darker fur accent for tabby stripes / details
  const isDarkFur = furColor === '#1E293B' || furColor === '#0F172A';
  const furAccent = isDarkFur ? '#334155' : 'rgba(0, 0, 0, 0.15)';
  const muzzleMaskColor = breed === 'siam' ? '#78350F' : bellyColor;

  return (
    <div
      className={`cat-avatar-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        style={{
          overflow: 'visible',
          filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.08))',
        }}
      >
        <defs>
          {/* Background Radial Gradient */}
          <radialGradient id="catBgGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFF1ED" />
            <stop offset="70%" stopColor="#FFE4DE" />
            <stop offset="100%" stopColor="#FED7AA" />
          </radialGradient>

          {/* Eye Iris Gradient */}
          <radialGradient id="eyeGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="30%" stopColor={eyeColor} />
            <stop offset="100%" stopColor="#064E3B" />
          </radialGradient>

          {/* Gold Shimmer Gradient */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>

          {/* Ruby Royal Gradient */}
          <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#991B1B" />
            <stop offset="100%" stopColor="#450A0A" />
          </linearGradient>

          {/* Subtle Inner Shadow Filter */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <style>
          {`
            @keyframes catTailWag {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(14deg); }
            }
            @keyframes catFloat {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-4px); }
            }
            @keyframes catBlink {
              0%, 92%, 100% { transform: scaleY(1); }
              96% { transform: scaleY(0.1); }
            }
            @keyframes catEarTwitch {
              0%, 94%, 100% { transform: rotate(0deg); }
              96% { transform: rotate(-5deg); }
              98% { transform: rotate(3deg); }
            }
            .cat-animated-body {
              ${animate ? 'animation: catFloat 3.5s ease-in-out infinite;' : ''}
              transform-origin: center bottom;
            }
            .cat-tail {
              ${animate ? 'animation: catTailWag 2.8s ease-in-out infinite;' : ''}
              transform-origin: 155px 145px;
            }
            .cat-eyes-group {
              ${animate ? 'animation: catBlink 4s infinite;' : ''}
              transform-origin: 100px 92px;
            }
            .cat-left-ear {
              ${animate ? 'animation: catEarTwitch 5.5s infinite;' : ''}
              transform-origin: 65px 55px;
            }
          `}
        </style>

        {/* 0. Optional Backdrop Disc */}
        {showBackground && (
          <g>
            <circle cx="100" cy="100" r="92" fill="url(#catBgGrad)" />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeOpacity="0.8"
            />
          </g>
        )}

        <g className="cat-animated-body">
          {/* 1. TAIL */}
          <g className="cat-tail">
            <path
              d="M 148 140 C 172 135, 186 110, 180 88 C 176 74, 162 76, 165 88 C 168 102, 156 122, 138 128 Z"
              fill={breed === 'siam' ? '#78350F' : furColor}
            />
            {/* Tail fluff tip */}
            <circle
              cx="173"
              cy="80"
              r="7"
              fill={breed === 'siam' ? '#5A2609' : breed === 'persia' ? bellyColor : furColor}
            />
          </g>

          {/* 2. CAT TORSO & PAWS (BASE) */}
          <g id="cat-body-base">
            {/* Main torso */}
            <path
              d="M 64 120 C 58 145, 52 170, 72 178 C 88 182, 112 182, 128 178 C 148 170, 142 145, 136 120 Z"
              fill={furColor}
            />

            {/* Belly patch */}
            <path
              d="M 82 125 C 78 145, 78 168, 100 172 C 122 168, 122 145, 118 125 C 108 122, 92 122, 82 125 Z"
              fill={bellyColor}
            />

            {/* Breed Fluff on chest if Persia */}
            {breed === 'persia' && (
              <path
                d="M 80 128 C 72 138, 76 150, 86 148 C 84 156, 96 162, 100 156 C 104 162, 116 156, 114 148 C 124 150, 128 138, 120 128 Z"
                fill={bellyColor}
                opacity="0.9"
              />
            )}

            {/* Back Paws */}
            <ellipse cx="62" cy="172" rx="14" ry="9" fill={furColor} />
            <ellipse cx="138" cy="172" rx="14" ry="9" fill={furColor} />

            {/* Front Little Paws */}
            <ellipse cx="86" cy="170" rx="9" ry="7" fill={bellyColor} />
            <ellipse cx="114" cy="170" rx="9" ry="7" fill={bellyColor} />
            {/* Paw toe dividers */}
            <path d="M 83 167 L 83 174 M 88 167 L 88 174" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 111 167 L 111 174 M 116 167 L 116 174" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* 3. BODY COSTUME LAYER (Behind head, over torso) */}
          {equipped.body && (
            <g id="costume-body">
              {equipped.body === 'body_kaos' && (
                <g>
                  {/* Casual Cotton T-Shirt */}
                  <path
                    d="M 68 124 C 60 144, 62 168, 74 172 C 86 175, 114 175, 126 172 C 138 168, 140 144, 132 124 Z"
                    fill="#3B82F6"
                  />
                  {/* Crew neck collar */}
                  <path
                    d="M 85 124 C 92 134, 108 134, 115 124"
                    fill="none"
                    stroke="#1D4ED8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Pocket emblem */}
                  <rect x="78" y="140" width="10" height="12" rx="2" fill="#2563EB" />
                  <path d="M 81 144 L 85 147 L 89 144" fill="none" stroke="#FFFFFF" strokeWidth="1" />
                </g>
              )}

              {equipped.body === 'body_hoodie' && (
                <g>
                  {/* Tech Navy Hoodie */}
                  <path
                    d="M 66 122 C 58 144, 60 170, 74 174 C 88 177, 112 177, 126 174 C 140 170, 142 144, 134 122 Z"
                    fill="#1E293B"
                  />
                  {/* Kangaroo pocket */}
                  <path
                    d="M 82 152 Q 100 156 118 152 L 122 168 Q 100 172 78 168 Z"
                    fill="#0F172A"
                  />
                  {/* Hood strings */}
                  <path d="M 94 128 L 93 146" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="93" cy="147" r="2" fill="#E2E8F0" />
                  <path d="M 106 128 L 107 146" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="107" cy="147" r="2" fill="#E2E8F0" />
                  {/* Hood collar fold */}
                  <path d="M 80 124 Q 100 136 120 124" fill="none" stroke="#334155" strokeWidth="4" />
                </g>
              )}

              {equipped.body === 'body_rompi' && (
                <g>
                  {/* High-Vis Auditor Vest */}
                  <path
                    d="M 66 124 C 60 145, 62 170, 74 173 C 86 176, 114 176, 126 173 C 138 170, 140 145, 134 124 Z"
                    fill="#EA580C"
                  />
                  {/* Reflective silver stripes */}
                  <path d="M 70 144 Q 100 148 130 144" stroke="#F1F5F9" strokeWidth="4" fill="none" />
                  <path d="M 72 158 Q 100 162 128 158" stroke="#F1F5F9" strokeWidth="4" fill="none" />
                  {/* Center zipper */}
                  <path d="M 100 126 L 100 174" stroke="#7C2D12" strokeWidth="2" />
                  {/* Inspector badge */}
                  <rect x="76" y="132" width="12" height="8" rx="2" fill="#FFFFFF" />
                  <rect x="78" y="134" width="8" height="2" fill="#2563EB" />
                </g>
              )}

              {equipped.body === 'body_jas_formal' && (
                <g>
                  {/* Executive Suit & Tie */}
                  <path
                    d="M 66 122 C 58 144, 60 170, 74 174 C 88 177, 112 177, 126 174 C 140 170, 142 144, 134 122 Z"
                    fill="#0F172A"
                  />
                  {/* White shirt triangle */}
                  <polygon points="90,123 110,123 100,146" fill="#FFFFFF" />
                  {/* Red Executive Tie */}
                  <polygon points="98,126 102,126 104,152 100,162 96,152" fill="#DC2626" />
                  <polygon points="97,124 103,124 102,128 98,128" fill="#B91C1C" />
                  {/* Suit lapels */}
                  <path d="M 82 123 L 95 146 L 86 166" fill="none" stroke="#334155" strokeWidth="2.5" />
                  <path d="M 118 123 L 105 146 L 114 166" fill="none" stroke="#334155" strokeWidth="2.5" />
                </g>
              )}

              {equipped.body === 'body_jubah_advokat' && (
                <g>
                  {/* Legal Robes / Toga Advokat */}
                  <path
                    d="M 64 122 C 54 144, 56 172, 72 176 C 88 180, 112 180, 128 176 C 144 172, 146 144, 136 122 Z"
                    fill="#0F172A"
                  />
                  {/* Crimson center sash fold */}
                  <path d="M 94 124 L 94 178 L 106 178 L 106 124 Z" fill="#991B1B" />
                  {/* White pleated legal bib / cravat */}
                  <path d="M 92 123 L 108 123 L 105 142 L 95 142 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="100" y1="123" x2="100" y2="142" stroke="#CBD5E1" strokeWidth="1" />
                  {/* Gold border */}
                  <path d="M 68 174 Q 100 180 132 174" stroke="url(#goldGrad)" strokeWidth="3" fill="none" />
                </g>
              )}

              {equipped.body === 'body_tuxedo_menteri' && (
                <g>
                  {/* Tuxedo with Ministerial Sash */}
                  <path
                    d="M 64 122 C 54 144, 56 172, 72 176 C 88 180, 112 180, 128 176 C 144 172, 146 144, 136 122 Z"
                    fill="#18181B"
                  />
                  {/* White Tux Shirt */}
                  <polygon points="92,123 108,123 104,152 96,152" fill="#FFFFFF" />
                  {/* Black Bowtie */}
                  <polygon points="94,127 100,131 94,135" fill="#09090B" />
                  <polygon points="106,127 100,131 106,135" fill="#09090B" />
                  <circle cx="100" cy="131" r="2" fill="#27272A" />
                  {/* Gold & Violet Ministerial Sash across torso */}
                  <path
                    d="M 72 130 L 128 172 L 122 177 L 68 135 Z"
                    fill="#7C3AED"
                  />
                  <line x1="72" y1="130" x2="128" y2="172" stroke="url(#goldGrad)" strokeWidth="2" />
                  <line x1="68" y1="135" x2="122" y2="177" stroke="url(#goldGrad)" strokeWidth="2" />
                  {/* Medal pin */}
                  <circle cx="86" cy="142" r="4" fill="url(#goldGrad)" />
                </g>
              )}

              {equipped.body === 'body_jubah_beludru' && (
                <g>
                  {/* Imperial Velvet Robe */}
                  <path
                    d="M 62 120 C 50 144, 52 175, 72 178 C 88 182, 112 182, 128 178 C 148 175, 150 144, 138 120 Z"
                    fill="url(#rubyGrad)"
                  />
                  {/* Ermine white fur lapels */}
                  <path
                    d="M 70 122 C 80 145, 82 165, 80 176 L 88 176 C 90 160, 88 140, 78 122 Z"
                    fill="#FFFFFF"
                  />
                  <path
                    d="M 130 122 C 120 145, 118 165, 120 176 L 112 176 C 110 160, 112 140, 122 122 Z"
                    fill="#FFFFFF"
                  />
                  {/* Gold chain clasps */}
                  <path d="M 80 134 Q 100 142 120 134" stroke="url(#goldGrad)" strokeWidth="3" fill="none" />
                  <circle cx="80" cy="134" r="3.5" fill="url(#goldGrad)" />
                  <circle cx="120" cy="134" r="3.5" fill="url(#goldGrad)" />
                  {/* Gold bottom fringe */}
                  <path d="M 72 178 Q 100 184 128 178" stroke="url(#goldGrad)" strokeWidth="4" fill="none" />
                </g>
              )}
            </g>
          )}

          {/* 4. CAT HEAD & EARS */}
          <g id="cat-head-group">
            {/* LEFT EAR */}
            <g className="cat-left-ear">
              {breed === 'persia' ? (
                // Persia: Rounded fluffy ears
                <g>
                  <path
                    d="M 52 70 C 46 45, 62 38, 76 52 C 78 62, 70 74, 52 70 Z"
                    fill={furColor}
                  />
                  <path
                    d="M 56 64 C 54 48, 64 44, 72 54 C 70 60, 66 66, 56 64 Z"
                    fill={earColor}
                  />
                  {/* Fluff tufts */}
                  <circle cx="68" cy="54" r="5" fill="#FFFFFF" opacity="0.7" />
                </g>
              ) : (
                // Domestik / Siam: Triangular perky ears
                <g>
                  <polygon
                    points="50,72 58,32 82,56"
                    fill={breed === 'siam' ? '#78350F' : furColor}
                  />
                  <polygon
                    points="55,67 61,38 78,54"
                    fill={earColor}
                  />
                </g>
              )}
            </g>

            {/* RIGHT EAR */}
            <g>
              {breed === 'persia' ? (
                // Persia: Rounded fluffy ear
                <g>
                  <path
                    d="M 148 70 C 154 45, 138 38, 124 52 C 122 62, 130 74, 148 70 Z"
                    fill={furColor}
                  />
                  <path
                    d="M 144 64 C 146 48, 136 44, 128 54 C 130 60, 134 66, 144 64 Z"
                    fill={earColor}
                  />
                  <circle cx="132" cy="54" r="5" fill="#FFFFFF" opacity="0.7" />
                </g>
              ) : (
                // Domestik / Siam: Triangular perky ear
                <g>
                  <polygon
                    points="150,72 142,32 118,56"
                    fill={breed === 'siam' ? '#78350F' : furColor}
                  />
                  <polygon
                    points="145,67 139,38 122,54"
                    fill={earColor}
                  />
                </g>
              )}
            </g>

            {/* HEAD BASE */}
            {breed === 'persia' ? (
              // Persia: Extra chubby fluffy cheeks
              <path
                d="M 56 82 C 44 88, 42 108, 54 118 C 50 124, 62 132, 74 130 C 88 134, 112 134, 126 130 C 138 132, 150 124, 146 118 C 158 108, 156 88, 144 82 C 140 60, 60 60, 56 82 Z"
                fill={furColor}
              />
            ) : (
              // Domestik & Siam: Cute rounded head contour
              <path
                d="M 58 84 C 48 92, 48 112, 62 122 C 74 130, 126 130, 138 122 C 152 112, 152 92, 142 84 C 138 60, 62 60, 58 84 Z"
                fill={furColor}
              />
            )}

            {/* Breed Head Markings */}
            {breed === 'domestik' && (
              // Classic Tabby M Forehead Stripes
              <g fill={furAccent}>
                <polygon points="98,62 102,62 101,72 99,72" />
                <polygon points="92,64 95,64 92,74 89,74" />
                <polygon points="108,64 105,64 108,74 111,74" />
                {/* Horizontal brow curves */}
                <path d="M 86 76 Q 100 78 114 76" stroke={furAccent} strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
            )}

            {breed === 'siam' && (
              // Siamese Dark Face Mask
              <path
                d="M 76 86 C 72 98, 70 114, 84 122 C 94 126, 106 126, 116 122 C 130 114, 128 98, 124 86 C 114 82, 86 82, 76 86 Z"
                fill={muzzleMaskColor}
                opacity="0.85"
              />
            )}

            {/* MUZZLE & CHIN (Moncong) */}
            <path
              d="M 84 104 C 80 116, 92 125, 100 122 C 108 125, 120 116, 116 104 C 110 98, 90 98, 84 104 Z"
              fill={muzzleMaskColor}
            />

            {/* NOSE */}
            <polygon
              points="96,106 104,106 100,111"
              fill={gender === 'female' ? '#F43F5E' : '#FB7185'}
            />

            {/* MOUTH (:3 curve) */}
            <path
              d="M 94 113 Q 97 116 100 113 Q 103 116 106 113"
              fill="none"
              stroke="#475569"
              strokeWidth="1.6"
              strokeLinecap="round"
            />

            {/* CHEEK BLUSH */}
            <circle cx="68" cy="110" r="7" fill="#FDA4AF" opacity={gender === 'female' ? 0.7 : 0.4} />
            <circle cx="132" cy="110" r="7" fill="#FDA4AF" opacity={gender === 'female' ? 0.7 : 0.4} />

            {/* WHISKERS */}
            <g stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round">
              {/* Left */}
              <line x1="78" y1="110" x2="52" y2="106" />
              <line x1="78" y1="114" x2="50" y2="116" />
              <line x1="78" y1="118" x2="54" y2="124" />
              {/* Right */}
              <line x1="122" y1="110" x2="148" y2="106" />
              <line x1="122" y1="114" x2="150" y2="116" />
              <line x1="122" y1="118" x2="146" y2="124" />
            </g>

            {/* 5. EYES GROUP (with blinking animation) */}
            <g className="cat-eyes-group">
              {/* LEFT EYE */}
              <g>
                <ellipse cx="80" cy="94" rx="10" ry="12" fill="#0F172A" />
                <ellipse cx="80" cy="94" rx="8.5" ry="10" fill="url(#eyeGrad)" />
                {/* Slit/Pupil */}
                <ellipse cx="80" cy="94" rx="3.5" ry="8" fill="#022C22" />
                {/* Highlights / Shines */}
                <circle cx="77" cy="90" r="3" fill="#FFFFFF" />
                <circle cx="83" cy="97" r="1.5" fill="#FFFFFF" opacity="0.8" />
                {/* Female eyelashes */}
                {gender === 'female' && (
                  <g stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round">
                    <line x1="72" y1="88" x2="67" y2="84" />
                    <line x1="75" y1="85" x2="72" y2="80" />
                  </g>
                )}
              </g>

              {/* RIGHT EYE */}
              <g>
                <ellipse cx="120" cy="94" rx="10" ry="12" fill="#0F172A" />
                <ellipse cx="120" cy="94" rx="8.5" ry="10" fill="url(#eyeGrad)" />
                {/* Slit/Pupil */}
                <ellipse cx="120" cy="94" rx="3.5" ry="8" fill="#022C22" />
                {/* Highlights */}
                <circle cx="117" cy="90" r="3" fill="#FFFFFF" />
                <circle cx="123" cy="97" r="1.5" fill="#FFFFFF" opacity="0.8" />
                {/* Female eyelashes */}
                {gender === 'female' && (
                  <g stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round">
                    <line x1="128" y1="88" x2="133" y2="84" />
                    <line x1="125" y1="85" x2="128" y2="80" />
                  </g>
                )}
              </g>
            </g>
          </g>

          {/* 6. EYEWEAR COSTUME LAYER */}
          {equipped.eyes && (
            <g id="costume-eyes">
              {equipped.eyes === 'eyes_baca' && (
                <g>
                  {/* Round Reading Glasses */}
                  <circle cx="80" cy="94" r="14" fill="rgba(255,255,255,0.2)" stroke="#475569" strokeWidth="2.5" />
                  <circle cx="120" cy="94" r="14" fill="rgba(255,255,255,0.2)" stroke="#475569" strokeWidth="2.5" />
                  {/* Bridge */}
                  <path d="M 94 92 Q 100 88 106 92" stroke="#475569" strokeWidth="2.5" fill="none" />
                  {/* Glass reflections */}
                  <line x1="74" y1="88" x2="84" y2="98" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
                  <line x1="114" y1="88" x2="124" y2="98" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
                </g>
              )}

              {equipped.eyes === 'eyes_kotak' && (
                <g>
                  {/* Modern Rectangular Glasses */}
                  <rect x="66" y="84" width="28" height="20" rx="4" fill="rgba(30,41,59,0.3)" stroke="#0F172A" strokeWidth="3" />
                  <rect x="106" y="84" width="28" height="20" rx="4" fill="rgba(30,41,59,0.3)" stroke="#0F172A" strokeWidth="3" />
                  {/* Bridge */}
                  <line x1="94" y1="92" x2="106" y2="92" stroke="#0F172A" strokeWidth="3" />
                  {/* Blue-light coating glint */}
                  <line x1="70" y1="88" x2="88" y2="100" stroke="#38BDF8" strokeWidth="1.5" opacity="0.8" />
                  <line x1="110" y1="88" x2="128" y2="100" stroke="#38BDF8" strokeWidth="1.5" opacity="0.8" />
                </g>
              )}

              {equipped.eyes === 'eyes_lensa_detektif' && (
                <g>
                  {/* Detective Magnifying Monocle on right eye */}
                  <circle cx="120" cy="94" r="16" fill="rgba(254, 240, 138, 0.25)" stroke="#D97706" strokeWidth="3" />
                  <line x1="134" y1="104" x2="148" y2="120" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
                  {/* Chain */}
                  <path d="M 120 110 Q 130 130 110 145" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,2" fill="none" />
                </g>
              )}

              {equipped.eyes === 'eyes_frame_emas' && (
                <g>
                  {/* Titanium Gold Frameless Glasses */}
                  <ellipse cx="80" cy="94" rx="14" ry="11" fill="rgba(254,249,195,0.2)" stroke="url(#goldGrad)" strokeWidth="2.5" />
                  <ellipse cx="120" cy="94" rx="14" ry="11" fill="rgba(254,249,195,0.2)" stroke="url(#goldGrad)" strokeWidth="2.5" />
                  <path d="M 94 92 Q 100 89 106 92" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" />
                </g>
              )}

              {equipped.eyes === 'eyes_monokel' && (
                <g>
                  {/* Regal Judicial Monocle */}
                  <circle cx="80" cy="94" r="15" fill="rgba(254,240,138,0.2)" stroke="url(#goldGrad)" strokeWidth="3" />
                  {/* Monocle chain dropping to vest */}
                  <path d="M 80 109 Q 70 128 85 142" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="2,2" fill="none" />
                </g>
              )}

              {equipped.eyes === 'eyes_aviator_diplomat' && (
                <g>
                  {/* Dark Teardrop Aviator Sunglasses */}
                  <path d="M 66 84 C 66 84, 94 84, 94 92 C 94 104, 84 108, 72 106 C 66 104, 64 96, 66 84 Z" fill="#18181B" stroke="#71717A" strokeWidth="2" />
                  <path d="M 134 84 C 134 84, 106 84, 106 92 C 106 104, 116 108, 128 106 C 134 104, 136 96, 134 84 Z" fill="#18181B" stroke="#71717A" strokeWidth="2" />
                  {/* Top Bar */}
                  <line x1="68" y1="84" x2="132" y2="84" stroke="#A1A1AA" strokeWidth="2" />
                  <line x1="94" y1="88" x2="106" y2="88" stroke="#A1A1AA" strokeWidth="2" />
                  {/* Gradient sheen */}
                  <line x1="72" y1="88" x2="88" y2="102" stroke="#FFFFFF" strokeWidth="2" opacity="0.4" />
                  <line x1="112" y1="88" x2="128" y2="102" stroke="#FFFFFF" strokeWidth="2" opacity="0.4" />
                </g>
              )}

              {equipped.eyes === 'eyes_sorot_bijak' && (
                <g>
                  {/* Golden Glowing Wisdom Specs + Stars */}
                  <ellipse cx="80" cy="94" rx="14" ry="11" fill="rgba(253,224,71,0.3)" stroke="url(#goldGrad)" strokeWidth="3" />
                  <ellipse cx="120" cy="94" rx="14" ry="11" fill="rgba(253,224,71,0.3)" stroke="url(#goldGrad)" strokeWidth="3" />
                  <path d="M 94 92 Q 100 89 106 92" stroke="url(#goldGrad)" strokeWidth="3" fill="none" />
                  {/* Sparkle Stars */}
                  <polygon points="62,82 64,86 68,88 64,90 62,94 60,90 56,88 60,86" fill="url(#goldGrad)" />
                  <polygon points="138,82 140,86 144,88 140,90 138,94 136,90 132,88 136,86" fill="url(#goldGrad)" />
                  <polygon points="100,78 101,80 103,81 101,82 100,84 99,82 97,81 99,80" fill="#FFFFFF" />
                </g>
              )}
            </g>
          )}

          {/* 7. HEADWEAR COSTUME LAYER */}
          {equipped.head && (
            <g id="costume-head">
              {equipped.head === 'head_relawan' && (
                <g>
                  {/* Orange Volunteer Baseball Cap */}
                  <path
                    d="M 64 68 C 64 48, 136 48, 136 68 C 136 72, 64 72, 64 68 Z"
                    fill="#FF6B4A"
                  />
                  {/* Curved Visor / Brim */}
                  <path
                    d="M 58 68 C 58 64, 142 64, 148 74 C 132 77, 68 76, 58 68 Z"
                    fill="#EA580C"
                  />
                  {/* Mini volunteer star emblem */}
                  <circle cx="100" cy="56" r="5" fill="#FFFFFF" />
                  <polygon points="100,53 101,55 104,55 102,57 103,59 100,58 97,59 98,57 96,55 99,55" fill="#FF6B4A" />
                </g>
              )}

              {equipped.head === 'head_beanie' && (
                <g>
                  {/* Knit Beanie */}
                  <path
                    d="M 64 66 C 64 36, 136 36, 136 66 Z"
                    fill="#475569"
                  />
                  {/* Folded brim */}
                  <rect x="60" y="60" width="80" height="12" rx="4" fill="#334155" />
                  {/* Pom pom */}
                  <circle cx="100" cy="34" r="8" fill="#64748B" />
                  {/* Knit stripes */}
                  <line x1="72" y1="60" x2="72" y2="72" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="86" y1="60" x2="86" y2="72" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="100" y1="60" x2="100" y2="72" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="114" y1="60" x2="114" y2="72" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="128" y1="60" x2="128" y2="72" stroke="#64748B" strokeWidth="1.5" />
                </g>
              )}

              {equipped.head === 'head_baret' && (
                <g>
                  {/* Inspector / Auditor Beret (Tilted) */}
                  <path
                    d="M 52 64 C 48 40, 138 32, 144 58 C 146 68, 60 74, 52 64 Z"
                    fill="#B45309"
                  />
                  <ellipse cx="98" cy="66" rx="42" ry="7" fill="#78350F" />
                  {/* Gold Auditor Pin */}
                  <circle cx="76" cy="56" r="5" fill="url(#goldGrad)" />
                  <path d="M 76 53 L 78 59 L 73 55 L 79 55 L 74 59 Z" fill="#78350F" />
                </g>
              )}

              {equipped.head === 'head_fedora' && (
                <g>
                  {/* Elegant Charcoal Fedora */}
                  <path
                    d="M 68 56 C 68 38, 76 34, 100 34 C 124 34, 132 38, 132 56 Z"
                    fill="#334155"
                  />
                  {/* Crown indentation */}
                  <ellipse cx="100" cy="38" rx="14" ry="4" fill="#1E293B" />
                  {/* Gold ribbon band */}
                  <rect x="68" y="52" width="64" height="6" fill="url(#goldGrad)" />
                  {/* Wide brim */}
                  <path
                    d="M 48 58 C 48 54, 152 54, 152 64 C 130 68, 70 68, 48 58 Z"
                    fill="#1E293B"
                  />
                </g>
              )}

              {equipped.head === 'head_toga_advokat' && (
                <g>
                  {/* Judicial Mortarboard / Toga Cap */}
                  <polygon points="100,28 152,44 100,56 48,44" fill="#0F172A" />
                  <rect x="76" y="48" width="48" height="14" fill="#1E293B" />
                  {/* Golden tassel */}
                  <circle cx="100" cy="42" r="3" fill="url(#goldGrad)" />
                  <path d="M 100 42 C 120 44, 135 52, 138 68" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" />
                  <ellipse cx="138" cy="70" rx="3" ry="5" fill="url(#goldGrad)" />
                </g>
              )}

              {equipped.head === 'head_peci_karismatik' && (
                <g>
                  {/* Indonesian Black Velvet Peci */}
                  <path
                    d="M 66 66 L 70 38 L 130 38 L 134 66 Z"
                    fill="#09090B"
                  />
                  {/* Peci curve top */}
                  <ellipse cx="100" cy="38" rx="30" ry="5" fill="#18181B" />
                  {/* Bottom curve fitting head */}
                  <path d="M 66 66 Q 100 74 134 66" fill="none" stroke="#27272A" strokeWidth="2" />
                  {/* Subtle golden thread trim at bottom */}
                  <path d="M 68 64 Q 100 72 132 64" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" />
                </g>
              )}

              {equipped.head === 'head_mahkota_raja' && (
                <g>
                  {/* Royal Imperial Crown */}
                  <path
                    d="M 64 64 L 62 40 L 78 50 L 100 32 L 122 50 L 138 40 L 136 64 Z"
                    fill="url(#goldGrad)"
                  />
                  <ellipse cx="100" cy="64" rx="36" ry="6" fill="#CA8A04" />
                  {/* Jewel insets */}
                  <circle cx="100" cy="46" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
                  <circle cx="78" cy="54" r="3.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="0.8" />
                  <circle cx="122" cy="54" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.8" />
                  <circle cx="100" cy="32" r="3" fill="#FFFFFF" />
                  <circle cx="62" cy="40" r="2.5" fill="#FFFFFF" />
                  <circle cx="138" cy="40" r="2.5" fill="#FFFFFF" />
                </g>
              )}

              {equipped.head === 'head_bando_kucing' && (
                <g>
                  {/* Pink Ribbon Hair Bow */}
                  <circle cx="100" cy="52" r="5" fill="#EC4899" />
                  <polygon points="100,52 82,42 84,62" fill="#F472B6" />
                  <polygon points="100,52 118,42 116,62" fill="#F472B6" />
                  <circle cx="100" cy="52" r="3" fill="#FDF2F8" />
                </g>
              )}
            </g>
          )}

          {/* 8. ACCESSORY COSTUME LAYER (Handheld / Side ornaments) */}
          {equipped.accessory && (
            <g id="costume-accessory">
              {equipped.accessory === 'acc_totebag' && (
                <g>
                  {/* Canvas Tote Bag hanging on left */}
                  <rect x="42" y="142" width="22" height="26" rx="3" fill="#D97706" />
                  <path d="M 48 142 L 48 132 C 48 126, 58 126, 58 132 L 58 142" stroke="#B45309" strokeWidth="2" fill="none" />
                  {/* Leaf / PolicySnap print */}
                  <circle cx="53" cy="155" r="5" fill="#FEF3C7" />
                  <path d="M 53 152 Q 56 155 53 158 Q 50 155 53 152" fill="#D97706" />
                </g>
              )}

              {equipped.accessory === 'acc_smartphone' && (
                <g>
                  {/* Glowing Smartphone in right paw */}
                  <rect x="136" y="138" width="18" height="30" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
                  {/* Screen glowing */}
                  <rect x="138" y="141" width="14" height="22" rx="1" fill="#0284C7" />
                  {/* Screen chat bars */}
                  <line x1="141" y1="145" x2="149" y2="145" stroke="#FFFFFF" strokeWidth="1.5" />
                  <line x1="141" y1="149" x2="147" y2="149" stroke="#BAE6FD" strokeWidth="1.5" />
                  {/* Notification red dot */}
                  <circle cx="152" cy="138" r="3" fill="#EF4444" />
                </g>
              )}

              {equipped.accessory === 'acc_clipboard' && (
                <g>
                  {/* Audit Clipboard in right paw */}
                  <rect x="134" y="134" width="22" height="32" rx="2" fill="#78350F" />
                  <rect x="137" y="139" width="16" height="24" rx="1" fill="#FEF3C7" />
                  {/* Metal clip on top */}
                  <rect x="141" y="132" width="8" height="5" rx="1" fill="#CBD5E1" />
                  {/* Checklist lines & checkmark */}
                  <path d="M 139 144 L 141 146 L 145 142" stroke="#059669" strokeWidth="1.5" fill="none" />
                  <line x1="147" y1="144" x2="151" y2="144" stroke="#475569" strokeWidth="1" />
                  <path d="M 139 150 L 141 152 L 145 148" stroke="#059669" strokeWidth="1.5" fill="none" />
                  <line x1="147" y1="150" x2="151" y2="150" stroke="#475569" strokeWidth="1" />
                  <line x1="139" y1="156" x2="151" y2="156" stroke="#94A3B8" strokeWidth="1" />
                </g>
              )}

              {equipped.accessory === 'acc_koper' && (
                <g>
                  {/* Executive Briefcase on left */}
                  <rect x="36" y="146" width="28" height="22" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
                  {/* Handle */}
                  <path d="M 45 146 L 45 140 L 55 140 L 55 146" stroke="#CA8A04" strokeWidth="2.5" fill="none" />
                  {/* Brass Latches */}
                  <rect x="42" y="152" width="4" height="4" fill="url(#goldGrad)" />
                  <rect x="54" y="152" width="4" height="4" fill="url(#goldGrad)" />
                  <line x1="36" y1="154" x2="64" y2="154" stroke="#451A03" strokeWidth="1" />
                </g>
              )}

              {equipped.accessory === 'acc_palu_sidang' && (
                <g>
                  {/* Justice Gavel held in right paw */}
                  {/* Handle */}
                  <line x1="142" y1="136" x2="164" y2="164" stroke="#9A3412" strokeWidth="4" strokeLinecap="round" />
                  {/* Head */}
                  <rect x="134" y="128" width="18" height="12" rx="2" fill="#7C2D12" transform="rotate(-35 143 134)" />
                  {/* Gold rings on gavel head */}
                  <line x1="135" y1="132" x2="149" y2="124" stroke="url(#goldGrad)" strokeWidth="1.5" />
                </g>
              )}

              {equipped.accessory === 'acc_berkas_rahasia' && (
                <g>
                  {/* Top Secret State Dossier */}
                  <rect x="136" y="136" width="24" height="30" rx="2" fill="#DC2626" />
                  <rect x="140" y="142" width="16" height="12" rx="1" fill="#FEE2E2" />
                  {/* Stamp "TOP SECRET" */}
                  <line x1="142" y1="146" x2="154" y2="146" stroke="#991B1B" strokeWidth="2" />
                  <line x1="142" y1="150" x2="150" y2="150" stroke="#991B1B" strokeWidth="1.5" />
                  {/* Gold seal */}
                  <circle cx="148" cy="160" r="3.5" fill="url(#goldGrad)" />
                </g>
              )}

              {equipped.accessory === 'acc_tongkat_scepter' && (
                <g>
                  {/* Golden Imperial Scepter */}
                  {/* Golden Shaft */}
                  <line x1="150" y1="92" x2="150" y2="176" stroke="url(#goldGrad)" strokeWidth="4.5" strokeLinecap="round" />
                  {/* Top Globe & Crown */}
                  <circle cx="150" cy="88" r="8" fill="url(#goldGrad)" stroke="#CA8A04" strokeWidth="1" />
                  <circle cx="150" cy="88" r="4" fill="#3B82F6" />
                  <polygon points="150,76 153,80 147,80" fill="url(#goldGrad)" />
                  {/* Ring ribbons */}
                  <path d="M 150 96 C 158 98, 162 108, 158 116" stroke="#EF4444" strokeWidth="2" fill="none" />
                </g>
              )}

              {equipped.accessory === 'acc_megafon' && (
                <g>
                  {/* Red & White Megaphone */}
                  <polygon points="136,146 158,136 158,162 136,152" fill="#EF4444" />
                  <rect x="156" y="134" width="6" height="30" rx="2" fill="#F8FAFC" />
                  <rect x="132" y="147" width="5" height="5" rx="1" fill="#1E293B" />
                  {/* Handle */}
                  <line x1="142" y1="152" x2="144" y2="164" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
                </g>
              )}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
