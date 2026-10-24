import type { Argument } from '@/types';

/**
 * Pengelompokan "pendirian" (stance) yang dipakai bersama oleh server (distribusi konsensus)
 * dan halaman (badge, filter). Satu sumber agar warna, filter, dan persentase selalu konsisten.
 */

export type StanceGroup = 'support' | 'conditional' | 'reject';
export type StanceFilter = 'all' | 'dukung' | 'netral' | 'tolak';

// Cek "Tidak/Tolak" lebih dulu: "Tidak Setuju" juga mengandung kata "Setuju".
export function classifyStance(stance: string): StanceGroup {
  if (stance.includes('Tolak') || stance.includes('Tidak')) return 'reject';
  if (stance.includes('Bersyarat') || stance.includes('Netral')) return 'conditional';
  return 'support';
}

const FILTER_TO_GROUP: Record<Exclude<StanceFilter, 'all'>, StanceGroup> = {
  dukung: 'support',
  netral: 'conditional',
  tolak: 'reject',
};

export function matchesStanceFilter(stance: string, filter: StanceFilter): boolean {
  return filter === 'all' || classifyStance(stance) === FILTER_TO_GROUP[filter];
}

const STANCE_BADGE_STYLES: Record<StanceGroup, { background: string; color: string; border: string }> = {
  support: { background: '#ECFDF5', color: '#047857', border: '1px solid #D1FAE5' },
  conditional: { background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' },
  reject: { background: '#FFF1F2', color: '#BE123C', border: '1px solid #FFE4E6' },
};

export function getStanceBadgeStyle(stance: string) {
  return STANCE_BADGE_STYLES[classifyStance(stance)];
}

/** Warna solid per kelompok (bar distribusi, titik legenda). */
export const STANCE_COLORS: Record<StanceGroup, string> = {
  support: '#10B981',
  conditional: '#F59E0B',
  reject: '#F43F5E',
};

type Votable = Pick<Argument, 'upvotes' | 'downvotes'>;

/** Comparator skor murni (upvote − downvote), tertinggi dulu (US-005). */
export function compareByNetVotes(a: Votable, b: Votable): number {
  return b.upvotes - b.downvotes - (a.upvotes - a.downvotes);
}
