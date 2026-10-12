import { CatCostumeItem, CatProfile } from '@/types';

export const CAT_COSTUMES: CatCostumeItem[] = [
  // ===== LEVEL 1: WARGA AKTIF (0 - 50 XP) =====
  {
    id: 'head_relawan',
    name: 'Topi Pet Relawan',
    slot: 'head',
    requiredLevel: 1,
    description: 'Topi santai berbahan katun untuk relawan pengawal kebijakan publik.',
    icon: '🧢',
    previewColor: '#FF6B4A',
    rarity: 'common',
  },
  {
    id: 'eyes_baca',
    name: 'Kacamata Baca Bulat',
    slot: 'eyes',
    requiredLevel: 1,
    description: 'Kacamata lensa jernih untuk membaca draf undang-undang berjam-jam.',
    icon: '👓',
    previewColor: '#64748B',
    rarity: 'common',
  },
  {
    id: 'body_kaos',
    name: 'Kaos Polos Warga',
    slot: 'body',
    requiredLevel: 1,
    description: 'Kaos kasual nyaman yang siap terjun berdiskusi di tengah warga.',
    icon: '👕',
    previewColor: '#3B82F6',
    rarity: 'common',
  },
  {
    id: 'acc_totebag',
    name: 'Tote Bag Kanvas',
    slot: 'accessory',
    requiredLevel: 1,
    description: 'Tas jinjing kanvas ramah lingkungan berisi catatan aspirasi warga.',
    icon: '👜',
    previewColor: '#D97706',
    rarity: 'common',
  },

  // ===== LEVEL 2: NETIZEN KRITIS (51 - 200 XP) =====
  {
    id: 'head_beanie',
    name: 'Beanie Netizen Kritis',
    slot: 'head',
    requiredLevel: 2,
    description: 'Topi rajut kasual khas netizen yang aktif meneliti data media sosial.',
    icon: '🧶',
    previewColor: '#475569',
    rarity: 'common',
  },
  {
    id: 'eyes_kotak',
    name: 'Kacamata Kritis Kotak',
    slot: 'eyes',
    requiredLevel: 2,
    description: 'Kacamata frame modern dengan filter blue-light anti radiasi monitor.',
    icon: '🕶️',
    previewColor: '#0F172A',
    rarity: 'common',
  },
  {
    id: 'body_hoodie',
    name: 'Hoodie Tech Navy',
    slot: 'body',
    requiredLevel: 2,
    description: 'Hoodie hangat bagi pengawal transparansi APBN.',
    icon: '🧥',
    previewColor: '#1E293B',
    rarity: 'rare',
  },
  {
    id: 'acc_smartphone',
    name: 'Smartphone Pemantau Isu',
    slot: 'accessory',
    requiredLevel: 2,
    description: 'Perangkat pintar siap rekam fakta dan cek silang data verifikasi.',
    icon: '📱',
    previewColor: '#0284C7',
    rarity: 'common',
  },

  // ===== LEVEL 3: AUDITOR REGULASI (201 - 500 XP) =====
  {
    id: 'head_baret',
    name: 'Baret Auditor Lapangan',
    slot: 'head',
    requiredLevel: 3,
    description: 'Baret kehormatan tim pemeriksa kepatuhan regulasi publik.',
    icon: '🪖',
    previewColor: '#B45309',
    rarity: 'rare',
  },
  {
    id: 'eyes_lensa_detektif',
    name: 'Lensa Detektif Regulasi',
    slot: 'eyes',
    requiredLevel: 3,
    description: 'Lensa optik presisi untuk mendeteksi pasal selundupan dan celah anggaran.',
    icon: '🔍',
    previewColor: '#D97706',
    rarity: 'rare',
  },
  {
    id: 'body_rompi',
    name: 'Rompi Lapangan Auditor',
    slot: 'body',
    requiredLevel: 3,
    description: 'Rompi inspeksi bergaris reflektif untuk pengawasan proyek strategis.',
    icon: '🦺',
    previewColor: '#EA580C',
    rarity: 'rare',
  },
  {
    id: 'acc_clipboard',
    name: 'Clipboard Audit & Checklist',
    slot: 'accessory',
    requiredLevel: 3,
    description: 'Papan jepit resmi untuk mencatat matriks efisiensi dan keadilan kebijakan.',
    icon: '📋',
    previewColor: '#F59E0B',
    rarity: 'rare',
  },

  // ===== LEVEL 4: KONSULTAN (501 - 1.000 XP) =====
  {
    id: 'head_fedora',
    name: 'Topi Fedora Konsultan',
    slot: 'head',
    requiredLevel: 4,
    description: 'Topi fedora wol berkelas untuk konsultan penasihat kebijakan senior.',
    icon: '🎩',
    previewColor: '#334155',
    rarity: 'rare',
  },
  {
    id: 'eyes_frame_emas',
    name: 'Kacamata Titanium Emas',
    slot: 'eyes',
    requiredLevel: 4,
    description: 'Bingkai titanium tipis berlapis emas melambangkan ketajaman nalar konsultan.',
    icon: '👓',
    previewColor: '#EAB308',
    rarity: 'epic',
  },
  {
    id: 'body_jas_formal',
    name: 'Kemeja Dasi & Rompi Formal',
    slot: 'body',
    requiredLevel: 4,
    description: 'Busana bisnis resmi untuk presentasi rekomendasi kebijakan di ruang dewan.',
    icon: '👔',
    previewColor: '#0F172A',
    rarity: 'epic',
  },
  {
    id: 'acc_koper',
    name: 'Koper Kulit Eksekutif',
    slot: 'accessory',
    requiredLevel: 4,
    description: 'Briefcase kulit asli berisi berkas studi kelayakan dan dampak ekonomi publik.',
    icon: '💼',
    previewColor: '#78350F',
    rarity: 'epic',
  },

  // ===== LEVEL 5: ADVOKAT KEBIJAKAN (1.001 - 2.500 XP) =====
  {
    id: 'head_toga_advokat',
    name: 'Baret Kehormatan Yudisial',
    slot: 'head',
    requiredLevel: 5,
    description: 'Tutup kepala yudisial lambang pembela keadilan dan kepentingan publik.',
    icon: '⚖️',
    previewColor: '#1E3A8A',
    rarity: 'epic',
  },
  {
    id: 'eyes_monokel',
    name: 'Monokel Emas Keadilan',
    slot: 'eyes',
    requiredLevel: 5,
    description: 'Kaca pembesar satu mata berantai emas untuk menguji uji materi konstitusi.',
    icon: '🧐',
    previewColor: '#CA8A04',
    rarity: 'epic',
  },
  {
    id: 'body_jubah_advokat',
    name: 'Toga Advokat Hitam-Merah',
    slot: 'body',
    requiredLevel: 5,
    description: 'Jubah pengadilan megah yang dipakai saat menggugat regulasi yang merugikan rakyat.',
    icon: '🥋',
    previewColor: '#172554',
    rarity: 'epic',
  },
  {
    id: 'acc_palu_sidang',
    name: 'Palu Sidang Keadilan',
    slot: 'accessory',
    requiredLevel: 5,
    description: 'Palu sidang kayu jati lambang kepastian hukum dan putusan yang adil.',
    icon: '🔨',
    previewColor: '#9A3412',
    rarity: 'epic',
  },

  // ===== LEVEL 6: MENTERI BAYANGAN (2.501 - 5.000 XP) =====
  {
    id: 'head_peci_karismatik',
    name: 'Peci Beludru Kenegaraan',
    slot: 'head',
    requiredLevel: 6,
    description: 'Peci hitam beludru elegan yang memancarkan karisma negarawan modern.',
    icon: '🎩',
    previewColor: '#09090B',
    rarity: 'legendary',
  },
  {
    id: 'eyes_aviator_diplomat',
    name: 'Kacamata Hitam Diplomat',
    slot: 'eyes',
    requiredLevel: 6,
    description: 'Lensa gelap polaroid diplomat untuk negosiasi lintas kementerian.',
    icon: '😎',
    previewColor: '#18181B',
    rarity: 'legendary',
  },
  {
    id: 'body_tuxedo_menteri',
    name: 'Jas Resmi & Selempang Menteri',
    slot: 'body',
    requiredLevel: 6,
    description: 'Tuxedo kepresidenan dengan selempang kehormatan menteri kabinet bayangan.',
    icon: '🤵',
    previewColor: '#581C87',
    rarity: 'legendary',
  },
  {
    id: 'acc_berkas_rahasia',
    name: 'Map Rahasia Dokumen Negara',
    slot: 'accessory',
    requiredLevel: 6,
    description: 'Berkas memo kebijakan tingkat tinggi yang hanya dibuka dalam sidang kabinet terbatas.',
    icon: '📁',
    previewColor: '#DC2626',
    rarity: 'legendary',
  },

  // ===== LEVEL 7: NEGARAWAN (> 5.000 XP) =====
  {
    id: 'head_mahkota_raja',
    name: 'Mahkota Emas Negarawan Agung',
    slot: 'head',
    requiredLevel: 7,
    description: 'Mahkota bertatahkan permata kebijaksanaan, puncak tertinggi reputasi publik.',
    icon: '👑',
    previewColor: '#F59E0B',
    rarity: 'legendary',
  },
  {
    id: 'eyes_sorot_bijak',
    name: 'Aura Kacamata Sorot Emas',
    slot: 'eyes',
    requiredLevel: 7,
    description: 'Kacamata berpendar cahaya emas lambang visi masa depan bangsa yang jernih.',
    icon: '✨',
    previewColor: '#FDE047',
    rarity: 'legendary',
  },
  {
    id: 'body_jubah_beludru',
    name: 'Jubah Beludru Bordir Emas',
    slot: 'body',
    requiredLevel: 7,
    description: 'Jubah kerajaan merah tua berkerah bulu putih dan sulaman benang emas murni.',
    icon: '👘',
    previewColor: '#991B1B',
    rarity: 'legendary',
  },
  {
    id: 'acc_tongkat_scepter',
    name: 'Tongkat Komando / Scepter',
    slot: 'accessory',
    requiredLevel: 7,
    description: 'Tongkat kedaulatan emas bertakhtakan lambang keadilan sosial bagi seluruh rakyat.',
    icon: '🪄',
    previewColor: '#EAB308',
    rarity: 'legendary',
  },

  // ===== BONUS ACHIEVEMENTS =====
  {
    id: 'acc_megafon',
    name: 'Megafon Suara Rakyat',
    slot: 'accessory',
    requiredLevel: 1,
    achievementKey: 'vocal_critic',
    description: 'Diberikan kepada warga yang gigih menyuarakan argumen demi kepentingan umum.',
    icon: '📢',
    previewColor: '#EF4444',
    rarity: 'rare',
  },
  {
    id: 'head_bando_kucing',
    name: 'Bando Pita Kehormatan',
    slot: 'head',
    requiredLevel: 1,
    achievementKey: 'first_eval',
    description: 'Pita pemanis kehormatan setelah menyelesaikan evaluasi kebijakan pertama.',
    icon: '🎀',
    previewColor: '#EC4899',
    rarity: 'common',
  },
];

// Presets for Cat Customization
export const BREED_OPTIONS = [
  {
    id: 'domestik' as const,
    name: 'Domestik / Oren',
    tagline: 'Lincah, Kritis & Pemberani',
    description: 'Kucing kampung khas nusantara dengan telinga runcing waspada dan sifat adaptif tinggi.',
    defaultFur: '#F97316',
    defaultBelly: '#FFEDD5',
    defaultEye: '#10B981',
  },
  {
    id: 'persia' as const,
    name: 'Persia / Fluffy',
    tagline: 'Bulu Lebat, Kalem & Teliti',
    description: 'Kucing berbulu tebal mengembang dengan pipi chubby dan karakter penyabar dalam meneliti data.',
    defaultFur: '#F8FAFC',
    defaultBelly: '#FFFFFF',
    defaultEye: '#3B82F6',
  },
  {
    id: 'siam' as const,
    name: 'Siam / Sleek',
    tagline: 'Anggun, Tajam & Karismatik',
    description: 'Kucing eksotis ramping dengan corak telinga & moncong gelap berwibawa layaknya diplomat ulung.',
    defaultFur: '#E2E8F0',
    defaultBelly: '#F8FAFC',
    defaultEye: '#0284C7',
  },
];

export const COLOR_SWATCHES = {
  fur: [
    { label: 'Oren Tabby', hex: '#F97316' },
    { label: 'Putih Salju', hex: '#F8FAFC' },
    { label: 'Hitam Panther', hex: '#1E293B' },
    { label: 'Abu Silver', hex: '#94A3B8' },
    { label: 'Cokelat Latte', hex: '#A16207' },
    { label: 'Cream Calico', hex: '#FED7AA' },
  ],
  belly: [
    { label: 'Putih Krem', hex: '#FFFBEB' },
    { label: 'Peach Halus', hex: '#FFEDD5' },
    { label: 'Krem Salju', hex: '#FFFFFF' },
    { label: 'Abu Muda', hex: '#E2E8F0' },
  ],
  eye: [
    { label: 'Emerald Hijau', hex: '#10B981' },
    { label: 'Sapphire Biru', hex: '#2563EB' },
    { label: 'Amber Emas', hex: '#F59E0B' },
    { label: 'Ruby Ungu', hex: '#8B5CF6' },
  ],
};

export const DEFAULT_CAT_PROFILE: CatProfile = {
  name: 'Oyen Kebijakan',
  gender: 'male',
  breed: 'domestik',
  furColor: '#F97316',
  bellyColor: '#FFEDD5',
  eyeColor: '#10B981',
  earColor: '#FDA4AF',
  equipped: {
    head: 'head_relawan',
    eyes: 'eyes_baca',
    body: 'body_kaos',
    accessory: 'acc_totebag',
  },
};

export function getCostumesByLevel(level: number): CatCostumeItem[] {
  return CAT_COSTUMES.filter((c) => c.requiredLevel <= level);
}

export function getCostumeById(id?: string | null): CatCostumeItem | undefined {
  if (!id) return undefined;
  return CAT_COSTUMES.find((c) => c.id === id);
}

export function getSavedCatProfile(): CatProfile {
  if (typeof window === 'undefined') return DEFAULT_CAT_PROFILE;
  try {
    const raw = localStorage.getItem('policysnap_cat_profile');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load cat profile', e);
  }
  return DEFAULT_CAT_PROFILE;
}

export function saveCatProfile(profile: CatProfile) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('policysnap_cat_profile', JSON.stringify(profile));
  }
}
