import type { EvaluationScores } from '@/types';

/** Evaluasi milik user yang tersimpan di cache localStorage (riwayat Studio Evaluasi). */
export interface LocalEvaluation {
  evaluated: boolean;
  scores?: EvaluationScores;
  stance?: string;
  comment?: string;
  timestamp?: string;
}

/** Baca cache evaluasi lokal untuk satu isu. Panggil hanya di browser. */
export function readLocalEvaluation(issueId: string): LocalEvaluation {
  const saved = localStorage.getItem(`policysnap_eval_${issueId}`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        evaluated: true,
        scores: parsed.scores,
        stance: parsed.stance,
        comment: parsed.comment,
        timestamp: parsed.timestamp,
      };
    } catch {
      return { evaluated: true };
    }
  }

  if (localStorage.getItem(`evaluated_${issueId}`) === 'true') return { evaluated: true };

  try {
    const history = JSON.parse(localStorage.getItem('policysnap_evaluation_history') || '[]');
    const match = Array.isArray(history)
      ? history.find((h: { issueId?: string }) => h.issueId === issueId)
      : undefined;
    if (match) return { evaluated: true, scores: match.scores, stance: match.stance };
  } catch {
    // riwayat rusak → anggap belum ada
  }

  return { evaluated: false };
}
