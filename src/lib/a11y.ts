import type { KeyboardEvent } from 'react';

/**
 * Props untuk elemen non-<button> yang bisa diklik (kartu pilihan, kartu isu, dll.)
 * agar juga bisa difokus & diaktifkan dengan keyboard (Enter/Spasi) dan dikenali screen reader.
 *
 *   <div {...pressable(() => setGender('male'), { pressed: gender === 'male' })}>…</div>
 */
export function pressable(onActivate: () => void, opts: { pressed?: boolean; label?: string } = {}) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-pressed': opts.pressed,
    'aria-label': opts.label,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.target !== e.currentTarget) return; // biarkan tombol/anak elemen menangani tombolnya sendiri
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  };
}
