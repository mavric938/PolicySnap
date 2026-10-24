'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * false saat SSR & render hidrasi pertama, true setelahnya di browser.
 * Dipakai untuk membaca localStorage tanpa hydration mismatch dan tanpa
 * pola `useEffect(() => setState(...))` (cascading render).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
