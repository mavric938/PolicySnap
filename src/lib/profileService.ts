import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { User, CatProfile } from '@/types';
import { getRankForXP } from '@/data/mock';
import { DEFAULT_CAT_PROFILE } from '@/data/catCostumes';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'profiles.json');

export function normalizeCatProfile(raw: any): CatProfile {
  if (!raw) return DEFAULT_CAT_PROFILE;
  return {
    name: raw.name || raw.catName || 'Kucing Warga',
    gender: raw.gender === 'girl' || raw.gender === 'female' ? 'female' : 'male',
    breed: raw.breed === 'persian-fluffy' || raw.breed === 'persia' ? 'persia' : raw.breed === 'siamese-sleek' || raw.breed === 'siam' ? 'siam' : 'domestik',
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

async function readLocalProfiles(): Promise<User[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalProfiles(profiles: User[]): Promise<void> {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
  } catch (err) {
    console.warn('writeLocalProfiles ignored write error (normal in read-only hosting):', err);
  }
}

/**
 * Get profile for user ID
 */
export async function getProfile(userId: string = 'user-001'): Promise<User> {
  // 1. Try Supabase if configured
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          // Fetch real upvotes from arguments table
          const { data: userArgs } = await supabase.from('arguments').select('upvotes').eq('user_id', userId);
          const authorUpvotes = userArgs?.reduce((acc: number, cur: any) => acc + (cur.upvotes || 0), 0) || 0;

          // Fetch upvotes cast by user
          const { count: castCount } = await supabase.from('argument_votes').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('vote_type', 'up');

          const totalUpvotes = (data.upvotes_count || 0) + authorUpvotes + (castCount || 0);

          return {
            id: data.id,
            name: data.name,
            email: data.email || '',
            avatar: data.avatar || '',
            totalXP: data.total_xp,
            rankLevel: data.rank_level || getRankForXP(data.total_xp).key,
            evaluationsCount: data.evaluations_count,
            upvotesCount: totalUpvotes,
            catAvatar: normalizeCatProfile(data.cat_avatar),
            joinedAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Supabase fetch profile error, using local fallback:', err);
      }
    }
  }

  // 2. Local JSON fallback
  const profiles = await readLocalProfiles();
  const found = profiles.find((p) => p.id === userId);
  if (found) {
    return {
      ...found,
      totalXP: (found as any).total_xp ?? found.totalXP ?? 0,
      rankLevel: (found as any).rank_level ?? found.rankLevel ?? getRankForXP((found as any).total_xp ?? found.totalXP ?? 0).key,
      evaluationsCount: (found as any).evaluations_count ?? found.evaluationsCount ?? 0,
      upvotesCount: (found as any).upvotes_count ?? (found as any).upvotesCount ?? 0,
      catAvatar: normalizeCatProfile((found as any).cat_avatar ?? found.catAvatar),
    };
  }

  // Default fallback user
  return {
    id: userId,
    name: 'Warga Baru',
    email: 'warga@policysnap.id',
    avatar: '',
    totalXP: 0,
    rankLevel: 'warga-aktif',
    evaluationsCount: 0,
    upvotesCount: 0,
    joinedAt: '2026-10-12',
    catAvatar: DEFAULT_CAT_PROFILE,
  };
}

/**
 * Get all profiles for the citizen leaderboard (live from Supabase cloud database)
 */
export async function getAllProfiles(): Promise<User[]> {
  // 1. Try Supabase cloud database
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('total_xp', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          // Fetch upvotes from arguments table
          const { data: argsData } = await supabase.from('arguments').select('user_id, upvotes');
          const upvotesByAuthor: Record<string, number> = {};
          if (argsData) {
            argsData.forEach((a: any) => {
              upvotesByAuthor[a.user_id] = (upvotesByAuthor[a.user_id] || 0) + (a.upvotes || 0);
            });
          }

          // Fetch upvotes cast by users
          const { data: votesData } = await supabase.from('argument_votes').select('user_id').eq('vote_type', 'up');
          const upvotesCast: Record<string, number> = {};
          if (votesData) {
            votesData.forEach((v: any) => {
              upvotesCast[v.user_id] = (upvotesCast[v.user_id] || 0) + 1;
            });
          }

          return data.map((row: any) => {
            const authorUpvotes = upvotesByAuthor[row.id] || 0;
            const castUpvotes = upvotesCast[row.id] || 0;
            const totalUpvotes = (row.upvotes_count || 0) + authorUpvotes + castUpvotes;

            return {
              id: row.id,
              name: row.name || 'Warga Publik',
              email: row.email || '',
              avatar: row.avatar || '',
              totalXP: row.total_xp || 0,
              rankLevel: row.rank_level || getRankForXP(row.total_xp || 0).key,
              evaluationsCount: row.evaluations_count || 0,
              upvotesCount: totalUpvotes,
              catAvatar: normalizeCatProfile(row.cat_avatar),
              joinedAt: row.created_at || '2026-10-12',
            };
          }).sort((a, b) => b.totalXP - a.totalXP);
        }
      } catch (err) {
        console.warn('Supabase fetch all profiles error, using local fallback:', err);
      }
    }
  }

  // 2. Local fallback
  const list = await readLocalProfiles();
  const mapped = list.map((p) => ({
    ...p,
    totalXP: (p as any).total_xp ?? p.totalXP ?? 0,
    rankLevel: (p as any).rank_level ?? p.rankLevel ?? getRankForXP((p as any).total_xp ?? p.totalXP ?? 0).key,
    evaluationsCount: (p as any).evaluations_count ?? p.evaluationsCount ?? 0,
    upvotesCount: (p as any).upvotes_count ?? (p as any).upvotesCount ?? 0,
    catAvatar: normalizeCatProfile((p as any).cat_avatar ?? p.catAvatar),
  }));

  return mapped.sort((a, b) => b.totalXP - a.totalXP);
}

/**
 * Update user profile & cat avatar customization
 */
export async function updateProfile(
  userId: string,
  updates: {
    name?: string;
    avatar?: string;
    catAvatar?: CatProfile;
    totalXP?: number;
    evaluationsCount?: number;
    upvotesCount?: number;
  }
): Promise<{ success: boolean; profile?: User; error?: string }> {
  const current = await getProfile(userId);
  const newXP = updates.totalXP !== undefined ? updates.totalXP : current.totalXP;
  const newRank = getRankForXP(newXP).key;

  const merged: User = {
    ...current,
    name: updates.name || current.name,
    avatar: updates.avatar !== undefined ? updates.avatar : current.avatar,
    totalXP: newXP,
    rankLevel: newRank,
    evaluationsCount: updates.evaluationsCount !== undefined ? updates.evaluationsCount : current.evaluationsCount,
    upvotesCount: updates.upvotesCount !== undefined ? updates.upvotesCount : current.upvotesCount,
    catAvatar: updates.catAvatar || current.catAvatar,
  };

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: userId,
          name: merged.name,
          avatar: merged.avatar,
          total_xp: merged.totalXP,
          rank_level: merged.rankLevel,
          evaluations_count: merged.evaluationsCount,
          upvotes_count: merged.upvotesCount,
          cat_avatar: merged.catAvatar,
          updated_at: new Date().toISOString(),
        });

        if (!error) {
          return { success: true, profile: merged };
        }
      } catch (err: unknown) {
        console.warn('Supabase profile update failed, syncing locally:', err);
      }
    }
  }

  // 2. Local JSON update
  const profiles = await readLocalProfiles();
  const idx = profiles.findIndex((p) => p.id === userId);
  const updatedItem = {
    id: merged.id,
    name: merged.name,
    email: merged.email,
    avatar: merged.avatar,
    total_xp: merged.totalXP,
    rank_level: merged.rankLevel,
    evaluations_count: merged.evaluationsCount,
    upvotes_count: merged.upvotesCount,
    cat_avatar: merged.catAvatar,
    created_at: merged.joinedAt,
  } as unknown as User;

  if (idx !== -1) {
    profiles[idx] = updatedItem;
  } else {
    profiles.push(updatedItem);
  }
  await writeLocalProfiles(profiles);

  return { success: true, profile: merged };
}

/**
 * Add XP to user and update their rank automatically
 */
export async function addXP(
  userId: string,
  delta: number
): Promise<{ success: boolean; totalXP: number; rankLevel: string }> {
  const profile = await getProfile(userId);
  const updatedXP = Math.max(0, profile.totalXP + delta);
  const updatedRank = getRankForXP(updatedXP).key;

  await updateProfile(userId, { totalXP: updatedXP });
  return { success: true, totalXP: updatedXP, rankLevel: updatedRank };
}
