import { ValidationError } from '@/lib/auth/session';
import { EvaluationScores } from '@/types';

/**
 * Validasi input API sisi server. Throw ValidationError (→ HTTP 400) bila tidak valid.
 */

const SCORE_KEYS: (keyof EvaluationScores)[] = ['effectiveness', 'efficiency', 'equity', 'responsiveness'];
const ACTOR_VOTES = ['approve', 'reject', 'neutral'] as const;
export type ActorVote = (typeof ACTOR_VOTES)[number];

export function requireString(value: unknown, field: string, opts: { min?: number; max: number }): string {
  const str = typeof value === 'string' ? value.trim() : '';
  if (str.length < (opts.min ?? 1)) throw new ValidationError(`${field} wajib diisi.`);
  if (str.length > opts.max) throw new ValidationError(`${field} maksimal ${opts.max} karakter.`);
  return str;
}

export function optionalString(value: unknown, field: string, max: number): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') throw new ValidationError(`${field} harus berupa teks.`);
  const str = value.trim();
  if (str.length > max) throw new ValidationError(`${field} maksimal ${max} karakter.`);
  return str;
}

/** 4 dimensi skor, masing-masing angka 1–10 (US-003). */
export function parseScores(value: unknown): EvaluationScores {
  if (!value || typeof value !== 'object') throw new ValidationError('Skor evaluasi wajib disertakan.');
  const raw = value as Record<string, unknown>;
  const scores = {} as EvaluationScores;
  for (const key of SCORE_KEYS) {
    const n = Number(raw[key]);
    if (!Number.isFinite(n) || n < 1 || n > 10) {
      throw new ValidationError(`Skor ${key} harus angka 1–10.`);
    }
    scores[key] = n;
  }
  return scores;
}

export function parseActorVotes(value: unknown): Record<string, ActorVote> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('Format vote aktor tidak valid.');

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 20) throw new ValidationError('Terlalu banyak vote aktor.');

  const votes: Record<string, ActorVote> = {};
  for (const [actorId, vote] of entries) {
    if (actorId.length > 100 || !ACTOR_VOTES.includes(vote as ActorVote)) {
      throw new ValidationError('Format vote aktor tidak valid.');
    }
    votes[actorId] = vote as ActorVote;
  }
  return votes;
}
