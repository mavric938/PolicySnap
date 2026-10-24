import { NextResponse } from 'next/server';
import { errorResponse, requireAdmin } from '@/lib/auth/session';
import { safeFetch } from '@/lib/safeFetch';

interface AIResponseData {
  title: string;
  category: string;
  summary: string;
  actorTags: string[];
  criteriaDescriptions: {
    effectiveness: string;
    efficiency: string;
    equity: string;
    responsiveness: string;
  };
  actorCards: Array<{
    id: string;
    name: string;
    role: string;
    description: string;
    imageEmoji: string;
  }>;
}

// Helper to sanitize HTML tags and decode basic entities
function cleanHtml(rawHtml: string): string {
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Scrape article text, title, and metadata from URL
async function scrapeUrl(targetUrl: string): Promise<{ title: string; description: string; text: string }> {
  // safeFetch: blokir URL ke jaringan internal (SSRF) termasuk lewat redirect
  const response = await safeFetch(targetUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil konten berita: HTTP ${response.status}`);
  }

  const html = await response.text();

  // Extract Title
  let title = '';
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    title = ogTitleMatch[1];
  } else {
    const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleTagMatch && titleTagMatch[1]) {
      title = titleTagMatch[1];
    }
  }

  // Clean title
  title = title.replace(/\s*[-|–]\s*(Kompas\.com|detikNews|detikcom|CNN Indonesia|Tempo\.co|Kumparan|Antara News).*$/i, '').trim();

  // Extract Meta Description
  let description = '';
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  if (ogDescMatch && ogDescMatch[1]) {
    description = ogDescMatch[1];
  } else if (metaDescMatch && metaDescMatch[1]) {
    description = metaDescMatch[1];
  }

  // Extract article body paragraphs
  const pMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi) || [];
  const pTexts = pMatches
    .map((p) => cleanHtml(p))
    .filter((text) => text.length > 40 && !text.includes('Baca juga') && !text.includes('Copyright') && !text.includes('Pilihan Editor'))
    .slice(0, 15)
    .join('\n\n');

  const mainText = (pTexts.length > 100 ? pTexts : cleanHtml(html)).slice(0, 5000);

  return {
    title: title || 'Isu Kebijakan Publik',
    description: description || '',
    text: mainText,
  };
}

// Extract using DeepSeek API (OpenAI-compatible format)
async function extractWithDeepSeek(
  content: { title: string; description: string; text: string; url: string },
  apiKey: string,
  baseUrl: string = 'https://api.deepseek.com',
  model: string = 'deepseek-chat'
): Promise<AIResponseData> {
  const cleanBase = baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
  const endpoint = `${cleanBase}/chat/completions`;

  const systemPrompt = `Anda adalah Analis Kebijakan Publik Senior untuk platform PolicySnap.
Tugas Anda adalah membaca artikel berita kebijakan Indonesia dan mengekstrak struktur evaluasi kebijakan yang representatif dan objektif dalam format JSON.
Kembalikan HANYA objek JSON murni (valid JSON format) tanpa teks tambahan di luar JSON.`;

  const userPrompt = `Analisis artikel berita kebijakan berikut dan ekstrak ke format JSON:
URL: ${content.url}
Judul: ${content.title}
Ringkasan: ${content.description}
Konten Berita:
${content.text}

Keluarkan format JSON dengan struktur persis seperti ini:
{
  "title": "Judul regulasi/kebijakan yang padat, menarik, dan informatif (maksimal 90 karakter)",
  "category": "Pilih salah satu: 'Ekonomi & Pajak' | 'Pendidikan & Kesehatan' | 'Infrastruktur & Tata Ruang' | 'Ketenagakerjaan & Hukum' | 'Sosial & Lingkungan' | 'Teknologi & Digital'",
  "summary": "Ringkasan latar belakang, esensi regulasi yang diusulkan, dan pokok polemik di masyarakat dalam 2-3 kalimat objektif.",
  "actorTags": ["3-5 nama aktor/stakeholder singkat, contoh: Kemendikdasmen, Guru, Murid, Komite Sekolah"],
  "criteriaDescriptions": {
    "effectiveness": "Target capaian terukur atau indikator keberhasilan spesifik kebijakan ini (Contoh: Target Terukur: Mengurangi angka buta aksara dan menaikkan skor PISA sebesar 25%).",
    "efficiency": "Efisiensi alokasi biaya, beban jam kerja/operasional, atau optimalisasi sumber daya terkait kebijakan ini.",
    "equity": "Tingkat keadilan distribusi, dampak terhadap kelompok rentan, peserta didik tertinggal, atau wilayah 3T.",
    "responsiveness": "Kecepatan dan ketanggapan regulasi ini dalam merespons realitas lapangan atau keluhan publik."
  },
  "actorCards": [
    {
      "id": "actor-1",
      "name": "Nama Stakeholder Kunci 1 (misal Regulator/Kementerian)",
      "role": "Regulator Utama",
      "description": "Kekhawatiran, posisi, atau target kementerian terkait kebijakan ini...",
      "imageEmoji": "🏛️"
    },
    {
      "id": "actor-2",
      "name": "Nama Stakeholder 2 (misal Pelaksana Lapangan/Guru/Aparatur)",
      "role": "Pelaksana Teknis",
      "description": "Tantangan operasional atau beban kerja yang dihadapi di lapangan...",
      "imageEmoji": "👨‍🏫"
    },
    {
      "id": "actor-3",
      "name": "Nama Stakeholder 3 (misal Penerima Dampak/Murid/Warga)",
      "role": "Penerima Dampak",
      "description": "Dampak langsung yang dirasakan terhadap masa depan atau keseharian mereka...",
      "imageEmoji": "🎒"
    },
    {
      "id": "actor-4",
      "name": "Nama Stakeholder 4 (misal Orang Tua/Asosiasi/Publik)",
      "role": "Pengawas & Pendamping",
      "description": "Aspirasi, kecemasan biaya, atau harapan pendampingan...",
      "imageEmoji": "👨‍👩‍👧"
    }
  ]
}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`DeepSeek API Error (${response.status}): ${errBody}`);
  }

  const result = await response.json();
  const rawContent = result.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Respons DeepSeek kosong');
  }

  const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned) as AIResponseData;
}

// Generate with Google Gemini
async function extractWithGemini(
  content: { title: string; description: string; text: string; url: string },
  apiKey: string
): Promise<AIResponseData> {
  const prompt = `Anda adalah Analis Kebijakan Publik Senior Indonesia untuk platform PolicySnap.
Tugas Anda adalah membaca artikel/berita kebijakan berikut dan mengekstraksi struktur formulir analisis kebijakan secara objektif dan representatif dalam Bahasa Indonesia.

Informasi Berita:
URL: ${content.url}
Judul: ${content.title}
Ringkasan: ${content.description}
Isi Berita:
${content.text}

Keluarkan HANYA JSON murni (valid JSON tanpa pembungkus markdown atau komentar apapun) dengan struktur persis seperti ini:
{
  "title": "Judul isu regulasi/kebijakan yang padat, menarik dan informatif (maksimal 90 karakter)",
  "category": "Pilih salah satu yang paling relevan: 'Ekonomi & Pajak' | 'Pendidikan & Kesehatan' | 'Infrastruktur & Tata Ruang' | 'Ketenagakerjaan & Hukum' | 'Sosial & Lingkungan' | 'Teknologi & Digital'",
  "summary": "Ringkasan latar belakang, esensi regulasi yang diusulkan, dan pokok polemik di masyarakat dalam 2-3 kalimat objektif.",
  "actorTags": ["3-5 nama aktor/stakeholder singkat, contoh: Kemendikdasmen, Guru, Murid, Komite Sekolah"],
  "criteriaDescriptions": {
    "effectiveness": "Target capaian terukur atau indikator keberhasilan spesifik kebijakan ini (Contoh: Target Terukur: Mengurangi angka buta aksara dan menaikkan skor PISA sebesar 25%).",
    "efficiency": "Efisiensi alokasi biaya, beban jam kerja/operasional, atau optimalisasi sumber daya terkait kebijakan ini.",
    "equity": "Tingkat keadilan distribusi, dampak terhadap kelompok rentan, peserta didik tertinggal, atau wilayah 3T.",
    "responsiveness": "Kecepatan dan ketanggapan regulasi ini dalam merespons realitas lapangan atau keluhan publik."
  },
  "actorCards": [
    {
      "id": "actor-1",
      "name": "Nama Stakeholder Kunci 1 (misal Regulator/Kementerian)",
      "role": "Regulator Utama",
      "description": "Kekhawatiran, posisi, atau target kementerian terkait kebijakan ini...",
      "imageEmoji": "🏛️"
    },
    {
      "id": "actor-2",
      "name": "Nama Stakeholder 2 (misal Pelaksana Lapangan/Guru/Aparatur)",
      "role": "Pelaksana Teknis",
      "description": "Tantangan operasional atau beban kerja yang dihadapi...",
      "imageEmoji": "👨‍🏫"
    },
    {
      "id": "actor-3",
      "name": "Nama Stakeholder 3 (misal Penerima Dampak/Murid/Warga)",
      "role": "Penerima Dampak",
      "description": "Dampak langsung yang dirasakan terhadap masa depan atau keseharian mereka...",
      "imageEmoji": "🎒"
    },
    {
      "id": "actor-4",
      "name": "Nama Stakeholder 4 (misal Orang Tua/Asosiasi/Publik)",
      "role": "Pengawas & Pendamping",
      "description": "Aspirasi, kecemasan biaya, atau harapan pendampingan...",
      "imageEmoji": "👨‍👩‍👧"
    }
  ]
}`;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API ${model} Error (${response.status}): ${errBody}`);
      }

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('Respons Gemini kosong');
      }

      const cleaned = generatedText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleaned) as AIResponseData;
    } catch (err: unknown) {
      lastError = err;
      console.warn(`Failed with model ${model}, trying next if available:`, (err as Error).message);
    }
  }

  throw lastError || new Error('Gagal memproses dengan Google Gemini');
}

// Generate with OpenAI
async function extractWithOpenAI(
  content: { title: string; description: string; text: string; url: string },
  apiKey: string
): Promise<AIResponseData> {
  const systemPrompt = `Anda adalah Analis Kebijakan Publik Senior untuk PolicySnap. Analisis berita kebijakan dan ekstrak ke format JSON yang representatif bagi matriks kebijakan (Efektivitas, Efisiensi, Keadilan, Responsivitas) dan Aktor Kunci.`;
  const userPrompt = `URL: ${content.url}\nJudul: ${content.title}\nRingkasan: ${content.description}\nIsi:\n${content.text}\n\nFormat output JSON harus memiliki keys: title, category, summary, actorTags, criteriaDescriptions (effectiveness, efficiency, equity, responsiveness), actorCards (array of 4 items: id, name, role, description, imageEmoji).`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errBody}`);
  }

  const result = await response.json();
  const rawJson = result.choices?.[0]?.message?.content;
  return JSON.parse(rawJson) as AIResponseData;
}

// Heuristic fallback if no API key is provided
function generateHeuristicFallback(
  content: { title: string; description: string; text: string; url: string }
): AIResponseData {
  const t = (content.title || '').toLowerCase();
  let category = 'Ekonomi & Pajak';
  let emoji1 = '🏛️';
  let emoji2 = '💼';
  let emoji3 = '👥';
  let emoji4 = '⚖️';

  if (t.includes('siswa') || t.includes('sekolah') || t.includes('guru') || t.includes('kelas') || t.includes('pendidikan') || t.includes('belajar')) {
    category = 'Pendidikan & Kesehatan';
    emoji1 = '🏛️';
    emoji2 = '👨‍🏫';
    emoji3 = '🎒';
    emoji4 = '👨‍👩‍👧';
  } else if (t.includes('kesehatan') || t.includes('bpjs') || t.includes('dokter') || t.includes('rumah sakit')) {
    category = 'Pendidikan & Kesehatan';
    emoji1 = '🏛️';
    emoji2 = '👨‍⚕️';
    emoji3 = '🏥';
    emoji4 = '👥';
  } else if (t.includes('lingkungan') || t.includes('sampah') || t.includes('hutan') || t.includes('iklim') || t.includes('tambang')) {
    category = 'Sosial & Lingkungan';
    emoji1 = '🏛️';
    emoji2 = '🌿';
    emoji3 = '🏘️';
    emoji4 = '⚖️';
  } else if (t.includes('jalan') || t.includes('tol') || t.includes('kereta') || t.includes('proyek') || t.includes('ikn')) {
    category = 'Infrastruktur & Tata Ruang';
    emoji1 = '🏛️';
    emoji2 = '🏗️';
    emoji3 = '🚗';
    emoji4 = '👥';
  }

  return {
    title: content.title.slice(0, 90),
    category,
    summary: content.description || (content.text ? content.text.slice(0, 220) + '...' : `Analisis kebijakan publik terkait ${content.title}.`),
    actorTags: ['Pemerintah', 'Pelaksana Teknis', 'Masyarakat Terdampak', 'Organisasi Sipil'],
    criteriaDescriptions: {
      effectiveness: `Target Terukur: Mengoptimalkan capaian regulasi "${content.title.slice(0, 45)}" serta menyelesaikan akar masalah utama secara berkelanjutan.`,
      efficiency: `Optimalisasi sumber daya dan anggaran tanpa membebani biaya operasional publik yang berlebihan.`,
      equity: `Pemerataan manfaat kebijakan bagi seluruh lapisan masyarakat tanpa diskriminasi wilayah atau status ekonomi.`,
      responsiveness: `Tingkat adaptasi dan ketanggapan sistem terhadap masukan serta kebutuhan nyata kelompok sasaran di lapangan.`,
    },
    actorCards: [
      {
        id: 'actor-1',
        name: 'Kementerian / Pembuat Regulasi',
        role: 'Regulator Kebijakan',
        description: `Bertanggung jawab atas formulasi payung hukum dan akuntabilitas implementasi ${content.title.slice(0, 40)}.`,
        imageEmoji: emoji1,
      },
      {
        id: 'actor-2',
        name: 'Pelaksana Teknis & Lapangan',
        role: 'Aparatur Pelaksana',
        description: 'Menghadapi beban kesiapan SOP, adaptasi sistem baru, dan tantangan operasional harian.',
        imageEmoji: emoji2,
      },
      {
        id: 'actor-3',
        name: 'Kelompok Sasaran Langsung',
        role: 'Penerima Dampak Kebijakan',
        description: 'Merasakan langsung konsekuensi regulasi terhadap akses, biaya, atau keberlanjutan hidup mereka.',
        imageEmoji: emoji3,
      },
      {
        id: 'actor-4',
        name: 'Komunitas & Pengamat Publik',
        role: 'Pengawas Independen',
        description: 'Menyoroti transparansi, keadilan distribusi dampak, dan perlindungan hak-hak masyarakat.',
        imageEmoji: emoji4,
      },
    ],
  };
}

// GET: Check backend AI status (admin)
export async function GET() {
  try {
    await requireAdmin();
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal memeriksa status AI');
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  let activeProvider = 'heuristic';
  let activeModel = 'Metadata Parser';

  if (deepseekKey) {
    activeProvider = 'deepseek';
    activeModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  } else if (geminiKey) {
    activeProvider = 'gemini';
    activeModel = 'gemini-2.0-flash';
  } else if (openAiKey) {
    activeProvider = 'openai';
    activeModel = 'gpt-4o-mini';
  }

  return NextResponse.json({
    configured: Boolean(deepseekKey || geminiKey || openAiKey),
    activeProvider,
    activeModel,
    deepseekConfigured: Boolean(deepseekKey),
  });
}

// POST: Extract issue from news URL
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: 'URL link berita wajib disertakan' }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Format URL tidak valid (harus menyertakan http:// atau https://)' }, { status: 400 });
    }

    // 1. Scrape content from news page
    let scraped;
    try {
      scraped = await scrapeUrl(url);
    } catch (scrapeErr: unknown) {
      return NextResponse.json(
        {
          error: `Gagal membaca tautan berita: ${(scrapeErr as Error).message}. Pastikan URL dapat diakses publik.`,
        },
        { status: 422 }
      );
    }

    // 2. Check Backend Environment Keys (DeepSeek priority)
    const deepseekKey = (process.env.DEEPSEEK_API_KEY || body.apiKey)?.trim();
    const deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    const geminiKey = (process.env.GEMINI_API_KEY || body.apiKey)?.trim();
    const openAiKey = (process.env.OPENAI_API_KEY || body.apiKey)?.trim();

    let aiData: AIResponseData;
    let usedMethod: 'deepseek' | 'gemini' | 'openai' | 'heuristic' = 'heuristic';
    let usedModel: string = 'Metadata Parser';

    if (deepseekKey) {
      try {
        aiData = await extractWithDeepSeek({ ...scraped, url }, deepseekKey, deepseekBaseUrl, deepseekModel);
        usedMethod = 'deepseek';
        usedModel = deepseekModel;
      } catch (deepseekErr: unknown) {
        console.warn('DeepSeek extraction failed, falling back to heuristic:', deepseekErr);
        aiData = generateHeuristicFallback({ ...scraped, url });
        usedMethod = 'heuristic';
      }
    } else if (geminiKey) {
      try {
        aiData = await extractWithGemini({ ...scraped, url }, geminiKey);
        usedMethod = 'gemini';
        usedModel = 'gemini-2.0-flash';
      } catch (geminiErr: unknown) {
        console.warn('Gemini extraction failed, falling back to heuristic:', geminiErr);
        aiData = generateHeuristicFallback({ ...scraped, url });
        usedMethod = 'heuristic';
      }
    } else if (openAiKey) {
      try {
        aiData = await extractWithOpenAI({ ...scraped, url }, openAiKey);
        usedMethod = 'openai';
        usedModel = 'gpt-4o-mini';
      } catch (openAiErr: unknown) {
        console.warn('OpenAI extraction failed, falling back to heuristic:', openAiErr);
        aiData = generateHeuristicFallback({ ...scraped, url });
        usedMethod = 'heuristic';
      }
    } else {
      // No API key provided in backend
      aiData = generateHeuristicFallback({ ...scraped, url });
      usedMethod = 'heuristic';
    }

    return NextResponse.json({
      success: true,
      method: usedMethod,
      model: usedModel,
      sourceUrl: url,
      data: {
        title: aiData.title || scraped.title,
        category: aiData.category || 'Ekonomi & Pajak',
        summary: aiData.summary || scraped.description,
        actorTags: aiData.actorTags || ['Pemerintah', 'Masyarakat'],
        criteriaDescriptions: aiData.criteriaDescriptions,
        actorCards: aiData.actorCards,
      },
      hasApiKey: Boolean(deepseekKey || geminiKey || openAiKey),
    });
  } catch (error: unknown) {
    return errorResponse(error, 'Terjadi kesalahan saat memproses tautan berita');
  }
}
