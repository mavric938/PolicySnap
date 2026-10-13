/**
 * Mapping kategori isu kebijakan publik ke gambar ilustrasi default resmi PolicySnap
 * Mencegah penggunaan foto minuman/placeholder yang tidak relevan dengan tema kebijakan.
 */

export const CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  'pendidikan_kesehatan': '/images/categories/pendidikan_kesehatan.jpg',
  'ekonomi_pajak': '/images/categories/ekonomi_pajak.jpg',
  'teknologi_digital': '/images/categories/teknologi_digital.jpg',
  'energi_transportasi': '/images/categories/energi_transportasi.jpg',
  'infrastruktur_tataruang': '/images/categories/infrastruktur_tataruang.jpg',
  'sosial_lingkungan': '/images/categories/sosial_lingkungan.jpg',
  'ketenagakerjaan_hukum': '/images/categories/ketenagakerjaan_hukum.jpg',
};

/**
 * Mengambil ilustrasi default berdasarkan string kategori
 */
export function getCategoryIllustration(category?: string): string {
  if (!category) return CATEGORY_ILLUSTRATIONS.ekonomi_pajak;
  const c = category.toLowerCase();

  if (c.includes('pendidikan') || c.includes('sekolah') || c.includes('kesehatan') || c.includes('medis') || c.includes('cukai')) {
    return CATEGORY_ILLUSTRATIONS.pendidikan_kesehatan;
  }
  if (c.includes('ekonomi') || c.includes('pajak') || c.includes('fiskal') || c.includes('keuangan') || c.includes('apbn')) {
    return CATEGORY_ILLUSTRATIONS.ekonomi_pajak;
  }
  if (c.includes('teknologi') || c.includes('digital') || c.includes('ai') || c.includes('siber') || c.includes('data')) {
    return CATEGORY_ILLUSTRATIONS.teknologi_digital;
  }
  if (c.includes('energi') || c.includes('bbm') || c.includes('subsidi') || c.includes('minyak') || c.includes('gas')) {
    return CATEGORY_ILLUSTRATIONS.energi_transportasi;
  }
  if (c.includes('infrastruktur') || c.includes('tata ruang') || c.includes('konstruksi') || c.includes('jalan')) {
    return CATEGORY_ILLUSTRATIONS.infrastruktur_tataruang;
  }
  if (c.includes('hukum') || c.includes('ketenagakerjaan') || c.includes('buruh') || c.includes('pekerja') || c.includes('upah')) {
    return CATEGORY_ILLUSTRATIONS.ketenagakerjaan_hukum;
  }
  if (c.includes('sosial') || c.includes('lingkungan') || c.includes('emisi') || c.includes('iklim') || c.includes('tata kota')) {
    return CATEGORY_ILLUSTRATIONS.sosial_lingkungan;
  }

  return CATEGORY_ILLUSTRATIONS.ekonomi_pajak;
}

/**
 * Mengambil banner gambar untuk kartu isu kebijakan publik.
 * Memastikan setiap kategori selalu memakai gambar ilustrasi tematiknya
 * dan tidak memakai foto minuman/placeholder yang keliru.
 */
export function getIssueBannerImage(issue?: { category?: string; imageUrl?: string; id?: string }): string {
  if (!issue) return CATEGORY_ILLUSTRATIONS.ekonomi_pajak;

  // Jika URL mengarah ke foto unsplash lama atau placeholder minuman, ganti dengan ilustrasi tematik
  if (!issue.imageUrl || issue.imageUrl.includes('photo-1551024709-8f23befc6f87') || issue.imageUrl.includes('unsplash')) {
    return getCategoryIllustration(issue.category);
  }

  // Jika issue memiliki kategori spesifik, utamakan ilustrasi tematik resmi sesuai permintaan user
  return getCategoryIllustration(issue.category);
}
