import type { EvaluationScores, PolicyIssue } from '@/types';

/** Konfigurasi & tipe bersama halaman Evaluate (Studio + Riwayat). */

export type ScoreKey = keyof EvaluationScores;
export type ActorVote = 'approve' | 'reject' | 'neutral';
export type SwipeDirection = 'left' | 'right' | 'neutral';

// 4 Defined Dimensions
export interface DimensionConfig {
  key: ScoreKey;
  label: string;
  sub: string;
  icon: string;
  color: string;
  bgLight: string;
  badgeBg: string;
  badgeText: string;
  getStatus: (v: number) => string;
}

export const CRITERIA_CONFIGS: DimensionConfig[] = [
  {
    key: 'effectiveness',
    label: 'Efektivitas',
    sub: 'Target Terukur: Mengurangi salah sasaran subsidi hingga 40%.',
    icon: 'target',
    color: '#10B981',
    bgLight: '#ECFDF5',
    badgeBg: '#ECFDF5',
    badgeText: '#047857',
    getStatus: (v) => (v <= 3 ? 'Kurang Efektif' : v <= 6 ? 'Cukup Efektif' : v <= 8 ? 'Efektif' : 'Sangat Efektif'),
  },
  {
    key: 'efficiency',
    label: 'Efisiensi',
    sub: 'Alokasi Fiskal & Kemudahan Teknis Implementasi di lapangan.',
    icon: 'account_balance_wallet',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    badgeBg: '#FFFBEB',
    badgeText: '#B45309',
    getStatus: (v) => (v <= 3 ? 'Rawan Biaya' : v <= 6 ? 'Moderat' : v <= 8 ? 'Efisien' : 'Sangat Efisien'),
  },
  {
    key: 'equity',
    label: 'Keadilan',
    sub: 'Distribusi Beban: Adilkah bagi pengemudi ojol & UMKM mikro?',
    icon: 'balance',
    color: '#F43F5E',
    bgLight: '#FFF1F2',
    badgeBg: '#FFF1F2',
    badgeText: '#BE123C',
    getStatus: (v) => (v <= 3 ? 'Sangat Timpang' : v <= 6 ? 'Kurang Merata' : v <= 8 ? 'Cukup Adil' : 'Sangat Merata'),
  },
  {
    key: 'responsiveness',
    label: 'Responsivitas',
    sub: 'Ketanggapan terhadap aspirasi publik dan inflasi bahan pokok.',
    icon: 'forum',
    color: '#0EA5E9',
    bgLight: '#F0F9FF',
    badgeBg: '#F0F9FF',
    badgeText: '#0369A1',
    getStatus: (v) => (v <= 3 ? 'Kurang Responsif' : v <= 6 ? 'Cukup Responsif' : v <= 8 ? 'Cepat Tanggap' : 'Sangat Adaptif'),
  },
];

export const STANCE_BUTTONS = [
  { value: 'Dukung Penuh', label: 'Dukung Penuh', color: '#10B981', bg: '#ECFDF5', text: '#047857' },
  { value: 'Dukung Bersyarat', label: 'Dukung Bersyarat', color: '#FF6B4A', bg: '#FFF1ED', text: '#FF6B4A' },
  { value: 'Netral', label: 'Netral', color: '#6B7280', bg: '#F3F4F6', text: '#4B5563' },
  { value: 'Tolak Kebijakan', label: 'Tolak Kebijakan', color: '#F43F5E', bg: '#FFF1F2', text: '#BE123C' },
];

export function getCategoryIcon(cat?: string): string {
  const c = (cat || '').toLowerCase();
  if (c.includes('energi') || c.includes('bbm') || c.includes('minyak')) return 'local_gas_station';
  if (c.includes('kesehatan') || c.includes('medis')) return 'health_and_safety';
  if (c.includes('pendidikan') || c.includes('sekolah')) return 'school';
  if (c.includes('ekonomi') || c.includes('fiskal') || c.includes('uang')) return 'account_balance';
  if (c.includes('lingkungan') || c.includes('iklim')) return 'forest';
  if (c.includes('digital') || c.includes('teknologi')) return 'devices';
  return 'policy';
}

export const DEFAULT_FALLBACK_ISSUE: PolicyIssue = {
  id: 'issue-001',
  title: 'Pembatasan BBM Bersubsidi Berdasarkan Kapasitas Mesin (CC Kendaraan)',
  summary: 'Pemerintah berencana membatasi konsumsi Pertalite hanya untuk roda dua di bawah 250cc dan roda empat di bawah 1.400cc guna memastikan alokasi subsidi fiskal tepat sasaran pada kelompok masyarakat rentan.',
  category: 'Subsidi Energi & Transportasi',
  sourceUrl: 'https://migas.esdm.go.id',
  actorTags: ['Pengemudi Ojol & Logistik UMKM', 'Kementerian Keuangan & Fiskal APBN', 'Masyarakat Desil Rentan', 'Pengelola SPBU & Pertamina'],
  status: 'active',
  totalEvaluations: 14280,
  createdAt: '2026-10-12',
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZbnHPd2zt3uSqDcEb2yocYglKCA0HBFYq2By8WeyoXpnTn5FYU_-D9bY95UCk9CpXdBTO6-_148klSetT_VfCyEYmknMzmpUVAOh1islnmUwssiybiuFU2lQizWTddJZy8PgEY9k8lRFUi3slGZ51DLJzJQU6kiK61gWO0HOnJ1hVcGiEM9k6iQusbexfBz6LwaoYBBDcdbwjcoolPiSrvNYuSgVHywfFHU5XCBcA-bo_1XaFqS21',
  criteriaDescriptions: {
    effectiveness: 'Target Terukur: Mengurangi salah sasaran subsidi hingga 40%.',
    efficiency: 'Alokasi Fiskal & Kemudahan Teknis Implementasi barcode QR di lapangan.',
    equity: 'Distribusi Beban: Adilkah bagi pengemudi ojol, UMKM mikro, & kelas menengah rentan?',
    responsiveness: 'Ketanggapan terhadap aspirasi publik dan penyesuaian inflasi bahan pokok.',
  },
  actorCards: [
    {
      id: 'actor-1',
      name: 'Pengemudi Ojol & Logistik UMKM',
      role: 'Konsumen Harian / Pekerja Gig',
      description: 'Berisiko mengalami antrean panjang di SPBU dan potensi penurunan pendapatan harian jika validasi barcode digital tersendat atau kuota habis di tengah operasional.',
      imageEmoji: '🛵',
    },
    {
      id: 'actor-2',
      name: 'Kementerian Keuangan & Fiskal APBN',
      role: 'Regulator Anggaran Negara',
      description: 'Potensi penghematan belanja subsidi energi hingga Rp 12 Triliun per tahun untuk direalokasikan ke program bantuan sosial terarah.',
      imageEmoji: '🏛️',
    },
    {
      id: 'actor-3',
      name: 'Masyarakat Desil Rentan',
      role: 'Penerima Manfaat Utama',
      description: 'Konsumen prioritas subsidi agar terlindungi dari gejolak lonjakan inflasi harga kebutuhan pokok.',
      imageEmoji: '👥',
    },
    {
      id: 'actor-4',
      name: 'Pengelola SPBU & Pertamina',
      role: 'Pelaksana Teknis Lapangan',
      description: 'Kesiapan infrastruktur verifikasi digital sistem barcode dan pencegahan antrean nozzle.',
      imageEmoji: '⛽',
    },
  ],
};

export interface EvaluationRecord {
  issueId: string;
  issueTitle: string;
  category: string;
  scores: {
    effectiveness: number;
    efficiency: number;
    equity: number;
    responsiveness: number;
  };
  actorVotes?: Record<string, ActorVote>;
  stance: string;
  comment: string;
  compositeScore: number;
  timestamp: string;
}

export function formatEvalDate(isoStr?: string): string {
  if (!isoStr) return 'Baru saja';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '12 Okt 2026';
  }
}
