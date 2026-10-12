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
  name: 'Warga Baru PolicySnap',
  email: 'warga@policysnap.id',
  avatar: '',
  totalXP: 0,
  rankLevel: 'warga-aktif',
  evaluationsCount: 0,
  joinedAt: '2026-10-12',
};

// ===== Mock Policy Issues =====
export const DEFAULT_FALLBACK_ISSUE: PolicyIssue = {
  id: 'issue-001',
  title: 'Pembatasan BBM Bersubsidi Berdasarkan Kapasitas Mesin (CC Kendaraan)',
  summary: 'Pemerintah berencana membatasi konsumsi Pertalite hanya untuk roda dua di bawah 250cc dan roda empat di bawah 1.400cc guna memastikan alokasi subsidi fiskal tepat sasaran pada kelompok masyarakat rentan.',
  category: 'Subsidi Energi & Transportasi',
  sourceUrl: 'https://migas.esdm.go.id',
  status: 'active',
  totalEvaluations: 14280,
  createdAt: '2026-10-12',
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZbnHPd2zt3uSqDcEb2yocYglKCA0HBFYq2By8WeyoXpnTn5FYU_-D9bY95UCk9CpXdBTO6-_148klSetT_VfCyEYmknMzmpUVAOh1islnmUwssiybiuFU2lQizWTddJZy8PgEY9k8lRFUi3slGZ51DLJzJQU6kiK61gWO0HOnJ1hVcGiEM9k6iQusbexfBz6LwaoYBBDcdbwjcoolPiSrvNYuSgVHywfFHU5XCBcA-bo_1XaFqS21',
  actorTags: [
    'Pengemudi Ojol & Logistik UMKM',
    'Kementerian Keuangan & Fiskal APBN',
    'Masyarakat Desil Rentan & Keluarga',
    'Pengelola SPBU & BPH Migas',
  ],
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
      description: 'Potensi penghematan belanja subsidi energi hingga Rp 12 Triliun per tahun untuk direalokasikan ke program bantuan sosial terarah dan modal produktif.',
      imageEmoji: '🏛️',
    },
    {
      id: 'actor-3',
      name: 'Masyarakat Desil Rentan & Rumah Tangga',
      role: 'Penerima Manfaat Prioritas',
      description: 'Perlindungan daya beli terhadap lonjakan tarif inflasi transportasi umum serta stabilitas harga kebutuhan pangan keluarga sehari-hari.',
      imageEmoji: '👥',
    },
    {
      id: 'actor-4',
      name: 'Pengelola SPBU & BPH Migas',
      role: 'Pelaksana Teknis Lapangan',
      description: 'Kesiapan infrastruktur verifikasi digital sistem MyPertamina, ketersediaan sinyal di daerah 3T, dan pencegahan gesekan sosial di area nozzle.',
      imageEmoji: '⛽',
    },
  ],
};

export const MOCK_ISSUES: PolicyIssue[] = [
  DEFAULT_FALLBACK_ISSUE,
  {
    id: 'issue-002',
    title: 'Penerapan Cukai Minuman Berpemanis Dalam Kemasan (MBDK)',
    summary: 'Pengenaan tarif cukai progresif hingga 20% terhadap minuman manis kemasan berpemanis gula guna menekan laju prevalensi diabetes melitus dan obesitas usia produktif.',
    category: 'Kesehatan Publik & Fiskal',
    sourceUrl: 'https://kemenkes.go.id',
    status: 'active',
    totalEvaluations: 8420,
    createdAt: '2026-10-10',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    actorTags: [
      'Kementerian Kesehatan',
      'Produsen Makanan & Minuman',
      'Konsumen Generasi Muda',
      'Pelaku Warung Retail Mikro',
    ],
    criteriaDescriptions: {
      effectiveness: 'Penurunan konsumsi gula masyarakat sebesar 15-25% dalam 2 tahun.',
      efficiency: 'Penerimaan kas cukai negara sekitar Rp 3,8 Triliun untuk dana promotif BPJS.',
      equity: 'Dampak harga relatif terhadap daya beli kelompok rentan berpenghasilan rendah.',
      responsiveness: 'Fleksibilitas transisi industri dalam reformulasi kadar gula produk.',
    },
    actorCards: [
      {
        id: 'actor-2-1',
        name: 'Kementerian Kesehatan & Tenaga Medis',
        role: 'Otoritas Kesehatan Publik',
        description: 'Mencegah beban defisit pembiayaan BPJS Kesehatan akibat lonjakan penyakit katastropik diabetes melitus dan gagal ginjal usia muda.',
        imageEmoji: '🩺',
      },
      {
        id: 'actor-2-2',
        name: 'Asosiasi Industri Minuman Kemasan',
        role: 'Sektor Manufaktur & Usaha',
        description: 'Kekhawatiran penurunan volume penjualan produk retail, potensi PHK lini produksi, serta kebutuhan waktu riset reformulasi pemanis alternatif.',
        imageEmoji: '🏭',
      },
      {
        id: 'actor-2-3',
        name: 'Konsumen Remaja & Keluarga Muda',
        role: 'Konsumen Akhir',
        description: 'Dorongan perubahan pola konsumsi menuju air mineral dan minuman sehat, diimbangi transparansi label nutrisi yang mudah dipahami.',
        imageEmoji: '🥤',
      },
    ],
  },
  {
    id: 'issue-003',
    title: 'Zonasi Emisi Rendah & Disinsentif Tarif Parkir Kendaraan Pribadi Urban',
    summary: 'Pemberlakuan tarif parkir maksimal bagi kendaraan bermotor yang belum lulus uji emisi serta pembatasan akses koridor pusat kota metropolitan pada jam sibuk kerja.',
    category: 'Tata Kota & Lingkungan',
    sourceUrl: 'https://dephub.go.id',
    status: 'active',
    totalEvaluations: 5190,
    createdAt: '2026-10-08',
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
    actorTags: [
      'Dinas Perhubungan Urban',
      'Komuter Angkutan Umum',
      'Pemilik Kendaraan Pribadi',
      'Pengelola Gedung Perkantoran',
    ],
    criteriaDescriptions: {
      effectiveness: 'Reduksi polusi udara PM2.5 hingga 18% di koridor sentra bisnis kota.',
      efficiency: 'Peningkatan pendapatan retribusi daerah dan utilisasi armada bus transit.',
      equity: 'Ketersediaan armada pengumpan (feeder) ramah kantong bagi warga pinggiran.',
      responsiveness: 'Penyediaan integrasi satu tiket murah lintas moda transportasi publik.',
    },
    actorCards: [
      {
        id: 'actor-3-1',
        name: 'Dinas Perhubungan & Pengelola Transjakarta',
        role: 'Regulator Transportasi Publik',
        description: 'Mendorong peralihan moda transportasi warga ke angkutan massal untuk mengurai kemacetan kronis dan polusi emisi karbon.',
        imageEmoji: '🚌',
      },
      {
        id: 'actor-3-2',
        name: 'Penglaju Harian Luar Kota (Komuter)',
        role: 'Pekerja Urban Harian',
        description: 'Menuntut jaminan integrasi jadwal feeder andal dan fasilitas park-and-ride aman di stasiun penyangga sebelum tarif disinsentif dinaikkan.',
        imageEmoji: '🚆',
      },
      {
        id: 'actor-3-3',
        name: 'Pemerhati Hak Udara Bersih & Lansia',
        role: 'Kelompok Rentan Kesehatan',
        description: 'Hak atas ruang hidup bebas polutan beracun bagi anak-anak dan lansia yang kerap menderita ISPA kambuhan.',
        imageEmoji: '🌳',
      },
    ],
  },
];

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
