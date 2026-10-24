import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { readLocalJson, writeLocalJson } from './localStore';
import { EvaluationScores, CommunityConsensus, PolicyIssue, RankLevel } from '@/types';
import { getProfile, applyLocalStats } from './profileService';
import { createArgument } from './argumentService';
import type { ActorVote } from './validation';

const EVALS_FILE = 'evaluations.json';
const ISSUES_FILE = 'issues.json';

export interface StoredEvaluation {
  id: string;
  user_id: string;
  issue_id: string;
  scores: EvaluationScores;
  composite_score: number;
  actor_votes: Record<string, ActorVote>;
  stance: string;
  comment: string;
  created_at: string;
}

/**
 * Get user's own evaluation for an issue (null bila belum menilai)
 */
export async function getUserEvaluation(issueId: string, userId: string): Promise<StoredEvaluation | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseClient()
      .from('evaluations')
      .select('*')
      .eq('issue_id', issueId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  const evals = await readLocalJson<StoredEvaluation>(EVALS_FILE);
  return evals.find((e) => e.issue_id === issueId && e.user_id === userId) || null;
}

/**
 * Check whether user has already evaluated this issue (FR-2 & FR-3)
 */
export async function hasUserEvaluated(issueId: string, userId: string): Promise<boolean> {
  return (await getUserEvaluation(issueId, userId)) !== null;
}

/**
 * Submit user evaluation (+10 XP & Community Consensus Aggregation).
 * Penilaian ulang memperbarui evaluasi lama tanpa menambah XP/counter lagi.
 */
export async function submitEvaluation(params: {
  userId: string;
  issueId: string;
  scores: EvaluationScores;
  actorVotes: Record<string, ActorVote>;
  stance: string;
  comment: string;
}): Promise<{
  success: boolean;
  evaluation: StoredEvaluation;
  totalXP: number;
  rankLevel: RankLevel;
  isFirstEvaluation: boolean;
}> {
  const { userId, issueId, scores, actorVotes, stance, comment } = params;

  const compositeScore = Number(
    ((scores.effectiveness + scores.efficiency + scores.equity + scores.responsiveness) / 4).toFixed(2)
  );

  const fields = {
    scores,
    composite_score: compositeScore,
    actor_votes: actorVotes,
    stance,
    comment,
  };

  // ===== Supabase: XP, counter isu, dan argumen otomatis ditangani trigger (schema.sql) =====
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const existing = await getUserEvaluation(issueId, userId);

    let saved: StoredEvaluation;
    if (existing) {
      const { data, error } = await supabase
        .from('evaluations')
        .update(fields)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      const { data, error } = await supabase
        .from('evaluations')
        .insert({ user_id: userId, issue_id: issueId, ...fields })
        .select()
        .single();
      if (error) throw error;
      saved = data;
    }

    const profile = await getProfile(userId);
    return {
      success: true,
      evaluation: saved,
      totalXP: profile.totalXP,
      rankLevel: profile.rankLevel,
      isFirstEvaluation: !existing,
    };
  }

  // ===== Mode lokal (development): meniru perilaku trigger Supabase =====
  const evals = await readLocalJson<StoredEvaluation>(EVALS_FILE);
  const existingIdx = evals.findIndex((e) => e.user_id === userId && e.issue_id === issueId);
  const isFirst = existingIdx === -1;

  const evaluation: StoredEvaluation = {
    id: isFirst ? `eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : evals[existingIdx].id,
    user_id: userId,
    issue_id: issueId,
    ...fields,
    created_at: isFirst ? new Date().toISOString() : evals[existingIdx].created_at,
  };

  if (isFirst) evals.push(evaluation);
  else evals[existingIdx] = evaluation;
  await writeLocalJson(EVALS_FILE, evals);

  if (!isFirst) {
    const profile = await getProfile(userId);
    return { success: true, evaluation, totalXP: profile.totalXP, rankLevel: profile.rankLevel, isFirstEvaluation: false };
  }

  const xpResult = await applyLocalStats(userId, { xp: 10, evaluations: 1 });

  if (comment) {
    await createArgument({ userId, issueId, stance, comment });
  }

  const issues = await readLocalJson<PolicyIssue>(ISSUES_FILE);
  const target = issues.find((i) => i.id === issueId);
  if (target) {
    target.totalEvaluations = (target.totalEvaluations || 0) + 1;
    await writeLocalJson(ISSUES_FILE, issues);
  }

  return {
    success: true,
    evaluation,
    totalXP: xpResult.totalXP,
    rankLevel: xpResult.rankLevel,
    isFirstEvaluation: true,
  };
}

/**
 * Calculate dynamic Community Consensus (Radar Chart averages, Winner/Loser bar, Actor swipes)
 */
export async function getConsensusData(
  issueId: string,
  userId: string | null
): Promise<CommunityConsensus & { hasEvaluated: boolean; userScores?: EvaluationScores }> {
  let evals: StoredEvaluation[];

  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseClient().from('evaluations').select('*').eq('issue_id', issueId);
    if (error) throw error;
    evals = data || [];
  } else {
    evals = (await readLocalJson<StoredEvaluation>(EVALS_FILE)).filter((e) => e.issue_id === issueId);
  }

  const userEval = userId ? evals.find((e) => e.user_id === userId) : undefined;
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
  const actorVoteCounts: Record<string, Record<ActorVote, number>> = {};
  for (const e of evals) {
    for (const [actorId, vote] of Object.entries(e.actor_votes || {})) {
      if (!actorVoteCounts[actorId]) {
        actorVoteCounts[actorId] = { approve: 0, reject: 0, neutral: 0 };
      }
      if (vote === 'approve' || vote === 'reject' || vote === 'neutral') {
        actorVoteCounts[actorId][vote] += 1;
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
