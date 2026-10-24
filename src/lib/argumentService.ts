import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { readLocalJson, writeLocalJson } from './localStore';
import { Argument, CatProfile, RankLevel, User } from '@/types';
import { compareByNetVotes } from './stance';
import { getAllProfiles, getProfile, applyLocalStats, normalizeCatProfile } from './profileService';

const ARGS_FILE = 'arguments.json';
const VOTES_FILE = 'argument_votes.json';

type VoteType = 'up' | 'down';

interface StoredArgument {
  id: string;
  user_id: string;
  issue_id: string;
  stance: string;
  comment: string;
  upvotes: number;
  downvotes: number;
  net_votes: number;
  created_at: string;
}

interface StoredVote {
  id: string;
  argument_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

interface SupabaseArgumentRow extends StoredArgument {
  profiles: { name?: string; avatar?: string; rank_level?: string; cat_avatar?: unknown } | null;
}

function toArgument(
  arg: StoredArgument,
  author: { name?: string; avatar?: string; rankLevel?: string; catAvatar?: CatProfile },
  userVote: VoteType | null
): Argument {
  return {
    id: arg.id,
    userId: arg.user_id,
    userName: author.name || 'Warga Publik',
    userAvatar: author.avatar || '',
    userRank: (author.rankLevel || 'warga-aktif') as RankLevel,
    userCatAvatar: author.catAvatar,
    issueId: arg.issue_id,
    stance: arg.stance,
    comment: arg.comment,
    upvotes: arg.upvotes,
    downvotes: arg.downvotes,
    userVote,
    submittedAt: (arg.created_at || new Date().toISOString()).split('T')[0],
  };
}

/**
 * Get arguments for an issue, sorted by net votes descending
 */
export async function getArgumentsByIssue(issueId: string, currentUserId: string | null): Promise<Argument[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data: args, error } = await supabase
      .from('arguments')
      .select('*, profiles(name, avatar, rank_level, cat_avatar)')
      .eq('issue_id', issueId)
      .order('net_votes', { ascending: false });
    if (error) throw error;

    let voteMap = new Map<string, VoteType>();
    if (currentUserId && args?.length) {
      const { data: userVotes, error: votesErr } = await supabase
        .from('argument_votes')
        .select('argument_id, vote_type')
        .eq('user_id', currentUserId)
        .in('argument_id', args.map((a) => a.id));
      if (votesErr) throw votesErr;
      voteMap = new Map((userVotes || []).map((v) => [v.argument_id, v.vote_type as VoteType]));
    }

    return ((args || []) as SupabaseArgumentRow[]).map((arg) =>
      toArgument(
        arg,
        {
          name: arg.profiles?.name,
          avatar: arg.profiles?.avatar,
          rankLevel: arg.profiles?.rank_level,
          catAvatar: arg.profiles?.cat_avatar ? normalizeCatProfile(arg.profiles.cat_avatar) : undefined,
        },
        voteMap.get(arg.id) || null
      )
    );
  }

  // Mode lokal: ambil semua profil sekali (hindari N+1 getProfile per argumen)
  const [rawArgs, rawVotes, profiles] = await Promise.all([
    readLocalJson<StoredArgument>(ARGS_FILE),
    readLocalJson<StoredVote>(VOTES_FILE),
    getAllProfiles(),
  ]);
  const profileMap = new Map<string, User>(profiles.map((p) => [p.id, p]));
  const voteMap = new Map(
    rawVotes.filter((v) => v.user_id === currentUserId).map((v) => [v.argument_id, v.vote_type])
  );

  return rawArgs
    .filter((a) => a.issue_id === issueId)
    .map((a) => toArgument(a, profileMap.get(a.user_id) || {}, voteMap.get(a.id) || null))
    .sort(compareByNetVotes);
}

/**
 * Cast or toggle an upvote/downvote on an argument (FR-4 & US-005)
 */
export async function voteArgument(params: {
  argumentId: string;
  userId: string;
  voteType: VoteType;
}): Promise<{
  success: boolean;
  userVote: VoteType | null;
  upvotes: number;
  downvotes: number;
  authorXPGained?: number;
}> {
  const { argumentId, userId, voteType } = params;

  // ===== Supabase: hitungan vote & XP penulis disinkronkan trigger =====
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();

    const { data: existing, error: findErr } = await supabase
      .from('argument_votes')
      .select('id, vote_type')
      .eq('argument_id', argumentId)
      .eq('user_id', userId)
      .maybeSingle();
    if (findErr) throw findErr;

    let nextUserVote: VoteType | null = voteType;
    if (existing && existing.vote_type === voteType) {
      const { error } = await supabase.from('argument_votes').delete().eq('id', existing.id);
      if (error) throw error;
      nextUserVote = null;
    } else if (existing) {
      const { error } = await supabase.from('argument_votes').update({ vote_type: voteType }).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('argument_votes')
        .insert({ argument_id: argumentId, user_id: userId, vote_type: voteType });
      if (error) throw error;
    }

    const { data: updatedArg, error: argErr } = await supabase
      .from('arguments')
      .select('upvotes, downvotes')
      .eq('id', argumentId)
      .single();
    if (argErr) throw argErr;

    return {
      success: true,
      userVote: nextUserVote,
      upvotes: updatedArg.upvotes,
      downvotes: updatedArg.downvotes,
    };
  }

  // ===== Mode lokal (development) =====
  const [args, votes] = await Promise.all([readLocalJson<StoredArgument>(ARGS_FILE), readLocalJson<StoredVote>(VOTES_FILE)]);
  const targetArg = args.find((a) => a.id === argumentId);
  if (!targetArg) {
    throw new Error('Argumen tidak ditemukan');
  }

  const voteIdx = votes.findIndex((v) => v.argument_id === argumentId && v.user_id === userId);
  let nextUserVote: VoteType | null = voteType;
  let xpDelta = 0;

  if (voteIdx !== -1) {
    const existing = votes[voteIdx];
    if (existing.vote_type === voteType) {
      // Toggle off / cancel vote
      votes.splice(voteIdx, 1);
      nextUserVote = null;
      if (voteType === 'up') {
        targetArg.upvotes = Math.max(0, targetArg.upvotes - 1);
        xpDelta = -1;
      } else {
        targetArg.downvotes = Math.max(0, targetArg.downvotes - 1);
      }
    } else {
      // Switch vote (e.g. from down to up)
      if (existing.vote_type === 'up') {
        targetArg.upvotes = Math.max(0, targetArg.upvotes - 1);
        xpDelta -= 1;
      } else {
        targetArg.downvotes = Math.max(0, targetArg.downvotes - 1);
      }

      if (voteType === 'up') {
        targetArg.upvotes += 1;
        xpDelta += 1;
      } else {
        targetArg.downvotes += 1;
      }
      votes[voteIdx].vote_type = voteType;
    }
  } else {
    votes.push({
      id: `vote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      argument_id: argumentId,
      user_id: userId,
      vote_type: voteType,
      created_at: new Date().toISOString(),
    });
    if (voteType === 'up') {
      targetArg.upvotes += 1;
      xpDelta = 1; // +1 XP per upvote reward!
    } else {
      targetArg.downvotes += 1;
    }
  }

  targetArg.net_votes = targetArg.upvotes - targetArg.downvotes;

  await writeLocalJson(ARGS_FILE, args);
  await writeLocalJson(VOTES_FILE, votes);

  // XP hanya untuk penulis, dan tidak dari vote dirinya sendiri
  if (xpDelta !== 0 && targetArg.user_id !== userId) {
    await applyLocalStats(targetArg.user_id, { xp: xpDelta });
  }

  return {
    success: true,
    userVote: nextUserVote,
    upvotes: targetArg.upvotes,
    downvotes: targetArg.downvotes,
    authorXPGained: xpDelta > 0 ? xpDelta : 0,
  };
}

/**
 * Create a new public argument (dengan self-upvote otomatis)
 */
export async function createArgument(data: {
  userId: string;
  issueId: string;
  stance: string;
  comment: string;
}): Promise<Argument> {
  const author = await getProfile(data.userId);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data: inserted, error } = await supabase
      .from('arguments')
      .insert({
        user_id: data.userId,
        issue_id: data.issueId,
        stance: data.stance,
        comment: data.comment,
        upvotes: 0,
        downvotes: 0,
        net_votes: 0,
      })
      .select()
      .single();
    if (error) throw error;

    // Self-upvote; trigger menghitung ulang upvotes menjadi 1 (tanpa XP untuk diri sendiri)
    const { error: voteErr } = await supabase
      .from('argument_votes')
      .insert({ argument_id: inserted.id, user_id: data.userId, vote_type: 'up' });
    if (voteErr) throw voteErr;

    return toArgument({ ...inserted, upvotes: 1, net_votes: 1 }, author, 'up');
  }

  const [args, votes] = await Promise.all([readLocalJson<StoredArgument>(ARGS_FILE), readLocalJson<StoredVote>(VOTES_FILE)]);
  const now = new Date().toISOString();
  const newArg: StoredArgument = {
    id: `arg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: data.userId,
    issue_id: data.issueId,
    stance: data.stance,
    comment: data.comment,
    upvotes: 1,
    downvotes: 0,
    net_votes: 1,
    created_at: now,
  };

  args.unshift(newArg);
  votes.push({
    id: `vote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    argument_id: newArg.id,
    user_id: data.userId,
    vote_type: 'up',
    created_at: now,
  });

  await writeLocalJson(ARGS_FILE, args);
  await writeLocalJson(VOTES_FILE, votes);

  return toArgument(newArg, author, 'up');
}
