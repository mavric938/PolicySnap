/**
 * Layer 6: kostum kacamata/lensa.
 * `uid` = prefix ID gradient milik instance CatAvatar (lihat CatDefs).
 */
export default function EyewearCostume({ itemId, uid }: { itemId: string | null | undefined; uid: string }) {
  return (
    <g id="costume-eyes">
      {itemId === 'eyes_baca' && (
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

      {itemId === 'eyes_kotak' && (
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

      {itemId === 'eyes_lensa_detektif' && (
        <g>
          {/* Detective Magnifying Monocle on right eye */}
          <circle cx="120" cy="94" r="16" fill="rgba(254, 240, 138, 0.25)" stroke="#D97706" strokeWidth="3" />
          <line x1="134" y1="104" x2="148" y2="120" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
          {/* Chain */}
          <path d="M 120 110 Q 130 130 110 145" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,2" fill="none" />
        </g>
      )}

      {itemId === 'eyes_frame_emas' && (
        <g>
          {/* Titanium Gold Frameless Glasses */}
          <ellipse cx="80" cy="94" rx="14" ry="11" fill="rgba(254,249,195,0.2)" stroke={`url(#${uid}-goldGrad)`} strokeWidth="2.5" />
          <ellipse cx="120" cy="94" rx="14" ry="11" fill="rgba(254,249,195,0.2)" stroke={`url(#${uid}-goldGrad)`} strokeWidth="2.5" />
          <path d="M 94 92 Q 100 89 106 92" stroke={`url(#${uid}-goldGrad)`} strokeWidth="2.5" fill="none" />
        </g>
      )}

      {itemId === 'eyes_monokel' && (
        <g>
          {/* Regal Judicial Monocle */}
          <circle cx="80" cy="94" r="15" fill="rgba(254,240,138,0.2)" stroke={`url(#${uid}-goldGrad)`} strokeWidth="3" />
          {/* Monocle chain dropping to vest */}
          <path d="M 80 109 Q 70 128 85 142" stroke={`url(#${uid}-goldGrad)`} strokeWidth="1.5" strokeDasharray="2,2" fill="none" />
        </g>
      )}

      {itemId === 'eyes_aviator_diplomat' && (
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

      {itemId === 'eyes_sorot_bijak' && (
        <g>
          {/* Golden Glowing Wisdom Specs + Stars */}
          <ellipse cx="80" cy="94" rx="14" ry="11" fill="rgba(253,224,71,0.3)" stroke={`url(#${uid}-goldGrad)`} strokeWidth="3" />
          <ellipse cx="120" cy="94" rx="14" ry="11" fill="rgba(253,224,71,0.3)" stroke={`url(#${uid}-goldGrad)`} strokeWidth="3" />
          <path d="M 94 92 Q 100 89 106 92" stroke={`url(#${uid}-goldGrad)`} strokeWidth="3" fill="none" />
          {/* Sparkle Stars */}
          <polygon points="62,82 64,86 68,88 64,90 62,94 60,90 56,88 60,86" fill={`url(#${uid}-goldGrad)`} />
          <polygon points="138,82 140,86 144,88 140,90 138,94 136,90 132,88 136,86" fill={`url(#${uid}-goldGrad)`} />
          <polygon points="100,78 101,80 103,81 101,82 100,84 99,82 97,81 99,80" fill="#FFFFFF" />
        </g>
      )}
    </g>
  );
}
