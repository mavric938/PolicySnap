/**
 * Layer 7: kostum topi/headwear.
 * `uid` = prefix ID gradient milik instance CatAvatar (lihat CatDefs).
 */
export default function HeadwearCostume({ itemId, uid }: { itemId: string | null | undefined; uid: string }) {
  return (
    <g id="costume-head">
      {itemId === 'head_relawan' && (
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

      {itemId === 'head_beanie' && (
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

      {itemId === 'head_baret' && (
        <g>
          {/* Inspector / Auditor Beret (Tilted) */}
          <path
            d="M 52 64 C 48 40, 138 32, 144 58 C 146 68, 60 74, 52 64 Z"
            fill="#B45309"
          />
          <ellipse cx="98" cy="66" rx="42" ry="7" fill="#78350F" />
          {/* Gold Auditor Pin */}
          <circle cx="76" cy="56" r="5" fill={`url(#${uid}-goldGrad)`} />
          <path d="M 76 53 L 78 59 L 73 55 L 79 55 L 74 59 Z" fill="#78350F" />
        </g>
      )}

      {itemId === 'head_fedora' && (
        <g>
          {/* Elegant Charcoal Fedora */}
          <path
            d="M 68 56 C 68 38, 76 34, 100 34 C 124 34, 132 38, 132 56 Z"
            fill="#334155"
          />
          {/* Crown indentation */}
          <ellipse cx="100" cy="38" rx="14" ry="4" fill="#1E293B" />
          {/* Gold ribbon band */}
          <rect x="68" y="52" width="64" height="6" fill={`url(#${uid}-goldGrad)`} />
          {/* Wide brim */}
          <path
            d="M 48 58 C 48 54, 152 54, 152 64 C 130 68, 70 68, 48 58 Z"
            fill="#1E293B"
          />
        </g>
      )}

      {itemId === 'head_toga_advokat' && (
        <g>
          {/* Judicial Mortarboard / Toga Cap */}
          <polygon points="100,28 152,44 100,56 48,44" fill="#0F172A" />
          <rect x="76" y="48" width="48" height="14" fill="#1E293B" />
          {/* Golden tassel */}
          <circle cx="100" cy="42" r="3" fill={`url(#${uid}-goldGrad)`} />
          <path d="M 100 42 C 120 44, 135 52, 138 68" stroke={`url(#${uid}-goldGrad)`} strokeWidth="2.5" fill="none" />
          <ellipse cx="138" cy="70" rx="3" ry="5" fill={`url(#${uid}-goldGrad)`} />
        </g>
      )}

      {itemId === 'head_peci_karismatik' && (
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
          <path d="M 68 64 Q 100 72 132 64" fill="none" stroke={`url(#${uid}-goldGrad)`} strokeWidth="1.5" />
        </g>
      )}

      {itemId === 'head_mahkota_raja' && (
        <g>
          {/* Royal Imperial Crown */}
          <path
            d="M 64 64 L 62 40 L 78 50 L 100 32 L 122 50 L 138 40 L 136 64 Z"
            fill={`url(#${uid}-goldGrad)`}
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

      {itemId === 'head_bando_kucing' && (
        <g>
          {/* Pink Ribbon Hair Bow */}
          <circle cx="100" cy="52" r="5" fill="#EC4899" />
          <polygon points="100,52 82,42 84,62" fill="#F472B6" />
          <polygon points="100,52 118,42 116,62" fill="#F472B6" />
          <circle cx="100" cy="52" r="3" fill="#FDF2F8" />
        </g>
      )}
    </g>
  );
}
