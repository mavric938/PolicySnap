'use client';

import { useEffect, useRef } from 'react';

/** Panggil `onEscape` saat tombol Esc ditekan selama `active` (dipakai modal/dialog). */
export function useEscapeKey(onEscape: () => void, active = true) {
  const handlerRef = useRef(onEscape);
  useEffect(() => {
    handlerRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handlerRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);
}
