/**
 * Layer 8: aksesoris genggam/samping + item spesial admin.
 * `uid` = prefix ID gradient milik instance CatAvatar (lihat CatDefs).
 */
export default function AccessoryCostume({ itemId, uid, hasAdminSpecial }: { itemId: string | null | undefined; uid: string; hasAdminSpecial: boolean }) {
  return (
    <g id="costume-accessory">
      {/* ADMIN SPECIAL ITEM: Bintang Kebijakan Berkilau & Bersinar */}
      {hasAdminSpecial && (
        <g id="costume-admin-special" className="admin-star-group">
          {/* 1. Royal Crimson & Gold Sash Ribbon pinned to cat chest */}
          <g id="admin-sash-ribbon">
            <path
              d="M 124 136 C 128 130, 142 130, 146 136 L 143 158 L 135 150 L 127 158 Z"
              fill={`url(#${uid}-adminSashGrad)`}
              stroke="#CA8A04"
              strokeWidth="1.2"
            />
            <path d="M 127 136 L 129 154" stroke={`url(#${uid}-adminStarGrad)`} strokeWidth="0.8" />
            <path d="M 143 136 L 141 154" stroke={`url(#${uid}-adminStarGrad)`} strokeWidth="0.8" />
          </g>

          {/* 2. Rotating Light Beams / Sunburst (Radiant Light Rays) */}
          <g style={{ transformOrigin: '136px 138px', animation: 'adminRaySpin 14s linear infinite' }}>
            <line x1="136" y1="110" x2="136" y2="166" stroke="#FDE047" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="4 8" />
            <line x1="108" y1="138" x2="164" y2="138" stroke="#FDE047" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="4 8" />
            <line x1="116" y1="118" x2="156" y2="158" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="3 7" />
            <line x1="116" y1="158" x2="156" y2="118" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="3 7" />
          </g>

          {/* 3. Pulsing Radiant Aura Glow */}
          <circle
            cx="136"
            cy="138"
            r="24"
            fill={`url(#${uid}-adminAuraGlow)`}
            style={{ transformOrigin: '136px 138px', animation: 'adminPulseGlow 3.2s ease-in-out infinite' }}
          />

          {/* 4. Eight-pointed Sovereign Star (Faceted 24K Gold) */}
          <polygon
            points="136,120 140,133 152,122 141,140 150,152 136,143 122,152 131,140 120,122 132,133"
            fill={`url(#${uid}-adminGoldGrad2)`}
            stroke="#CA8A04"
            strokeWidth="0.8"
          />
          <polygon
            points="136,112 141,133 162,138 141,143 136,164 131,143 110,138 131,133"
            fill={`url(#${uid}-adminStarGrad)`}
            stroke="#FFFFFF"
            strokeWidth="1.2"
            filter={`url(#${uid}-adminGlowFilter)`}
          />

          {/* 5. Center Brilliant Cyan-Sapphire Prismatic Gem */}
          <circle cx="136" cy="138" r="9" fill="#0F172A" stroke={`url(#${uid}-adminStarGrad)`} strokeWidth="1.5" />
          <polygon
            points="136,130 143,138 136,146 129,138"
            fill={`url(#${uid}-adminGemGrad)`}
            stroke="#BAE6FD"
            strokeWidth="1"
          />
          <polygon points="136,130 136,138 129,138" fill="#FFFFFF" opacity="0.4" />
          <circle cx="134" cy="135" r="2.2" fill="#FFFFFF" opacity="0.9" />
          <circle cx="138" cy="140" r="1" fill="#FFFFFF" opacity="0.7" />

          {/* 6. Dynamic Animated Sparkles & Stardust */}
          <path
            d="M 152 116 Q 155 120 159 120 Q 155 120 152 124 Q 149 120 145 120 Q 149 120 152 116 Z"
            fill="#FFFFFF"
            filter="drop-shadow(0 0 5px #FDE047)"
            style={{ transformOrigin: '152px 120px', animation: 'adminSparkle1 2.4s ease-in-out infinite' }}
          />
          <path
            d="M 166 138 Q 168 141 171 141 Q 168 141 166 144 Q 164 141 161 141 Q 164 141 166 138 Z"
            fill="#FDE047"
            filter="drop-shadow(0 0 4px #F59E0B)"
            style={{ transformOrigin: '166px 141px', animation: 'adminSparkle2 2.8s ease-in-out 0.6s infinite' }}
          />
          <path
            d="M 120 150 Q 122 153 125 153 Q 122 153 120 156 Q 118 153 115 153 Q 118 153 120 150 Z"
            fill="#38BDF8"
            filter="drop-shadow(0 0 5px #38BDF8)"
            style={{ transformOrigin: '120px 153px', animation: 'adminSparkle3 3.2s ease-in-out 1.2s infinite' }}
          />
          <circle
            cx="130"
            cy="114"
            r="1.8"
            fill="#FFFFFF"
            style={{ animation: 'adminSparkle1 1.9s ease-in-out 0.3s infinite' }}
          />
          <circle
            cx="160"
            cy="154"
            r="1.4"
            fill="#FDE047"
            style={{ animation: 'adminSparkle2 2.2s ease-in-out 1s infinite' }}
          />
        </g>
      )}

      {itemId === 'acc_totebag' && !hasAdminSpecial && (
        <g>
          {/* Canvas Tote Bag hanging on left */}
          <rect x="42" y="142" width="22" height="26" rx="3" fill="#D97706" />
          <path d="M 48 142 L 48 132 C 48 126, 58 126, 58 132 L 58 142" stroke="#B45309" strokeWidth="2" fill="none" />
          {/* Leaf / PolicySnap print */}
          <circle cx="53" cy="155" r="5" fill="#FEF3C7" />
          <path d="M 53 152 Q 56 155 53 158 Q 50 155 53 152" fill="#D97706" />
        </g>
      )}

      {itemId === 'acc_smartphone' && (
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

      {itemId === 'acc_clipboard' && (
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

      {itemId === 'acc_koper' && (
        <g>
          {/* Executive Briefcase on left */}
          <rect x="36" y="146" width="28" height="22" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
          {/* Handle */}
          <path d="M 45 146 L 45 140 L 55 140 L 55 146" stroke="#CA8A04" strokeWidth="2.5" fill="none" />
          {/* Brass Latches */}
          <rect x="42" y="152" width="4" height="4" fill={`url(#${uid}-goldGrad)`} />
          <rect x="54" y="152" width="4" height="4" fill={`url(#${uid}-goldGrad)`} />
          <line x1="36" y1="154" x2="64" y2="154" stroke="#451A03" strokeWidth="1" />
        </g>
      )}

      {itemId === 'acc_palu_sidang' && (
        <g>
          {/* Justice Gavel held in right paw */}
          {/* Handle */}
          <line x1="142" y1="136" x2="164" y2="164" stroke="#9A3412" strokeWidth="4" strokeLinecap="round" />
          {/* Head */}
          <rect x="134" y="128" width="18" height="12" rx="2" fill="#7C2D12" transform="rotate(-35 143 134)" />
          {/* Gold rings on gavel head */}
          <line x1="135" y1="132" x2="149" y2="124" stroke={`url(#${uid}-goldGrad)`} strokeWidth="1.5" />
        </g>
      )}

      {itemId === 'acc_berkas_rahasia' && (
        <g>
          {/* Top Secret State Dossier */}
          <rect x="136" y="136" width="24" height="30" rx="2" fill="#DC2626" />
          <rect x="140" y="142" width="16" height="12" rx="1" fill="#FEE2E2" />
          {/* Stamp "TOP SECRET" */}
          <line x1="142" y1="146" x2="154" y2="146" stroke="#991B1B" strokeWidth="2" />
          <line x1="142" y1="150" x2="150" y2="150" stroke="#991B1B" strokeWidth="1.5" />
          {/* Gold seal */}
          <circle cx="148" cy="160" r="3.5" fill={`url(#${uid}-goldGrad)`} />
        </g>
      )}

      {itemId === 'acc_tongkat_scepter' && (
        <g>
          {/* Golden Imperial Scepter */}
          {/* Golden Shaft */}
          <line x1="150" y1="92" x2="150" y2="176" stroke={`url(#${uid}-goldGrad)`} strokeWidth="4.5" strokeLinecap="round" />
          {/* Top Globe & Crown */}
          <circle cx="150" cy="88" r="8" fill={`url(#${uid}-goldGrad)`} stroke="#CA8A04" strokeWidth="1" />
          <circle cx="150" cy="88" r="4" fill="#3B82F6" />
          <polygon points="150,76 153,80 147,80" fill={`url(#${uid}-goldGrad)`} />
          {/* Ring ribbons */}
          <path d="M 150 96 C 158 98, 162 108, 158 116" stroke="#EF4444" strokeWidth="2" fill="none" />
        </g>
      )}

      {itemId === 'acc_megafon' && (
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
  );
}
