import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { EvaluationScores, CommunityConsensus, PolicyIssue } from '@/types';
import { getProfile, addXP } from './profileService';
import { createArgument } from './argumentService';

const EVALS_FILE = path.join(process.cwd(), 'src', 'data', 'evaluations.json');

export interface StoredEvaluation {
  id: string;
  user_id: string;
  issue_id: string;
  scores: EvaluationScores;
  composite_score: number;
  actor_votes: Record<string, 'approve' | 'reject' | 'neutral'>;
  stance: string;
  comment: string;
  created_at: string;
}

async function readLocalEvals(): Promise<StoredEvaluation[]> {
  try {
    const raw = await fs.readFile(EVALS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalEvals(data: StoredEvaluation[]): Promise<void> {
  try {
    await fs.writeFile(EVALS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('writeLocalEvals ignored write error (normal in read-only hosting):', err);
  }
}

/**
 * Check whether user has already evaluated this issue (FR-2 & FR-3)
 */
export async function hasUserEvaluated(
  issueId: string,
  userId: string = 'user-001'
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('evaluations')
          .select('id')
          .eq('issue_id', issueId)
          .eq('user_id', userId)
          .maybeSingle();

        if (data) return true;
      } catch (err) {
        console.warn('Supabase hasEvaluated check error, using local fallback:', err);
      }
    }
  }

  const evals = await readLocalEvals();
  return evals.some((e) => e.issue_id === issueId && e.user_id === userId);
}

/**
 * Get user's own evaluation for an issue
 */
export async function getUserEvaluation(
  issueId: string,
  userId: string = 'user-001'
): Promise<StoredEvaluation | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('evaluations')
          .select('*')
          .eq('issue_id', issueId)
          .eq('user_id', userId)
          .maybeSingle();

        if (data) return data;
      } catch (err) {
        console.warn('Supabase getUserEvaluation error, using local fallback:', err);
      }
    }
  }

  const evals = await readLocalEvals();
  return evals.find((e) => e.issue_id === issueId && e.user_id === userId) || null;
}

/**
 * Submit user evaluation (+10 XP & Community Consensus Aggregation)
 */
export async function submitEvaluation(params: {
  userId: string;
  issueId: string;
  scores: EvaluationScores;
  actorVotes: Record<string, 'approve' | 'reject' | 'neutral'>;
  stance: string;
  comment?: string;
}): Promise<{
  success: boolean;
  evaluation: StoredEvaluation;
  totalXP: number;
  rankLevel: string;
  isFirstEvaluation: boolean;
}> {
  const { userId, issueId, scores, actorVotes, stance, comment = '' } = params;

  const compositeScore = Number(
    (
      (scores.effectiveness + scores.efficiency + scores.equity + scores.responsiveness) /
      4
    ).toFixed(2)
  );

  const evalId = `eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let isFirst = true;

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('evaluations')
          .select('id')
          .eq('user_id', userId)
          .eq('issue_id', issueId)
          .maybeSingle();

        if (existing) {
          isFirst = false;
          await supabase
            .from('evaluations')
            .update({
              scores,
              composite_score: compositeScore,
              actor_votes: actorVotes,
              stance,
              comment: comment.trim(),
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('evaluations').insert({
            id: evalId,
            user_id: userId,
            issue_id: issueId,
            scores,
            composite_score: compositeScore,
            actor_votes: actorVotes,
            stance,
            comment: comment.trim(),
          });
        }

        // Fetch updated profile
        const profile = await getProfile(userId);
        return {
          success: true,
          evaluation: {
            id: evalId,
            user_id: userId,
            issue_id: issueId,
            scores,
            composite_score: compositeScore,
            actor_votes: actorVotes,
            stance,
            comment: comment.trim(),
            created_at: new Date().toISOString(),
          },
          totalXP: profile.totalXP,
          rankLevel: profile.rankLevel,
          isFirstEvaluation: isFirst,
        };
      } catch (err) {
        console.warn('Supabase submitEvaluation failed, using local fallback:', err);
      }
    }
  }

  // 2. Local JSON fallback
  const evals = await readLocalEvals();
  const existingIdx = evals.findIndex((e) => e.user_id === userId && e.issue_id === issueId);

  const newEval: StoredEvaluation = {
    id: evalId,
    user_id: userId,
    issue_id: issueId,
    scores,
    composite_score: compositeScore,
    actor_votes: actorVotes,
    stance,
    comment: comment.trim(),
    created_at: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    isFirst = false;
    evals[existingIdx] = newEval;
  } else {
    evals.push(newEval);
  }
  await writeLocalEvals(evals);

  // Award +10 XP if first evaluation
  let xpResult = { totalXP: 85, rankLevel: 'netizen-kritis' };
  if (isFirst) {
    xpResult = await addXP(userId, 10);
  } else {
    const p = await getProfile(userId);
    xpResult = { totalXP: p.totalXP, rankLevel: p.rankLevel };
  }

  // If user provided a comment, add to arguments
  if (comment.trim()) {
    try {
      await createArgument({
        userId,
        issueId,
        stance,
        comment: comment.trim(),
      });
    } catch (argErr) {
      console.warn('Auto create argument warning:', argErr);
    }
  }

  // Increment total evaluations on issue
  const ISSUES_FILE = path.join(process.cwd(), 'src', 'data', 'issues.json');
  try {
    const raw = await fs.readFile(ISSUES_FILE, 'utf-8');
    const issuesList = JSON.parse(raw);
    const targetIdx = issuesList.findIndex((i: any) => i.id === issueId);
    if (targetIdx !== -1) {
      issuesList[targetIdx].totalEvaluations = (issuesList[targetIdx].totalEvaluations || 0) + 1;
      await fs.writeFile(ISSUES_FILE, JSON.stringify(issuesList, null, 2), 'utf-8');
    }
  } catch (issueErr) {
    console.warn('Increment issue totalEvaluations error:', issueErr);
  }

  return {
    success: true,
    evaluation: newEval,
    totalXP: xpResult.totalXP,
    rankLevel: xpResult.rankLevel,
    isFirstEvaluation: isFirst,
  };
}

/**
 * Calculate dynamic Community Consensus (Radar Chart averages, Winner/Loser bar, Actor swipes)
 */
export async function getConsensusData(
  issueId: string,
  userId: string = 'user-001'
): Promise<CommunityConsensus & { hasEvaluated: boolean; userScores?: EvaluationScores }> {
  let evals: StoredEvaluation[] = [];

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('issue_id', issueId);

        if (!error && data) {
          evals = data;
        }
      } catch (err) {
        console.warn('Supabase fetch consensus evaluations error:', err);
      }
    }
  }

  if (evals.length === 0) {
    evals = (await readLocalEvals()).filter((e) => e.issue_id === issueId);
  }

  const userEval = evals.find((e) => e.user_id === userId);
  const hasEvaluated = Boolean(userEval);

  // If no evals yet, provide default benchmark
  if (evals.length === 0) {
    return {
      issueId,
      totalVoters: 0,
      totalParticipants: 0,
      avgEffectiveness: 7.0,
      avgEfficiency: 6.0,
      avgEquity: 5.0,
      avgResponsiveness: 6.5,
      scores: {
        effectiveness: 7.0,
        efficiency: 6.0,
        equity: 5.0,
        responsiveness: 6.5,
      },
      winnerStance: 'Dukung Bersyarat',
      winnerPercentage: 65,
      loserPercentage: 35,
      actorConsensus: [],
      hasEvaluated,
      userScores: userEval?.scores,
    };
  }

  // Calculate Averages for the 4 dimensions
  const sumScores = evals.reduce(
    (acc, curr) => ({
      effectiveness: acc.effectiveness + curr.scores.effectiveness,
      efficiency: acc.efficiency + curr.scores.efficiency,
      equity: acc.equity + curr.scores.equity,
      responsiveness: acc.responsiveness + curr.scores.responsiveness,
    }),
    { effectiveness: 0, efficiency: 0, equity: 0, responsiveness: 0 }
  );

  const count = evals.length;
  const avgScores: EvaluationScores = {
    effectiveness: Number((sumScores.effectiveness / count).toFixed(1)),
    efficiency: Number((sumScores.efficiency / count).toFixed(1)),
    equity: Number((sumScores.equity / count).toFixed(1)),
    responsiveness: Number((sumScores.responsiveness / count).toFixed(1)),
  };

  // Calculate stance distribution
  const stanceCounts: Record<string, number> = {};
  for (const e of evals) {
    stanceCounts[e.stance] = (stanceCounts[e.stance] || 0) + 1;
  }

  let winnerStance = 'Dukung Bersyarat';
  let maxStanceCount = 0;
  for (const [st, num] of Object.entries(stanceCounts)) {
    if (num > maxStanceCount) {
      maxStanceCount = num;
      winnerStance = st;
    }
  }
  const winnerPercentage = Math.round((maxStanceCount / count) * 100);

  // Calculate actor consensus (approve / reject / neutral)
  const actorVoteCounts: Record<string, { approve: number; reject: number; neutral: number }> = {};
  for (const e of evals) {
    if (e.actor_votes) {
      for (const [actorId, vote] of Object.entries(e.actor_votes)) {
        if (!actorVoteCounts[actorId]) {
          actorVoteCounts[actorId] = { approve: 0, reject: 0, neutral: 0 };
        }
        if (vote === 'approve' || vote === 'reject' || vote === 'neutral') {
          actorVoteCounts[actorId][vote] += 1;
        }
      }
    }
  }

  const actorConsensus = Object.entries(actorVoteCounts).map(([actorId, votes]) => {
    const totalVotes = votes.approve + votes.reject + votes.neutral;
    const approvalRate = totalVotes > 0 ? Math.round((votes.approve / totalVotes) * 100) : 50;
    return {
      actorId,
      actorName: actorId,
      approvalRate,
      consensusLabel: approvalRate >= 60 ? 'Didukung' : approvalRate <= 40 ? 'Ditolak' : 'Netral',
    };
  });

  return {
    issueId,
    totalVoters: count,
    totalParticipants: count,
    avgEffectiveness: avgScores.effectiveness,
    avgEfficiency: avgScores.efficiency,
    avgEquity: avgScores.equity,
    avgResponsiveness: avgScores.responsiveness,
    scores: avgScores,
    winnerStance,
    winnerPercentage,
    loserPercentage: 100 - winnerPercentage,
    actorConsensus,
    hasEvaluated,
    userScores: userEval?.scores,
  };
}
