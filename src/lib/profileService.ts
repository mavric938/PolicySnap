import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { User, CatProfile } from '@/types';
import { getRankForXP } from '@/data/mock';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'profiles.json');

async function readLocalProfiles(): Promise<User[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalProfiles(profiles: User[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
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
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            avatar: data.avatar || '',
            totalXP: data.total_xp,
            rankLevel: data.rank_level,
            evaluationsCount: data.evaluations_count,
            catAvatar: data.cat_avatar,
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
      rankLevel: (found as any).rank_level ?? found.rankLevel ?? 'warga-aktif',
      evaluationsCount: (found as any).evaluations_count ?? found.evaluationsCount ?? 0,
      catAvatar: (found as any).cat_avatar ?? found.catAvatar,
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
    joinedAt: '2026-10-12',
  };
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
