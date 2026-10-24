'use client';

import { useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

/**
 * State toast bersama untuk semua halaman.
 * Render: `{toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}`
 * (`key` baru tiap pemanggilan → toast berikutnya selalu mulai dari timer penuh).
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
}
