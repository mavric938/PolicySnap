import { PolicyIssue, User, Argument, CommunityConsensus, RankInfo, ActorCard } from '@/types';

// ===== Rank System (7 Strata Pangkat/Level Gamifikasi) =====
export const RANKS: RankInfo[] = [
  {
    level: 1,
    key: 'warga-aktif',
    name: 'Warga Aktif',
    minXP: 0,
    maxXP: 50,
    color: '#92400e',
    badgeClass: 'badge-rank-1',
    icon: '🥉',
  },
  {
    level: 2,
    key: 'netizen-kritis',
    name: 'Netizen Kritis',
    minXP: 51,
    maxXP: 200,
    color: '#475569',
    badgeClass: 'badge-rank-2',
    icon: '🔍',
  },
  {
    level: 3,
    key: 'auditor-regulasi',
    name: 'Auditor Regulasi',
    minXP: 201,
    maxXP: 500,
    color: '#b45309',
    badgeClass: 'badge-rank-3',
    icon: '📋',
  },
  {
    level: 4,
    key: 'konsultan',
    name: 'Konsultan',
    minXP: 501,
    maxXP: 1000,
    color: '#d97706',
    badgeClass: 'badge-rank-4',
    icon: '💼',
  },
  {
    level: 5,
    key: 'advokat-kebijakan',
    name: 'Advokat Kebijakan',
    minXP: 1001,
    maxXP: 2500,
    color: '#2563eb',
    badgeClass: 'badge-rank-5',
    icon: '⚖️',
  },
  {
    level: 6,
    key: 'menteri-bayangan',
    name: 'Menteri Bayangan',
    minXP: 2501,
    maxXP: 5000,
    color: '#7c3aed',
    badgeClass: 'badge-rank-6',
    icon: '🏛️',
  },
  {
    level: 7,
    key: 'negarawan',
    name: 'Negarawan',
    minXP: 5001,
    maxXP: 99999,
    color: '#dc2626',
    badgeClass: 'badge-rank-7',
    icon: '👑',
  },
];

export function getRankForXP(xp: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i];
  }
  return RANKS[0];
}

export function getXPProgress(xp: number): { current: number; max: number; percentage: number } {
  const rank = getRankForXP(xp);
  const nextRank = RANKS.find(r => r.level === rank.level + 1);
  if (!nextRank) return { current: xp, max: rank.maxXP, percentage: 100 };
  const current = xp - rank.minXP;
  const max = nextRank.minXP - rank.minXP;
  return { current, max, percentage: Math.min((current / max) * 100, 100) };
}

// ===== Mock Current User =====
export const MOCK_USER: User = {
  id: 'user-001',
  name: 'Andi Prasetyo',
  email: 'andi.prasetyo@gmail.com',
  avatar: '',
  totalXP: 85,
  rankLevel: 'netizen-kritis',
  evaluationsCount: 7,
  joinedAt: '2026-08-15',
};

// ===== Mock Policy Issues =====
export const DEFAULT_FALLBACK_ISSUE: PolicyIssue = {
  id: 'issue-001',
  title: 'Evaluasi Skema Subsidi Tepat Sasaran & Efisiensi Energi Daerah',
  summary: 'Penilaian partisipatif terhadap efektivitas dan keadilan distribusi kuota subsidi bahan pokok dan energi, pencegahan kebocoran anggaran, serta proteksi daya beli masyarakat rentan.',
  category: 'Ekonomi & Energi',
  sourceUrl: 'https://kebijakan.go.id',
  actorTags: ['Kementerian ESDM & BPH Migas', 'Pelaku Usaha Mikro & UMKM', 'Masyarakat Desil Rentan', 'Distributor Energi Daerah'],
  status: 'active',
  totalEvaluations: 0,
  createdAt: '2026-10-12',
  criteriaDescriptions: {
    effectiveness: 'Target Terukur: Mengurangi salah sasaran subsidi hingga 40%.',
    efficiency: 'Penghematan Anggaran: Optimalisasi fiskal hingga Rp 12 Triliun.',
    equity: 'Distribusi Berkeadilan: 100% kuota tersalurkan ke kelompok sasaran riil.',
    responsiveness: 'Ketanggapan terhadap aspirasi publik dan stabilitas inflasi pangan.',
  },
  actorCards: [
    {
      id: 'actor-1',
      name: 'Kementerian ESDM & BPH Migas',
      role: 'Regulator Kebijakan',
      description: 'Pengawas kuota energi bersubsidi dan verifikator data sasaran penerima manfaat nasional.',
      imageEmoji: '🏛️',
    },
    {
      id: 'actor-2',
      name: 'Pelaku Usaha Mikro & UMKM',
      role: 'Kelompok Terdampak Langsung',
      description: 'Bergantung pada stabilitas pasokan bahan pokok dan energi murah untuk modal harian.',
      imageEmoji: '💼',
    },
    {
      id: 'actor-3',
      name: 'Masyarakat Desil Rentan',
      role: 'Penerima Manfaat Utama',
      description: 'Konsumen prioritas subsidi agar terlindungi dari gejolak lonjakan inflasi harga kebutuhan pokok.',
      imageEmoji: '👥',
    },
  ],
};

export const MOCK_ISSUES: PolicyIssue[] = [];

// ===== Mock Actor Cards =====
export const MOCK_ACTORS: Record<string, ActorCard[]> = {};

// ===== Mock Arguments/Comments =====
export const MOCK_ARGUMENTS: Argument[] = [];

// ===== Mock Consensus Data =====
export const MOCK_CONSENSUS: Record<string, CommunityConsensus> = {};

// ===== Stance Options =====
export const STANCE_OPTIONS = [
  { value: 'Setuju', label: 'Setuju', color: 'var(--success-400)', emoji: '👍' },
  { value: 'Tidak Setuju', label: 'Tidak Setuju', color: 'var(--danger-400)', emoji: '👎' },
  { value: 'Netral', label: 'Netral', color: 'var(--warning-400)', emoji: '🤔' },
];
