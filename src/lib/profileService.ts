import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { readLocalJson, writeLocalJson } from './localStore';
import { User, CatProfile, RankLevel } from '@/types';
import { getRankForXP } from '@/data/mock';
import { DEFAULT_CAT_PROFILE } from '@/data/catCostumes';

const LOCAL_FILE = 'profiles.json';

/** Bentuk baris `profiles` (Supabase & file JSON lokal memakai kolom snake_case yang sama). */
interface ProfileRow {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  total_xp?: number;
  rank_level?: string;
  evaluations_count?: number;
  upvotes_count?: number;
  cat_avatar?: unknown;
  created_at?: string;
  // Format lama (camelCase) yang mungkin masih ada di file lokal
  totalXP?: number;
  rankLevel?: string;
  evaluationsCount?: number;
  upvotesCount?: number;
  catAvatar?: unknown;
  joinedAt?: string;
}

// Bentuk cat_avatar lama dan baru yang perlu dinormalisasi
interface RawCatProfile {
  name?: string;
  catName?: string;
  gender?: string;
  breed?: string;
  furColor?: string;
  bellyColor?: string;
  eyeColor?: string;
  earColor?: string;
  colors?: { fur?: string; chest?: string; eyes?: string };
  equipped?: Partial<Record<'head' | 'eyes' | 'body' | 'accessory' | 'special', string | null>>;
  equippedCostumes?: Partial<Record<'hat' | 'glasses' | 'outfit' | 'accessory', string>>;
  special?: string | null;
  specialItem?: string | null;
}

export function normalizeCatProfile(input: unknown): CatProfile {
  if (!input || typeof input !== 'object') return DEFAULT_CAT_PROFILE;
  const raw = input as RawCatProfile;
  return {
    name: raw.name || raw.catName || 'Kucing Warga',
    gender: raw.gender === 'girl' || raw.gender === 'female' ? 'female' : 'male',
    breed:
      raw.breed === 'persian-fluffy' || raw.breed === 'persia'
        ? 'persia'
        : raw.breed === 'siamese-sleek' || raw.breed === 'siam'
          ? 'siam'
          : 'domestik',
    furColor: raw.furColor || raw.colors?.fur || '#F97316',
    bellyColor: raw.bellyColor || raw.colors?.chest || '#FFEDD5',
    eyeColor: raw.eyeColor || raw.colors?.eyes || '#10B981',
    earColor: raw.earColor || '#FDA4AF',
    equipped: {
      head: raw.equipped?.head || raw.equippedCostumes?.hat || null,
      eyes: raw.equipped?.eyes || raw.equippedCostumes?.glasses || null,
      body: raw.equipped?.body || raw.equippedCostumes?.outfit || null,
      accessory: raw.equipped?.accessory || raw.equippedCostumes?.accessory || null,
      special: raw.equipped?.special || raw.special || null,
    },
    specialItem: raw.specialItem || raw.equipped?.special || null,
  };
}

function rowToUser(row: ProfileRow, upvotesCount?: number): User {
  const totalXP = row.total_xp ?? row.totalXP ?? 0;
  return {
    id: row.id,
    name: row.name || 'Warga Publik',
    email: row.email || '',
    avatar: row.avatar || '',
    totalXP,
    rankLevel: (row.rank_level ?? row.rankLevel ?? getRankForXP(totalXP).key) as RankLevel,
    evaluationsCount: row.evaluations_count ?? row.evaluationsCount ?? 0,
    upvotesCount: upvotesCount ?? row.upvotes_count ?? row.upvotesCount ?? 0,
    catAvatar: normalizeCatProfile(row.cat_avatar ?? row.catAvatar),
    joinedAt: row.created_at || row.joinedAt || new Date().toISOString(),
  };
}

function userToLocalRow(user: User): ProfileRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    total_xp: user.totalXP,
    rank_level: user.rankLevel,
    evaluations_count: user.evaluationsCount,
    upvotes_count: user.upvotesCount ?? 0,
    cat_avatar: user.catAvatar,
    created_at: user.joinedAt,
  };
}

function defaultUser(userId: string): User {
  return {
    id: userId,
    name: 'Warga Baru',
    email: '',
    avatar: '',
    totalXP: 0,
    rankLevel: 'warga-aktif',
    evaluationsCount: 0,
    upvotesCount: 0,
    joinedAt: new Date().toISOString(),
    catAvatar: DEFAULT_CAT_PROFILE,
  };
}

/** Hapus data pribadi sebelum profil dikirim ke pengguna lain. */
export function toPublicProfile(user: User): User {
  return { ...user, email: '' };
}

/**
 * Get profile for user ID
 */
export async function getProfile(userId: string): Promise<User> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return defaultUser(userId);

    // Upvote diterima (argumen milik user) + upvote yang diberikan user
    const [{ data: userArgs, error: argsErr }, { count: castCount, error: castErr }] = await Promise.all([
      supabase.from('arguments').select('upvotes').eq('user_id', userId),
      supabase
        .from('argument_votes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('vote_type', 'up'),
    ]);
    if (argsErr) throw argsErr;
    if (castErr) throw castErr;

    const authorUpvotes = (userArgs || []).reduce((acc, cur) => acc + (cur.upvotes || 0), 0);
    return rowToUser(data, authorUpvotes + (castCount || 0));
  }

  const profiles = await readLocalJson<ProfileRow>(LOCAL_FILE);
  const found = profiles.find((p) => p.id === userId);
  return found ? rowToUser(found) : defaultUser(userId);
}

/**
 * Get all profiles for the citizen leaderboard
 */
export async function getAllProfiles(): Promise<User[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const [profilesRes, argsRes, votesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('total_xp', { ascending: false }),
      supabase.from('arguments').select('user_id, upvotes'),
      supabase.from('argument_votes').select('user_id').eq('vote_type', 'up'),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (argsRes.error) throw argsRes.error;
    if (votesRes.error) throw votesRes.error;

    const upvotesByUser: Record<string, number> = {};
    for (const a of argsRes.data || []) {
      upvotesByUser[a.user_id] = (upvotesByUser[a.user_id] || 0) + (a.upvotes || 0);
    }
    for (const v of votesRes.data || []) {
      upvotesByUser[v.user_id] = (upvotesByUser[v.user_id] || 0) + 1;
    }

    return (profilesRes.data || []).map((row: ProfileRow) => rowToUser(row, upvotesByUser[row.id] || 0));
  }

  const list = await readLocalJson<ProfileRow>(LOCAL_FILE);
  return list.map((row) => rowToUser(row)).sort((a, b) => b.totalXP - a.totalXP);
}

/** Cari ID profil berdasarkan email (untuk menautkan akun lama saat login pertama). */
export async function findProfileIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('id')
      .ilike('email', normalized)
      .order('total_xp', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0]?.id ?? null;
  }

  const list = await readLocalJson<ProfileRow>(LOCAL_FILE);
  const matches = list
    .filter((p) => p.email?.toLowerCase() === normalized)
    .sort((a, b) => (b.total_xp ?? 0) - (a.total_xp ?? 0));
  return matches[0]?.id ?? null;
}

/**
 * Pastikan profil ada (dipanggil server setelah login). Tidak menimpa profil yang sudah ada.
 */
export async function ensureProfile(user: { id: string; name: string; email: string; avatar?: string }): Promise<User> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        total_xp: 0,
        rank_level: 'warga-aktif',
        evaluations_count: 0,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (error) throw error;
    return getProfile(user.id);
  }

  const profiles = await readLocalJson<ProfileRow>(LOCAL_FILE);
  const existing = profiles.find((p) => p.id === user.id);
  if (existing) return rowToUser(existing);

  const created: User = {
    ...defaultUser(user.id),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
  };
  await writeLocalJson(LOCAL_FILE, [...profiles, userToLocalRow(created)]);
  return created;
}

/**
 * Update data profil yang boleh diubah pengguna sendiri: nama, avatar, dan kucing.
 * XP / rank / jumlah evaluasi TIDAK bisa diubah dari sini (dikelola server/trigger).
 */
export async function updateProfile(
  userId: string,
  updates: { name?: string; avatar?: string; catAvatar?: CatProfile }
): Promise<User> {
  const payload: Record<string, unknown> = {};
  if (updates.name?.trim()) payload.name = updates.name.trim().slice(0, 60);
  if (updates.avatar !== undefined) payload.avatar = updates.avatar;
  if (updates.catAvatar) payload.cat_avatar = normalizeCatProfile(updates.catAvatar);

  if (isSupabaseConfigured()) {
    if (Object.keys(payload).length > 0) {
      const { error } = await getSupabaseClient()
        .from('profiles')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    }
    return getProfile(userId);
  }

  const profiles = await readLocalJson<ProfileRow>(LOCAL_FILE);
  const idx = profiles.findIndex((p) => p.id === userId);
  const current = idx !== -1 ? rowToUser(profiles[idx]) : defaultUser(userId);
  const merged: User = {
    ...current,
    name: (payload.name as string | undefined) ?? current.name,
    avatar: (payload.avatar as string | undefined) ?? current.avatar,
    catAvatar: (payload.cat_avatar as CatProfile | undefined) ?? current.catAvatar,
  };

  const row = userToLocalRow(merged);
  if (idx !== -1) profiles[idx] = row;
  else profiles.push(row);
  await writeLocalJson(LOCAL_FILE, profiles);
  return merged;
}

/**
 * [Mode lokal saja] Tambah XP & counter evaluasi.
 * Di mode Supabase hal ini dikerjakan trigger database (lihat supabase/schema.sql).
 */
export async function applyLocalStats(
  userId: string,
  delta: { xp?: number; evaluations?: number }
): Promise<{ totalXP: number; rankLevel: RankLevel }> {
  const profiles = await readLocalJson<ProfileRow>(LOCAL_FILE);
  const idx = profiles.findIndex((p) => p.id === userId);
  const current = idx !== -1 ? rowToUser(profiles[idx]) : defaultUser(userId);

  const totalXP = Math.max(0, current.totalXP + (delta.xp || 0));
  const rankLevel = getRankForXP(totalXP).key;
  const row = userToLocalRow({
    ...current,
    totalXP,
    rankLevel,
    evaluationsCount: current.evaluationsCount + (delta.evaluations || 0),
  });

  if (idx !== -1) profiles[idx] = row;
  else profiles.push(row);
  await writeLocalJson(LOCAL_FILE, profiles);
  return { totalXP, rankLevel };
}
