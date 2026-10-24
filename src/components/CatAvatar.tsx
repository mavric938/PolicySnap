'use client';

import React, { useId } from 'react';
import { CatProfile } from '@/types';
import CatDefs from './cat/CatDefs';
import BodyCostume from './cat/BodyCostume';
import EyewearCostume from './cat/EyewearCostume';
import HeadwearCostume from './cat/HeadwearCostume';
import AccessoryCostume from './cat/AccessoryCostume';

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

  const hasAdminSpecial =
    equipped.accessory === 'acc_admin_star' ||
    equipped.special === 'special_admin_star' ||
    profile.specialItem === 'special_admin_star';

  // Determine darker fur accent for tabby stripes / details
  const isDarkFur = furColor === '#1E293B' || furColor === '#0F172A';
  const furAccent = isDarkFur ? '#334155' : 'rgba(0, 0, 0, 0.15)';
  const muzzleMaskColor = breed === 'siam' ? '#78350F' : bellyColor;

  // ID gradient/filter unik per instance: tanpa ini, url(#eyeGrad) di halaman dengan banyak
  // avatar selalu merujuk ke <defs> milik avatar pertama (warna mata ikut kucing pertama).
  const uid = `cat${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div
      className={`cat-avatar-container${animate ? ' is-animated' : ''} ${className}`}
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
        <CatDefs uid={uid} eyeColor={eyeColor} />


        {/* 0. Optional Backdrop Disc */}
        {showBackground && (
          <g>
            <circle cx="100" cy="100" r="92" fill={`url(#${uid}-catBgGrad)`} />
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
          {equipped.body && <BodyCostume itemId={equipped.body} uid={uid} />}

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
                <ellipse cx="80" cy="94" rx="8.5" ry="10" fill={`url(#${uid}-eyeGrad)`} />
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
                <ellipse cx="120" cy="94" rx="8.5" ry="10" fill={`url(#${uid}-eyeGrad)`} />
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
          {equipped.eyes && <EyewearCostume itemId={equipped.eyes} uid={uid} />}

          {/* 7. HEADWEAR COSTUME LAYER */}
          {equipped.head && <HeadwearCostume itemId={equipped.head} uid={uid} />}

          {/* 8. ACCESSORY COSTUME LAYER (Handheld / Side ornaments) */}
          {(equipped.accessory || hasAdminSpecial) && (
            <AccessoryCostume itemId={equipped.accessory} uid={uid} hasAdminSpecial={hasAdminSpecial} />
          )}
        </g>
      </svg>
    </div>
  );
}
