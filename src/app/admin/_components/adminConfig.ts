import type { ActorCard, CriteriaDescriptions } from '@/types';

/** Konfigurasi & tipe bersama Panel Admin. */

export const CATEGORIES = [
  'Pendidikan & Kesehatan',
  'Ekonomi & Pajak',
  'Infrastruktur & Tata Ruang',
  'Ketenagakerjaan & Hukum',
  'Sosial & Lingkungan',
  'Teknologi & Digital',
];

export const DEFAULT_CRITERIA: CriteriaDescriptions = {
  effectiveness: 'Target Terukur: Mengurangi masalah utama hingga 40% dan mencapai indikator keberhasilan.',
  efficiency: 'Efisiensi alokasi anggaran dan jam operasional tanpa membebani keuangan publik.',
  equity: 'Distribusi perlindungan adil untuk kelompok rentan dan masyarakat daerah tertinggal.',
  responsiveness: 'Ketanggapan terhadap aspirasi publik dan keluhan masyarakat di lapangan.',
};

export const DEFAULT_ACTORS: ActorCard[] = [
  {
    id: 'actor-1',
    name: 'Kementerian Terkait',
    role: 'Regulator Utama',
    description: 'Menyusun regulasi, mengawasi kepatuhan hukum, dan menetapkan standar operasional.',
    imageEmoji: '🏛️',
  },
  {
    id: 'actor-2',
    name: 'Pelaksana Lapangan',
    role: 'Aparatur Teknis',
    description: 'Menghadapi beban kesiapan sistem, adaptasi operasional baru, dan verifikasi di lapangan.',
    imageEmoji: '💼',
  },
  {
    id: 'actor-3',
    name: 'Kelompok Sasaran',
    role: 'Penerima Dampak',
    description: 'Merasakan langsung implikasi kebijakan terhadap kehidupan dan kesejahteraan harian.',
    imageEmoji: '👥',
  },
  {
    id: 'actor-4',
    name: 'Komunitas & Pengamat',
    role: 'Pengawas Publik',
    description: 'Menilai transparansi, keadilan distribusi dampak, dan perlindungan hak warga.',
    imageEmoji: '⚖️',
  },
];

export type ExtractMethod = 'deepseek' | 'gemini' | 'openai' | 'heuristic';

export interface AiBackendStatus {
  configured: boolean;
  activeProvider: string;
  activeModel: string;
  deepseekConfigured: boolean;
}

export const DEFAULT_AI_STATUS: AiBackendStatus = {
  configured: false,
  activeProvider: 'heuristic',
  activeModel: 'Metadata Parser',
  deepseekConfigured: false,
};

export interface IssueFormData {
  title: string;
  summary: string;
  category: string;
  sourceUrl: string;
  actorTags: string;
  status: 'active' | 'closed';
  criteria: CriteriaDescriptions;
  actorCards: ActorCard[];
}

/** Form kosong (dipakai saat inisialisasi & reset; dulu ditulis ulang di 2 tempat). */
export function createEmptyIssueForm(): IssueFormData {
  return {
    title: '',
    summary: '',
    category: 'Pendidikan & Kesehatan',
    sourceUrl: '',
    actorTags: '',
    status: 'active',
    criteria: { ...DEFAULT_CRITERIA },
    actorCards: [...DEFAULT_ACTORS],
  };
}

/** 4 kartu input matriks kriteria (urutan, ikon, warna, dan teks sama seperti sebelumnya). */
export const CRITERIA_FIELDS: {
  key: keyof CriteriaDescriptions;
  title: string;
  icon: string;
  background: string;
  color: string;
  placeholder: string;
}[] = [
  {
    key: 'effectiveness',
    title: '1. Efektivitas (Target Capaian)',
    icon: 'target',
    background: 'var(--tint-primary)',
    color: '#FF6B4A',
    placeholder: 'Target terukur dan indikator keberhasilan kebijakan...',
  },
  {
    key: 'efficiency',
    title: '2. Efisiensi (Beban Sumber Daya)',
    icon: 'account_balance_wallet',
    background: 'var(--tint-success)',
    color: '#10B981',
    placeholder: 'Efisiensi anggaran, jam kerja, atau operasional...',
  },
  {
    key: 'equity',
    title: '3. Keadilan (Pemerataan & Rentan)',
    icon: 'balance',
    background: 'var(--tint-info)',
    color: '#3B82F6',
    placeholder: 'Dampak perlindungan sosial bagi kelompok rentan / daerah 3T...',
  },
  {
    key: 'responsiveness',
    title: '4. Responsivitas (Aspirasi Publik)',
    icon: 'forum',
    background: 'var(--tint-violet)',
    color: '#8B5CF6',
    placeholder: 'Ketanggapan terhadap realitas lapangan atau keluhan warga...',
  },
];
