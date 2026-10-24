'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAuthDataSource } from '@/data/datasources/supabaseAuthDataSource';
import Icon from '@/components/Icon';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    let settled = false; // pengganti cek `status` yang basi di dalam closure
    let unsubscribe: (() => void) | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];

    async function handleAuthCallback() {
      try {
        const client = supabaseAuthDataSource.getClient();
        if (!client) {
          throw new Error('Supabase client tidak tersedia.');
        }

        // Supabase client with detectSessionInUrl automatically processes code / access token
        const { data, error } = await client.auth.getSession();
        if (cancelled) return;

        if (error) {
          throw error;
        }

        if (data?.session) {
          settled = true;
          setStatus('success');
          // Check if user has initialized cat avatar
          const hasCreatedCat = localStorage.getItem('policysnap_cat_profile_created');
          timers.push(
            setTimeout(() => {
              router.replace(hasCreatedCat ? '/home' : '/home?first_login=true');
            }, 800)
          );
          return;
        }

        // Wait brief moment for auth state change event if URL hash parsing is asynchronous
        const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
          if (session && !settled) {
            settled = true;
            setStatus('success');
            router.replace('/home');
          }
        });
        unsubscribe = () => listener.subscription.unsubscribe();

        // Timeout fallback if no session arrives within 3 seconds
        timers.push(
          setTimeout(() => {
            if (!settled) router.replace('/home');
          }, 3000)
        );
      } catch (err: unknown) {
        if (cancelled) return;
        console.error('Auth callback error:', err);
        setStatus('error');
        setErrorMessage((err as Error)?.message || 'Gagal memverifikasi otentikasi Google.');
      }
    }

    handleAuthCallback();

    return () => {
      cancelled = true;
      unsubscribe?.();
      timers.forEach(clearTimeout);
    };
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#F8FAFC',
        textAlign: 'center',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '40px 32px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {status === 'verifying' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  border: '3px solid #E2E8F0',
                  borderTopColor: '#4285F4',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div style={{ position: 'absolute' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Menghubungkan Akun Google
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px', lineHeight: 1.5 }}>
                Memvalidasi kredensial aman Anda ke PolicySnap...
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check_circle" size={36} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Login Berhasil!
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>
                Mengalihkan Anda ke Beranda...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="error" size={36} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Gagal Otorisasi
              </h2>
              <p style={{ fontSize: '13px', color: '#DC2626', marginTop: '8px' }}>
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => router.replace('/')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Kembali ke Halaman Masuk
            </button>
          </>
        )}
      </div>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
