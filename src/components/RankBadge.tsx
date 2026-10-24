import { getRankForXP, RANKS } from '@/data/mock';
import { RankLevel } from '@/types';

interface RankBadgeProps {
  rank?: RankLevel;
  xp?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function RankBadge({ rank, xp, showLabel = true, size = 'sm' }: RankBadgeProps) {
  // Ambang XP diambil dari RANKS (satu sumber FR-7), bukan ditulis ulang di sini
  const rankInfo = xp !== undefined ? getRankForXP(xp) : RANKS.find((r) => r.key === rank) ?? RANKS[0];

  const sizeStyles = {
    sm: { fontSize: '0.75rem', padding: '2px 8px', iconSize: '0.813rem' },
    md: { fontSize: '0.875rem', padding: '4px 12px', iconSize: '1rem' },
    lg: { fontSize: '1rem', padding: '6px 16px', iconSize: '1.25rem' },
  };

  const s = sizeStyles[size];

  return (
    <span
      className={`badge ${rankInfo.badgeClass}`}
      style={{ fontSize: s.fontSize, padding: s.padding }}
      title={`Level ${rankInfo.level}: ${rankInfo.name}`}
    >
      <span style={{ fontSize: s.iconSize }}>{rankInfo.icon}</span>
      {showLabel && <span>{rankInfo.name}</span>}
    </span>
  );
}
