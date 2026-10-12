'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { useAuth } from '@/presentation/hooks/useAuth';
import GoogleLoginButton from '@/presentation/components/GoogleLoginButton';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, registerWithEmail, signInWithEmail, signInAsGuest } = useAuth();

  // Tab state: 'register' | 'login'
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated and not intentional landing, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const hasCat = typeof window !== 'undefined' && localStorage.getItem('policysnap_cat_profile_created');
      if (hasCat) {
        router.push('/home');
      } else {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, router]);

  // Handle Buat Akun (Register)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Silakan masukkan nama lengkap Anda.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Format email tidak valid. Masukkan email resmi/aktif.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerWithEmail({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal membuat akun.');
        return;
      }

      // Sesuai urutan yang diminta: Landing -> Onboarding Kucing -> Evaluasi
      router.push('/onboarding');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat membuat akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Masuk (Login)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    const isAdminLogin =
      cleanEmail.toLowerCase() === 'admin@policysnap.id' || cleanEmail.toLowerCase() === 'admin';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!isAdminLogin && !emailRegex.test(cleanEmail)) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signInWithEmail(cleanEmail, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Gagal masuk akun.');
        return;
      }

      // Khusus Administrator: langsung arahkan ke Panel Admin
      if (res.user?.role === 'admin' || isAdminLogin) {
        router.push('/admin');
        return;
      }

      const hasCat = typeof window !== 'undefined' && localStorage.getItem('policysnap_cat_profile_created');
      if (hasCat) {
        router.push('/home');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Play as a Guest (Offline Cache Scheme)
  const handlePlayAsGuest = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await signInAsGuest('Warga Tamu (Offline)');
      if (res.success) {
        // Direct transition to Cat Customization Onboarding
        router.push('/onboarding');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk sebagai tamu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.landing}>
      {/* Brand Header */}
      <div className={styles.brandHeader}>
        <div className={styles.logoBadge}>
          <div className={styles.logoIconContainer}>
            <Icon name="policy" size={32} style={{ color: 'white' }} />
          </div>
          <span className={styles.pulseDot}>
            <span className={styles.pulsePing} />
            <span className={styles.pulseCore} />
          </span>
        </div>
        <h1 className={styles.brandTitle}>PolicySnap</h1>
        <p className={styles.brandTagline}>
          Platform Evaluasi Kebijakan Berbasis Bukti &amp; Konsensus Warga
        </p>
      </div>

      {/* Value Proposition Banner */}
      <div className={styles.valueCard}>
        <div className={styles.badgeRow}>
          <span className={styles.integrityBadge}>
            <Icon name="verified_user" size={14} />
            Gamifikasi Kucing 2D · Strata 1–7
          </span>
          <span className={styles.xpBadge}>+50 XP</span>
        </div>
        <p className={styles.valueText}>
          Buat akun atau mainkan sebagai tamu, tentukan kucing pendamping Anda, lalu uji kebijakan publik secara metodologis!
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className={styles.loginCard}>
        {/* Toggle Mode: Buat Akun vs Masuk */}
        <div className={styles.authTabs}>
          <button
            type="button"
            className={`${styles.authTab} ${authMode === 'register' ? styles.authTabActive : ''}`}
            onClick={() => {
              setAuthMode('register');
              setErrorMessage('');
            }}
          >
            <Icon name="person_add" size={16} />
            <span>Buat Akun Baru</span>
          </button>
          <button
            type="button"
            className={`${styles.authTab} ${authMode === 'login' ? styles.authTabActive : ''}`}
            onClick={() => {
              setAuthMode('login');
              setErrorMessage('');
            }}
          >
            <Icon name="login" size={16} />
            <span>Masuk ke Akun</span>
          </button>
        </div>

        {/* Error Feedback Box */}
        {errorMessage && (
          <div className={styles.errorBox}>
            <Icon name="error" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form: Buat Akun Baru */}
        {authMode === 'register' && (
          <form className={styles.emailForm} onSubmit={handleRegister}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Icon name="badge" size={15} />
                Nama Lengkap Anda
              </label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="cth: Andi Prasetyo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Icon name="email" size={15} />
                Alamat Email Valid
              </label>
              <input
                type="email"
                className={styles.formInput}
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Icon name="lock" size={15} />
                Kata Sandi Akun
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className={styles.visibilityToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              type="submit"
              id="btn-register-submit"
              disabled={isSubmitting}
              style={{ marginTop: '6px' }}
            >
              {isSubmitting ? 'Memproses Pendaftaran...' : 'Daftar'}
            </button>
          </form>
        )}

        {/* Form: Masuk Akun */}
        {authMode === 'login' && (
          <form className={styles.emailForm} onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Icon name="email" size={15} />
                Email Pengguna
              </label>
              <input
                type="email"
                className={styles.formInput}
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <div className={styles.passwordHeader}>
                <label className={styles.label}>
                  <Icon name="lock" size={15} />
                  Kata Sandi
                </label>
                <a href="#" className={styles.forgotLink} onClick={(e) => e.preventDefault()}>
                  Lupa?
                </a>
              </div>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.visibilityToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              type="submit"
              id="btn-login-submit"
              disabled={isSubmitting}
              style={{ marginTop: '6px' }}
            >
              {isSubmitting ? 'Memproses Masuk...' : 'Masuk ke Akun →'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className={styles.divider}>
          <span className={styles.dividerText}>atau opsi lain</span>
        </div>

        {/* Google Single-Tap Auth (Di-Hold Sementara) */}
        <GoogleLoginButton
          onSelectRegister={() => setAuthMode('register')}
          onSelectGuest={handlePlayAsGuest}
        />

        {/* Opsi: Play as a Guest (Offline Cache Scheme) */}
        <div className={styles.guestCard}>
          <div className={styles.guestHeader}>
            <div className={styles.guestTitleRow}>
              <span className={styles.guestEmoji}>🎮</span>
              <span className={styles.guestTitle}>Mainkan sebagai Tamu</span>
            </div>
            <span className={styles.guestBadge}>Offline Cache</span>
          </div>
          <p className={styles.guestDesc}>
            Ingin mencoba langsung tanpa mendaftar? Evaluasi dan kustomisasi karakter Anda disimpan aman di memori cache peramban.
          </p>
          <button
            type="button"
            className={styles.guestBtn}
            onClick={handlePlayAsGuest}
            disabled={isSubmitting}
            id="btn-play-as-guest"
          >
            <span>Masuk sebagai Tamu (Guest) →</span>
          </button>
        </div>
      </div>

      {/* Security note */}
      <p className={styles.footerNote}>
        Data pengujian disimpan aman. Anda menyetujui Kode Etik Partisipasi Publik PolicySnap.
      </p>
    </div>
  );
}
