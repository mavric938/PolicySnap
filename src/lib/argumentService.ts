import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { Argument } from '@/types';
import { getProfile, addXP } from './profileService';

const ARGS_FILE = path.join(process.cwd(), 'src', 'data', 'arguments.json');
const VOTES_FILE = path.join(process.cwd(), 'src', 'data', 'argument_votes.json');

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
  vote_type: 'up' | 'down';
  created_at: string;
}

async function readLocalArgs(): Promise<StoredArgument[]> {
  try {
    const raw = await fs.readFile(ARGS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalArgs(data: StoredArgument[]): Promise<void> {
  try {
    await fs.writeFile(ARGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('writeLocalArgs ignored write error (normal in read-only hosting):', err);
  }
}

async function readLocalVotes(): Promise<StoredVote[]> {
  try {
    const raw = await fs.readFile(VOTES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalVotes(data: StoredVote[]): Promise<void> {
  try {
    await fs.writeFile(VOTES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('writeLocalVotes ignored write error (normal in read-only hosting):', err);
  }
}

/**
 * Get arguments for an issue, sorted by net votes descending
 */
export async function getArgumentsByIssue(
  issueId: string,
  currentUserId: string = 'user-001'
): Promise<Argument[]> {
  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: args, error } = await supabase
          .from('arguments')
          .select('*, profiles(name, avatar, rank_level, cat_avatar)')
          .eq('issue_id', issueId)
          .order('net_votes', { ascending: false });

        if (!error && args) {
          // Fetch current user votes
          const { data: userVotes } = await supabase
            .from('argument_votes')
            .select('argument_id, vote_type')
            .eq('user_id', currentUserId);

          const voteMap = new Map((userVotes || []).map((v) => [v.argument_id, v.vote_type]));

          return args.map((arg: any) => ({
            id: arg.id,
            userId: arg.user_id,
            userName: arg.profiles?.name || 'Warga Publik',
            userAvatar: arg.profiles?.avatar || '',
            userRank: arg.profiles?.rank_level || 'warga-aktif',
            userCatAvatar: arg.profiles?.cat_avatar,
            issueId: arg.issue_id,
            stance: arg.stance,
            comment: arg.comment,
            upvotes: arg.upvotes,
            downvotes: arg.downvotes,
            userVote: (voteMap.get(arg.id) as 'up' | 'down') || null,
            submittedAt: arg.created_at?.split('T')[0] || '2026-10-11',
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch arguments error, using local fallback:', err);
      }
    }
  }

  // 2. Local JSON fallback
  const rawArgs = await readLocalArgs();
  const rawVotes = await readLocalVotes();
  const filtered = rawArgs.filter((a) => a.issue_id === issueId);

  const voteMap = new Map(
    rawVotes
      .filter((v) => v.user_id === currentUserId)
      .map((v) => [v.argument_id, v.vote_type])
  );

  const enriched: Argument[] = [];
  for (const a of filtered) {
    const profile = await getProfile(a.user_id);
    enriched.push({
      id: a.id,
      userId: a.user_id,
      userName: profile.name,
      userAvatar: profile.avatar || '',
      userRank: profile.rankLevel || 'warga-aktif',
      userCatAvatar: profile.catAvatar,
      issueId: a.issue_id,
      stance: a.stance,
      comment: a.comment,
      upvotes: a.upvotes,
      downvotes: a.downvotes,
      userVote: (voteMap.get(a.id) as 'up' | 'down') || null,
      submittedAt: a.created_at?.split('T')[0] || '2026-10-11',
    });
  }

  // Sort by net votes desc
  return enriched.sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
}

/**
 * Cast or toggle an upvote/downvote on an argument (FR-4 & US-005)
 */
export async function voteArgument(params: {
  argumentId: string;
  userId: string;
  voteType: 'up' | 'down';
}): Promise<{
  success: boolean;
  userVote: 'up' | 'down' | null;
  upvotes: number;
  downvotes: number;
  authorXPGained?: number;
}> {
  const { argumentId, userId, voteType } = params;

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('argument_votes')
          .select('*')
          .eq('argument_id', argumentId)
          .eq('user_id', userId)
          .maybeSingle();

        let nextUserVote: 'up' | 'down' | null = voteType;

        if (existing) {
          if (existing.vote_type === voteType) {
            // Remove vote
            await supabase.from('argument_votes').delete().eq('id', existing.id);
            nextUserVote = null;
          } else {
            // Change vote
            await supabase
              .from('argument_votes')
              .update({ vote_type: voteType })
              .eq('id', existing.id);
            nextUserVote = voteType;
          }
        } else {
          // Insert new vote
          await supabase.from('argument_votes').insert({
            argument_id: argumentId,
            user_id: userId,
            vote_type: voteType,
          });
          nextUserVote = voteType;
        }

        // Fetch updated argument
        const { data: updatedArg } = await supabase
          .from('arguments')
          .select('upvotes, downvotes')
          .eq('id', argumentId)
          .single();

        return {
          success: true,
          userVote: nextUserVote,
          upvotes: updatedArg?.upvotes || 0,
          downvotes: updatedArg?.downvotes || 0,
        };
      } catch (err) {
        console.warn('Supabase vote failed, falling back to local:', err);
      }
    }
  }

  // 2. Local JSON fallback
  const args = await readLocalArgs();
  const votes = await readLocalVotes();
  const argIdx = args.findIndex((a) => a.id === argumentId);

  if (argIdx === -1) {
    throw new Error('Argumen tidak ditemukan');
  }

  const targetArg = args[argIdx];
  const voteIdx = votes.findIndex((v) => v.argument_id === argumentId && v.user_id === userId);
  let nextUserVote: 'up' | 'down' | null = voteType;
  let xpDelta = 0;

  if (voteIdx !== -1) {
    const existing = votes[voteIdx];
    if (existing.vote_type === voteType) {
      // Toggle off / cancel vote
      votes.splice(voteIdx, 1);
      nextUserVote = null;
      if (voteType === 'up') {
        targetArg.upvotes = Math.max(0, targetArg.upvotes - 1);
        xpDelta = -1; // remove +1 XP
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
      nextUserVote = voteType;
    }
  } else {
    // New vote
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
    nextUserVote = voteType;
  }

  targetArg.net_votes = targetArg.upvotes - targetArg.downvotes;
  args[argIdx] = targetArg;

  await writeLocalArgs(args);
  await writeLocalVotes(votes);

  // If XP delta applies to author and author is not voter
  if (xpDelta !== 0 && targetArg.user_id !== userId) {
    await addXP(targetArg.user_id, xpDelta);
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
 * Create a new public argument
 */
export async function createArgument(data: {
  userId: string;
  issueId: string;
  stance: string;
  comment: string;
}): Promise<Argument> {
  const argId = `arg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const author = await getProfile(data.userId);

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('arguments')
          .insert({
            id: argId,
            user_id: data.userId,
            issue_id: data.issueId,
            stance: data.stance,
            comment: data.comment.trim(),
            upvotes: 1,
            downvotes: 0,
            net_votes: 1,
          })
          .select()
          .single();

        if (!error && inserted) {
          // Add self-upvote
          await supabase.from('argument_votes').insert({
            argument_id: argId,
            user_id: data.userId,
            vote_type: 'up',
          });

          return {
            id: argId,
            userId: data.userId,
            userName: author.name,
            userAvatar: author.avatar || '',
            userRank: author.rankLevel || 'warga-aktif',
            userCatAvatar: author.catAvatar,
            issueId: data.issueId,
            stance: data.stance,
            comment: data.comment.trim(),
            upvotes: 1,
            downvotes: 0,
            userVote: 'up',
            submittedAt: new Date().toISOString().split('T')[0],
          };
        }
      } catch (err) {
        console.warn('Supabase create argument failed, using local fallback:', err);
      }
    }
  }

  // 2. Local JSON fallback
  const args = await readLocalArgs();
  const votes = await readLocalVotes();

  const newArg: StoredArgument = {
    id: argId,
    user_id: data.userId,
    issue_id: data.issueId,
    stance: data.stance,
    comment: data.comment.trim(),
    upvotes: 1,
    downvotes: 0,
    net_votes: 1,
    created_at: new Date().toISOString(),
  };

  args.unshift(newArg);
  votes.push({
    id: `vote-${Date.now()}`,
    argument_id: argId,
    user_id: data.userId,
    vote_type: 'up',
    created_at: new Date().toISOString(),
  });

  await writeLocalArgs(args);
  await writeLocalVotes(votes);

  return {
    id: argId,
    userId: data.userId,
    userName: author.name,
    userAvatar: author.avatar || '',
    userRank: author.rankLevel || 'warga-aktif',
    userCatAvatar: author.catAvatar,
    issueId: data.issueId,
    stance: data.stance,
    comment: data.comment.trim(),
    upvotes: 1,
    downvotes: 0,
    userVote: 'up',
    submittedAt: new Date().toISOString().split('T')[0],
  };
}
