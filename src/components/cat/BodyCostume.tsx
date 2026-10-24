/**
 * Layer 3: kostum pakaian (di belakang kepala, di atas badan).
 * `uid` = prefix ID gradient milik instance CatAvatar (lihat CatDefs).
 */
export default function BodyCostume({ itemId, uid }: { itemId: string | null | undefined; uid: string }) {
  return (
    <g id="costume-body">
      {itemId === 'body_kaos' && (
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

      {itemId === 'body_hoodie' && (
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

      {itemId === 'body_rompi' && (
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

      {itemId === 'body_jas_formal' && (
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

      {itemId === 'body_jubah_advokat' && (
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
          <path d="M 68 174 Q 100 180 132 174" stroke={`url(#${uid}-goldGrad)`} strokeWidth="3" fill="none" />
        </g>
      )}

      {itemId === 'body_tuxedo_menteri' && (
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
          <line x1="72" y1="130" x2="128" y2="172" stroke={`url(#${uid}-goldGrad)`} strokeWidth="2" />
          <line x1="68" y1="135" x2="122" y2="177" stroke={`url(#${uid}-goldGrad)`} strokeWidth="2" />
          {/* Medal pin */}
          <circle cx="86" cy="142" r="4" fill={`url(#${uid}-goldGrad)`} />
        </g>
      )}

      {itemId === 'body_jubah_beludru' && (
        <g>
          {/* Imperial Velvet Robe */}
          <path
            d="M 62 120 C 50 144, 52 175, 72 178 C 88 182, 112 182, 128 178 C 148 175, 150 144, 138 120 Z"
            fill={`url(#${uid}-rubyGrad)`}
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
          <path d="M 80 134 Q 100 142 120 134" stroke={`url(#${uid}-goldGrad)`} strokeWidth="3" fill="none" />
          <circle cx="80" cy="134" r="3.5" fill={`url(#${uid}-goldGrad)`} />
          <circle cx="120" cy="134" r="3.5" fill={`url(#${uid}-goldGrad)`} />
          {/* Gold bottom fringe */}
          <path d="M 72 178 Q 100 184 128 178" stroke={`url(#${uid}-goldGrad)`} strokeWidth="4" fill="none" />
        </g>
      )}
    </g>
  );
}
