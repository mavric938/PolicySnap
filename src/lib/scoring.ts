import type { EvaluationScores } from '@/types';

/** Rata-rata 4 dimensi (Efektivitas, Efisiensi, Keadilan, Responsivitas). */
export function averageScore(scores: EvaluationScores): number {
  return (scores.effectiveness + scores.efficiency + scores.equity + scores.responsiveness) / 4;
}

/** Skor komposit 1 desimal untuk ditampilkan. */
export function compositeScore(scores: EvaluationScores): number {
  return Number(averageScore(scores).toFixed(1));
}

/**
 * Verdict kelayakan kebijakan. Ambang dipakai bersama semua halaman;
 * `label` versi ringkas (konsensus/share), `detail` versi panjang (evaluasi).
 */
export function getVerdict(score: number): { label: string; detail: string } {
  if (score < 4) return { label: 'Tidak Layak', detail: 'Tidak Layak / Berisiko' };
  if (score < 6) return { label: 'Cukup Bersyarat', detail: 'Cukup Layak Bersyarat' };
  if (score < 8) return { label: 'Layak Diterapkan', detail: 'Layak Direalisasikan' };
  return { label: 'Sangat Layak', detail: 'Sangat Unggul & Matang' };
}
