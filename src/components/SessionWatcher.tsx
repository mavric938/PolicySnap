'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Ambang batas ketidakaktifan: 5 menit (300.000 ms)
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const STORAGE_KEY_LAST_ACTIVE = 'policysnap_session_last_active';

/**
 * SessionWatcher memantau status aplikasi (minimize, background, atau tidak dibuka lama).
 * Jika aplikasi ditinggalkan atau diminimize selama >= 5 menit, saat dibuka kembali
 * pengguna akan diarahkan ke halaman Beranda (/home) alih-alih melanjutkan sesi lama.
 */
export default function SessionWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const lastPathnameRef = useRef(pathname);

  useEffect(() => {
    lastPathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Catat waktu aktif saat ini
    const recordActive = () => {
      try {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, String(Date.now()));
      } catch {
        // ignore storage errors
      }
    };

    // Periksa apakah waktu tidak aktif telah melebihi 5 menit
    const checkSessionExpiry = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
        if (!stored) {
          recordActive();
          return;
        }

        const lastActive = Number(stored);
        const elapsed = Date.now() - lastActive;

        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          const currentPath = lastPathnameRef.current;
          // Jangan redirect jika sudah di landing page (/) atau beranda (/home) atau admin
          if (
            currentPath &&
            currentPath !== '/' &&
            currentPath !== '/home' &&
            !currentPath.startsWith('/admin')
          ) {
            recordActive();
            router.push('/home');
            return;
          }
        }

        recordActive();
      } catch (err) {
        console.warn('Session check warning:', err);
      }
    };

    // 1. Periksa saat komponen dimuat (aplikasi dibuka kembali dari browser tertutup)
    checkSessionExpiry();

    // 2. Pantau event visibilitychange (aplikasi diminimize, pindah tab, layar dikunci)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Aplikasi dibuka kembali / un-minimize
        checkSessionExpiry();
      } else {
        // Aplikasi diminimize atau masuk ke background
        recordActive();
      }
    };

    // 3. Pantau focus/blur window
    const handleFocus = () => {
      checkSessionExpiry();
    };

    const handleBlur = () => {
      recordActive();
    };

    // 4. Pantau interaksi user (dithrottle tiap 15 detik agar efisien)
    let lastThrottledUpdate = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledUpdate > 15000) {
        lastThrottledUpdate = now;
        recordActive();
      }
    };

    // 5. Interval timer setiap 30 detik untuk mendeteksi idle tanpa minimize
    const intervalTimer = setInterval(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
        if (stored) {
          const elapsed = Date.now() - Number(stored);
          if (elapsed >= INACTIVITY_TIMEOUT_MS) {
            const currentPath = lastPathnameRef.current;
            if (
              currentPath &&
              currentPath !== '/' &&
              currentPath !== '/home' &&
              !currentPath.startsWith('/admin')
            ) {
              recordActive();
              router.push('/home');
            }
          }
        }
      } catch {
        // ignore
      }
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pointerdown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });

    return () => {
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [router]);

  return null;
}
