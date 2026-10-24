'use client';

import { useEffect, useRef, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Simpan onClose terbaru di ref: induk biasanya mengirim arrow function baru tiap render,
  // yang dulu me-reset timer sehingga toast tidak pernah hilang saat pengguna berinteraksi.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      closeTimer = setTimeout(() => onCloseRef.current(), 300);
    }, duration);
    return () => {
      clearTimeout(hideTimer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [duration, message]);

  const colors = {
    success: 'var(--success-500)',
    error: 'var(--danger-500)',
    info: 'var(--primary-500)',
  };

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      style={{
        position: 'fixed',
        bottom: 90,
        left: '50%',
        transform: `translateX(-50%) translateY(${isVisible ? 0 : 20}px)`,
        opacity: isVisible ? 1 : 0,
        background: 'var(--bg-elevated)',
        border: `1px solid ${colors[type]}`,
        borderRadius: 'var(--radius-full)',
        padding: '10px 20px',
        color: 'var(--text-primary)',
        fontSize: '0.875rem',
        fontWeight: 500,
        zIndex: 1000,
        transition: 'all 0.3s ease',
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 10px ${colors[type]}33`,
        maxWidth: 'calc(100% - 32px)',
        textAlign: 'center',
      }}
    >
      {type === 'success' && '✓ '}
      {type === 'error' && '✕ '}
      {message}
    </div>
  );
}
