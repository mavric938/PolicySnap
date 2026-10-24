'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PolicyIssue, CriteriaDescriptions, ActorCard } from '@/types';
import {
  getIssues,
  createIssue,
  updateIssue,
  toggleIssueStatus,
  deleteIssue,
  extractIssueFromUrl,
  getAIBackendStatus,
} from '@/lib/issueService';
import Toast from '@/components/Toast';
import Icon from '@/components/Icon';
import { useAuth } from '@/presentation/hooks/useAuth';
import styles from './admin.module.css';

const CATEGORIES = [
  'Pendidikan & Kesehatan',
  'Ekonomi & Pajak',
  'Infrastruktur & Tata Ruang',
  'Ketenagakerjaan & Hukum',
  'Sosial & Lingkungan',
  'Teknologi & Digital',
];

const DEFAULT_CRITERIA: CriteriaDescriptions = {
  effectiveness: 'Target Terukur: Mengurangi masalah utama hingga 40% dan mencapai indikator keberhasilan.',
  efficiency: 'Efisiensi alokasi anggaran dan jam operasional tanpa membebani keuangan publik.',
  equity: 'Distribusi perlindungan adil untuk kelompok rentan dan masyarakat daerah tertinggal.',
  responsiveness: 'Ketanggapan terhadap aspirasi publik dan keluhan masyarakat di lapangan.',
};

const DEFAULT_ACTORS: ActorCard[] = [
  {
    id: 'actor-1',
    name: 'Kementerian Terkait',
    role: 'Regulator Utama',
    description: 'Menyusun regulasi, mengawasi kepatuhan hukum, dan menetapkan standar operasional.',
    imageEmoji: '🏛️',
  },
  {
    id: 'actor-2',
    name: 'Pelaksana Lapangan',
    role: 'Aparatur Teknis',
    description: 'Menghadapi beban kesiapan sistem, adaptasi operasional baru, dan verifikasi di lapangan.',
    imageEmoji: '💼',
  },
  {
    id: 'actor-3',
    name: 'Kelompok Sasaran',
    role: 'Penerima Dampak',
    description: 'Merasakan langsung implikasi kebijakan terhadap kehidupan dan kesejahteraan harian.',
    imageEmoji: '👥',
  },
  {
    id: 'actor-4',
    name: 'Komunitas & Pengamat',
    role: 'Pengawas Publik',
    description: 'Menilai transparansi, keadilan distribusi dampak, dan perlindungan hak warga.',
    imageEmoji: '⚖️',
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: isAuthLoading, signInWithEmail, signOut } = useAuth();
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isSavingIssue, setIsSavingIssue] = useState(false);
  const isSavingRef = useRef(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  const [issues, setIssues] = useState<PolicyIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Backend AI Status
  const [aiStatus, setAiStatus] = useState<{
    configured: boolean;
    activeProvider: string;
    activeModel: string;
    deepseekConfigured: boolean;
  }>({
    configured: false,
    activeProvider: 'heuristic',
    activeModel: 'Metadata Parser',
    deepseekConfigured: false,
  });

  // AI Extraction State
  const [aiUrl, setAiUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedMethod, setExtractedMethod] = useState<'deepseek' | 'gemini' | 'openai' | 'heuristic' | null>(null);
  const [extractedModel, setExtractedModel] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    category: 'Pendidikan & Kesehatan',
    sourceUrl: '',
    actorTags: '',
    status: 'active' as 'active' | 'closed',
    criteria: { ...DEFAULT_CRITERIA },
    actorCards: [...DEFAULT_ACTORS],
  });

  // Load issues & AI backend status on mount
  useEffect(() => {
    let isMounted = true;
    getIssues().then((data) => {
      if (isMounted) {
        setIssues(data);
        setIsLoading(false);
      }
    });

    getAIBackendStatus().then((status) => {
      if (isMounted) {
        setAiStatus(status);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // AI Auto-pilot extraction from link via backend DeepSeek
  const handleExtractFromUrl = async () => {
    if (!aiUrl.trim()) {
      setToastMsg('Silakan tempel (paste) tautan berita terlebih dahulu!');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsExtracting(true);
    try {
      const res = await extractIssueFromUrl({
        url: aiUrl.trim(),
      });

      if (res.success && res.data) {
        const d = res.data;
        setFormData((prev) => ({
          ...prev,
          title: d.title || prev.title,
          category: d.category || prev.category,
          summary: d.summary || prev.summary,
          sourceUrl: aiUrl.trim(),
          actorTags: Array.isArray(d.actorTags) ? d.actorTags.join(', ') : prev.actorTags,
          criteria: d.criteriaDescriptions || prev.criteria,
          actorCards: d.actorCards && d.actorCards.length > 0 ? d.actorCards : prev.actorCards,
        }));

        const method = (res.method as 'deepseek' | 'gemini' | 'openai' | 'heuristic') || 'heuristic';
        setExtractedMethod(method);
        setExtractedModel(res.model || '');

        if (method === 'deepseek') {
          setToastMsg(`✨ Analisis DeepSeek AI (${res.model || 'deepseek-chat'}) sukses! Kriteria dan aktor disesuaikan.`);
        } else if (method === 'gemini' || method === 'openai') {
          setToastMsg(`✨ Analisis AI (${method.toUpperCase()}) sukses! Kriteria dan aktor disesuaikan.`);
        } else {
          setToastMsg('✨ Berita berhasil diekstrak! Isi DEEPSEEK_API_KEY di file .env untuk analisis AI DeepSeek penuh.');
        }
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMsg(res.error || 'Gagal mengekstrak berita dari link');
        setToastType('error');
        setShowToast(true);
      }
    } catch (err: unknown) {
      setToastMsg((err as Error).message || 'Terjadi kesalahan ekstraksi');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsExtracting(false);
    }
  };

  // Criteria update helper
  const handleCriteriaChange = (key: keyof CriteriaDescriptions, val: string) => {
    setFormData((prev) => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [key]: val,
      },
    }));
  };

  // Actor Cards helpers
  const handleActorChange = (index: number, field: keyof ActorCard, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.actorCards];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, actorCards: updated };
    });
  };

  const handleAddActor = () => {
    const nextIdx = formData.actorCards.length + 1;
    setFormData((prev) => ({
      ...prev,
      actorCards: [
        ...prev.actorCards,
        {
          id: `actor-${Date.now()}-${nextIdx}`,
          name: 'Stakeholder Baru',
          role: 'Peran Terkait',
          description: 'Deskripsi dampak atau posisi stakeholder terhadap kebijakan ini...',
          imageEmoji: '👤',
        },
      ],
    }));
  };

  const handleRemoveActor = (index: number) => {
    if (formData.actorCards.length <= 1) {
      setToastMsg('Minimal harus ada 1 aktor stakeholder!');
      setToastType('error');
      setShowToast(true);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      actorCards: prev.actorCards.filter((_, idx) => idx !== index),
    }));
  };

  // Start editing an existing issue
  const handleStartEdit = (issue: PolicyIssue) => {
    setEditingIssueId(issue.id);
    setFormData({
      title: issue.title,
      summary: issue.summary,
      category: issue.category || 'Pendidikan & Kesehatan',
      sourceUrl: issue.sourceUrl || '',
      actorTags: issue.actorTags.join(', '),
      status: issue.status,
      criteria: issue.criteriaDescriptions || { ...DEFAULT_CRITERIA },
      actorCards:
        issue.actorCards && issue.actorCards.length > 0
          ? issue.actorCards
          : (issue.actorTags || []).map((tag, idx) => ({
              id: `actor-${idx + 1}`,
              name: tag,
              role: 'Stakeholder Kunci',
              description: `Pihak sentral yang berkaitan langsung dengan implementasi ${issue.title}.`,
              imageEmoji: ['🏛️', '💼', '👥', '⚖️'][idx % 4],
            })),
    });
    setAiUrl(issue.sourceUrl || '');
    setExtractedMethod(null);
    setShowForm(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingIssueId(null);
    setFormData({
      title: '',
      summary: '',
      category: 'Pendidikan & Kesehatan',
      sourceUrl: '',
      actorTags: '',
      status: 'active',
      criteria: { ...DEFAULT_CRITERIA },
      actorCards: [...DEFAULT_ACTORS],
    });
    setAiUrl('');
    setExtractedMethod(null);
    setShowForm(false);
  };

  // Submit create or update — dicegah terkirim ganda (isu duplikat) saat tombol diklik berulang
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSavingIssue(true);
    try {
      await submitIssue();
    } finally {
      isSavingRef.current = false;
      setIsSavingIssue(false);
    }
  };

  const submitIssue = async () => {
    if (!formData.title.trim() || !formData.summary.trim()) {
      setToastMsg('Judul dan ringkasan kebijakan wajib diisi!');
      setToastType('error');
      setShowToast(true);
      return;
    }

    const resolvedTags = formData.actorTags.trim()
      ? formData.actorTags
      : formData.actorCards.map((a) => a.name).join(', ');

    if (editingIssueId) {
      const res = await updateIssue(editingIssueId, {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        category: formData.category,
        sourceUrl: formData.sourceUrl.trim(),
        actorTags: resolvedTags.split(',').map((t) => t.trim()).filter(Boolean),
        status: formData.status,
        criteriaDescriptions: formData.criteria,
        actorCards: formData.actorCards,
      });

      if (res.success) {
        if (res.issue) {
          setIssues((prev) => prev.map((i) => (i.id === editingIssueId ? res.issue! : i)));
        }
        handleCancelEdit();
        setToastMsg('Perubahan isu kebijakan dan kriteria berhasil disimpan!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMsg(res.error || 'Gagal memperbarui isu');
        setToastType('error');
        setShowToast(true);
      }
    } else {
      const res = await createIssue({
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        category: formData.category,
        sourceUrl: formData.sourceUrl.trim(),
        actorTags: resolvedTags,
        status: formData.status,
        criteriaDescriptions: formData.criteria,
        actorCards: formData.actorCards,
      });

      if (res.success) {
        if (res.issue) {
          setIssues((prev) => [res.issue!, ...prev]);
        }
        handleCancelEdit();
        setToastMsg('Isu kebijakan baru berhasil diterbitkan secara langsung ke publik!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMsg(res.error || 'Gagal menerbitkan isu');
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  const handleToggleStatus = async (issue: PolicyIssue) => {
    const nextStatus = issue.status === 'active' ? 'closed' : 'active';
    const res = await toggleIssueStatus(issue.id, nextStatus);

    if (res.success) {
      setIssues((prev) =>
        prev.map((i) => (i.id === issue.id ? { ...i, status: nextStatus } : i))
      );
      setToastMsg(`Status isu diubah menjadi: ${nextStatus === 'active' ? 'Aktif' : 'Ditutup'}`);
      setToastType('info');
      setShowToast(true);
    } else {
      setToastMsg(res.error || 'Gagal memperbarui status isu');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDelete = async (issueId: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus isu "${title}"?`)) {
      return;
    }

    const res = await deleteIssue(issueId);
    if (res.success) {
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      if (editingIssueId === issueId) {
        handleCancelEdit();
      }
      setToastMsg('Isu berhasil dihapus dari sistem');
      setToastType('info');
      setShowToast(true);
    } else {
      setToastMsg(res.error || 'Gagal menghapus isu');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleSendNotification = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'policysnap_new_issue_alert',
        JSON.stringify({
          time: Date.now(),
          title: issues[0]?.title || 'Isu Kebijakan Baru',
        })
      );
    }
    setToastMsg('Push broadcast notifikasi berhasil dikirimkan ke subscriber!');
    setToastType('success');
    setShowToast(true);
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    setIsAdminLoggingIn(true);
    try {
      const res = await signInWithEmail(adminUsernameInput, adminPasswordInput);
      if (!res.success) {
        setAdminLoginError(res.error || 'Autentikasi administrator gagal.');
        return;
      }
      setToastMsg('Selamat datang kembali, Administrator!');
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      setAdminLoginError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  // Tunggu verifikasi sesi server agar form login tidak berkedip untuk admin yang sudah masuk
  if (isAuthLoading && !isAdmin && !isAdminLoggingIn) {
    return <div className="page" aria-busy="true" />;
  }

  // Gerbang Keamanan Admin (Jika belum login sebagai administrator)
  if (!isAdmin) {
    return (
      <div className="page animate-fade-in" style={{ paddingBottom: '40px' }}>
        {showToast && (
          <Toast message={toastMsg} type={toastType} onClose={() => setShowToast(false)} />
        )}
        <header className={styles.header}>
          <button
            className="btn btn-ghost"
            onClick={() => router.push('/home')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="arrow_back" size={16} />
            <span>Beranda</span>
          </button>
          <h1 className={styles.headerTitle}>Pusat Kurasi & Auto-Pilot</h1>
          <div style={{ width: 60 }} />
        </header>

        <div className={styles.gateWrapper}>
          <div className={styles.gateCard}>
            <div className={styles.gateIconBox}>
              <Icon name="security" size={32} />
            </div>

            <div className={styles.gateBadge}>
              <span className={styles.pulseDot} />
              <span>Akses Terbatas: Administrator</span>
            </div>

            <h2 className={styles.gateTitle}>Pusat Kurasi & Admin Kebijakan</h2>
            <p className={styles.gateDesc}>
              Akses khusus pengelola untuk memvalidasi isu, mengedit matriks kriteria kebijakan, dan kurasi otomatis melalui DeepSeek AI Auto-Pilot.
            </p>

            {adminLoginError && (
              <div className={styles.gateErrorAlert}>
                <Icon name="error" size={16} />
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className={styles.gateForm}>
              <div className={styles.formGroup}>
                <label className={styles.gateLabel}>
                  <Icon name="badge" size={14} />
                  <span>Email / Username Admin</span>
                </label>
                <input
                  type="text"
                  className={styles.gateInput}
                  placeholder="admin@policysnap.id"
                  value={adminUsernameInput}
                  onChange={(e) => setAdminUsernameInput(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.gateLabel}>
                  <Icon name="lock" size={14} />
                  <span>Kata Sandi Admin</span>
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    className={styles.gateInput}
                    placeholder="••••••••"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.visibilityToggle}
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                  >
                    <Icon name={showAdminPassword ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isAdminLoggingIn}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                  marginTop: '12px',
                }}
              >
                {isAdminLoggingIn ? 'Memvalidasi...' : 'Masuk sebagai Admin →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* Header */}
      <header className={styles.header}>
        <button
          className="btn btn-ghost"
          onClick={() => router.push('/home')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="arrow_back" size={16} />
          <span>Beranda</span>
        </button>
        <h1 className={styles.headerTitle}>Panel Admin Kebijakan</h1>
        <div
          className={`${styles.backendTag} ${aiStatus.deepseekConfigured ? styles.backendTagActive : ''}`}
          title={aiStatus.deepseekConfigured ? `Model: ${aiStatus.activeModel}` : 'Konfigurasi DEEPSEEK_API_KEY di file .env'}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: aiStatus.deepseekConfigured ? '#4F46E5' : '#94A3B8',
              display: 'inline-block',
            }}
          />
          <span>{aiStatus.deepseekConfigured ? `DeepSeek AI Aktif` : 'DeepSeek: Input di .env'}</span>
        </div>
      </header>

      {/* Admin Session Identity Bar */}
      <div className={styles.adminIdentityBar}>
        <div className={styles.adminIdentityInfo}>
          <span className={styles.adminShieldIcon}>🛡️</span>
          <div>
            <div className={styles.adminNameRow}>
              <span className={styles.adminActiveName}>{user?.name || 'Administrator Kebijakan'}</span>
              <span className={styles.adminActiveBadge}>ADMIN</span>
            </div>
            <span className={styles.adminActiveEmail}>{user?.email || 'admin@policysnap.id'}</span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            await signOut();
            setToastMsg('Berhasil keluar dari mode administrator.');
            setToastType('info');
            setShowToast(true);
          }}
          style={{ fontSize: '0.75rem', color: '#EF4444', border: '1px solid #FEE2E2', background: '#FEF2F2' }}
        >
          <Icon name="logout" size={14} />
          <span>Keluar</span>
        </button>
      </div>

      {/* Admin Notice */}
      <div className={styles.adminBanner}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
          }}
        >
          <Icon name="bolt" size={24} />
        </div>
        <div>
          <span className={styles.adminLabel} style={{ color: '#4F46E5' }}>
            Pusat Kurasi & DeepSeek AI Auto-Pilot
          </span>
          <p className={styles.adminDesc}>
            Cukup paste tautan berita apa saja. Backend DeepSeek AI akan mengekstrak judul, kriteria, dan profil aktor secara otomatis.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm && editingIssueId) {
              handleCancelEdit();
            } else {
              setShowForm(!showForm);
            }
          }}
          id="btn-new-issue"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {showForm ? <Icon name="close" size={16} /> : <Icon name="add" size={16} />}
          <span>{showForm ? 'Tutup Formulir' : 'Tambah Isu Baru'}</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleSendNotification}
          id="btn-send-notification"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="notifications_active" size={16} />
          <span>Broadcast Push Notif</span>
        </button>
      </div>

      {/* New / Edit Issue Form */}
      {showForm && (
        <form className={`${styles.form} animate-slide-up`} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className={styles.formTitle} style={{ margin: 0 }}>
              {editingIssueId ? 'Edit Isu & Matriks Kriteria' : 'Formulir Isu Kebijakan Baru'}
            </h3>
            {editingIssueId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCancelEdit}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                Batal Edit
              </button>
            )}
          </div>

          {/* AI Auto-Pilot Section */}
          <div className={styles.aiBox}>
            <div className={styles.aiBoxHeader}>
              <span className={styles.aiBoxTitle}>
                <Icon name="bolt" size={18} style={{ color: '#4F46E5' }} />
                AI Auto-Pilot (Paste Link Berita)
              </span>
              <span className={`${styles.backendTag} ${aiStatus.deepseekConfigured ? styles.backendTagActive : ''}`}>
                {aiStatus.deepseekConfigured ? `⚡ DeepSeek: ${aiStatus.activeModel}` : '⚙️ Key di .env'}
              </span>
            </div>
            <p className={styles.aiBoxDesc}>
              Tempel tautan berita kebijakan (Kompas, Detik, Tempo, Antara, dll.). DeepSeek AI di backend akan otomatis mengisi judul, ringkasan, 4 matriks kriteria, dan kartu aktor yang representatif.
            </p>
            <div className={styles.aiInputGroup}>
              <input
                className={styles.aiInput}
                type="url"
                placeholder="https://nasional.kompas.com/... atau https://news.detik.com/..."
                value={aiUrl}
                onChange={(e) => setAiUrl(e.target.value)}
                id="input-ai-url"
              />
              <button
                type="button"
                className={styles.aiButton}
                onClick={handleExtractFromUrl}
                disabled={isExtracting}
                id="btn-ai-extract"
                style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' }}
              >
                {isExtracting ? (
                  <>
                    <Icon name="radar" size={16} className="animate-spin" />
                    <span>Menganalisis Berita...</span>
                  </>
                ) : (
                  <>
                    <Icon name="insights" size={16} />
                    <span>⚡ Ekstrak dengan AI</span>
                  </>
                )}
              </button>
            </div>

            {!aiStatus.deepseekConfigured && (
              <div style={{ fontSize: '0.7188rem', color: '#6366F1', marginTop: '8px', lineHeight: 1.4 }}>
                💡 <strong>Konfigurasi Backend:</strong> Buka file <code>.env</code> di explorer Anda dan masukkan <code>DEEPSEEK_API_KEY=kunci_anda</code>.
              </div>
            )}

            {extractedMethod && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className={`${styles.aiStatusBadge} ${
                    extractedMethod === 'deepseek'
                      ? styles.badgeDeepSeek
                      : extractedMethod === 'heuristic'
                      ? styles.badgeHeuristic
                      : styles.badgeSuccess
                  }`}
                >
                  <Icon name="check_circle" size={14} />
                  {extractedMethod === 'deepseek'
                    ? `Diekstrak oleh DeepSeek AI (${extractedModel || 'deepseek-chat'})`
                    : extractedMethod === 'gemini'
                    ? 'Diekstrak oleh Google Gemini AI'
                    : extractedMethod === 'openai'
                    ? 'Diekstrak oleh OpenAI'
                    : 'Diekstrak oleh Metadata Parser (Masukkan DEEPSEEK_API_KEY di .env)'}
                </span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Kategori Kebijakan</label>
            <select
              className={styles.select}
              value={formData.category}
              onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
              id="select-category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Judul Isu Regulasi *</label>
            <input
              className="input"
              placeholder="Contoh: 2027 Siswa Tak Otomatis Naik Kelas: Uji Standar Kelulusan"
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              id="input-title"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ringkasan & Konteks Kebijakan *</label>
            <textarea
              className="textarea"
              placeholder="Jelaskan latar belakang, urgensi, dan pokok regulasi secara ringkas dan objektif..."
              value={formData.summary}
              onChange={(e) => setFormData((f) => ({ ...f, summary: e.target.value }))}
              id="input-summary"
              rows={3}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tautan Sumber Berita Resmi</label>
            <input
              className="input"
              placeholder="https://kemdikbud.go.id/... atau tautan berita rujukan"
              value={formData.sourceUrl}
              onChange={(e) => setFormData((f) => ({ ...f, sourceUrl: e.target.value }))}
              id="input-source-url"
            />
          </div>

          {/* Policy Criteria Matrix Section */}
          <div className={styles.formSectionDivider}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <span className={styles.sectionHeading}>
                  <Icon name="track_changes" size={18} style={{ color: 'var(--primary-coral)' }} />
                  Matriks Kriteria Kebijakan (Representatif & Spesifik)
                </span>
                <p className={styles.sectionSubtext}>
                  Deskripsi indikator yang akan muncul langsung pada slider penilaian pengguna di Studio Evaluasi.
                </p>
              </div>
            </div>

            <div className={styles.criteriaGrid}>
              {/* Efektivitas */}
              <div className={styles.criteriaCardInput}>
                <div className={styles.criteriaCardHeader}>
                  <div className={styles.criteriaCardIcon} style={{ background: '#FFF1ED', color: '#FF6B4A' }}>
                    <Icon name="target" size={15} />
                  </div>
                  <span className={styles.criteriaCardTitle}>1. Efektivitas (Target Capaian)</span>
                </div>
                <textarea
                  className={styles.criteriaTextarea}
                  value={formData.criteria.effectiveness}
                  onChange={(e) => handleCriteriaChange('effectiveness', e.target.value)}
                  placeholder="Target terukur dan indikator keberhasilan kebijakan..."
                  id="input-criteria-effectiveness"
                  rows={2}
                />
              </div>

              {/* Efisiensi */}
              <div className={styles.criteriaCardInput}>
                <div className={styles.criteriaCardHeader}>
                  <div className={styles.criteriaCardIcon} style={{ background: '#ECFDF5', color: '#10B981' }}>
                    <Icon name="account_balance_wallet" size={15} />
                  </div>
                  <span className={styles.criteriaCardTitle}>2. Efisiensi (Beban Sumber Daya)</span>
                </div>
                <textarea
                  className={styles.criteriaTextarea}
                  value={formData.criteria.efficiency}
                  onChange={(e) => handleCriteriaChange('efficiency', e.target.value)}
                  placeholder="Efisiensi anggaran, jam kerja, atau operasional..."
                  id="input-criteria-efficiency"
                  rows={2}
                />
              </div>

              {/* Keadilan */}
              <div className={styles.criteriaCardInput}>
                <div className={styles.criteriaCardHeader}>
                  <div className={styles.criteriaCardIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                    <Icon name="balance" size={15} />
                  </div>
                  <span className={styles.criteriaCardTitle}>3. Keadilan (Pemerataan & Rentan)</span>
                </div>
                <textarea
                  className={styles.criteriaTextarea}
                  value={formData.criteria.equity}
                  onChange={(e) => handleCriteriaChange('equity', e.target.value)}
                  placeholder="Dampak perlindungan sosial bagi kelompok rentan / daerah 3T..."
                  id="input-criteria-equity"
                  rows={2}
                />
              </div>

              {/* Responsivitas */}
              <div className={styles.criteriaCardInput}>
                <div className={styles.criteriaCardHeader}>
                  <div className={styles.criteriaCardIcon} style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
                    <Icon name="forum" size={15} />
                  </div>
                  <span className={styles.criteriaCardTitle}>4. Responsivitas (Aspirasi Publik)</span>
                </div>
                <textarea
                  className={styles.criteriaTextarea}
                  value={formData.criteria.responsiveness}
                  onChange={(e) => handleCriteriaChange('responsiveness', e.target.value)}
                  placeholder="Ketanggapan terhadap realitas lapangan atau keluhan warga..."
                  id="input-criteria-responsiveness"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Stakeholder Actor Cards Section */}
          <div className={styles.formSectionDivider}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <span className={styles.sectionHeading}>
                  <Icon name="person" size={18} style={{ color: '#2563EB' }} />
                  Profil Stakeholder & Aktor Kunci (Kartu Swipe Evaluasi)
                </span>
                <p className={styles.sectionSubtext}>
                  Kartu yang akan digeser (swipe) oleh pengguna saat menilai dampak kebijakan pada tiap aktor.
                </p>
              </div>
              <button
                type="button"
                className={styles.addActorBtn}
                onClick={handleAddActor}
                id="btn-add-actor"
              >
                <Icon name="add" size={14} />
                <span>Tambah Aktor</span>
              </button>
            </div>

            <div className={styles.actorCardsContainer}>
              {formData.actorCards.map((actor, idx) => (
                <div key={actor.id || idx} className={styles.actorCardEditRow}>
                  <div className={styles.actorCardRowTop}>
                    <input
                      className={styles.actorEmojiInput}
                      value={actor.imageEmoji}
                      onChange={(e) => handleActorChange(idx, 'imageEmoji', e.target.value)}
                      title="Emoji Aktor"
                      maxLength={4}
                    />
                    <input
                      className={styles.actorNameInput}
                      value={actor.name}
                      onChange={(e) => handleActorChange(idx, 'name', e.target.value)}
                      placeholder="Nama Aktor (cth: Guru & Pendidik)"
                    />
                    <input
                      className={styles.actorRoleInput}
                      value={actor.role}
                      onChange={(e) => handleActorChange(idx, 'role', e.target.value)}
                      placeholder="Peran (cth: Pelaksana Lapangan)"
                    />
                    <button
                      type="button"
                      className={styles.actorRemoveBtn}
                      onClick={() => handleRemoveActor(idx)}
                      title="Hapus Aktor"
                    >
                      <Icon name="delete" size={15} />
                    </button>
                  </div>
                  <textarea
                    className={styles.actorDescTextarea}
                    value={actor.description}
                    onChange={(e) => handleActorChange(idx, 'description', e.target.value)}
                    placeholder="Deskripsi kekhawatiran, posisi, atau beban yang dihadapi aktor terkait isu ini..."
                    rows={2}
                  />
                </div>
              ))}
            </div>

            <div className={styles.formGroup} style={{ marginTop: '12px' }}>
              <label className={styles.formLabel}>Tag Stakeholder Ringkas (Pisahkan koma)</label>
              <input
                className="input"
                placeholder="Contoh: Kemendikdasmen, Guru, Murid, Wali Murid"
                value={formData.actorTags}
                onChange={(e) => setFormData((f) => ({ ...f, actorTags: e.target.value }))}
                id="input-actor-tags"
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={isSavingIssue}
            aria-busy={isSavingIssue}
            id="btn-submit-issue"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px',
              borderRadius: '12px',
              marginTop: '10px',
            }}
          >
            <Icon name="check" size={18} />
            <span>
              {editingIssueId ? 'Simpan Perubahan Isu Kebijakan' : 'Publikasikan Isu ke Komunitas'}
            </span>
          </button>
        </form>
      )}

      {/* Issues Management List */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>Daftar Isu Terbit</span>
          <span className={styles.issueCount}>{issues.length} isu tersimpan</span>
        </div>

        {isLoading ? (
          <div className={styles.emptyState}>Memuat daftar isu...</div>
        ) : issues.length === 0 ? (
          <div className={styles.emptyState}>Belum ada isu kebijakan. Klik &quot;Tambah Isu Baru&quot; di atas.</div>
        ) : (
          <div className={styles.issueList}>
            {issues.map((issue) => (
              <div key={issue.id} className={styles.issueRow} id={`admin-issue-${issue.id}`}>
                <div className={styles.issueRowTop}>
                  <div className={styles.issueInfo}>
                    {issue.category && (
                      <span className={styles.issueCategoryBadge}>{issue.category}</span>
                    )}
                    <h4 className={styles.issueRowTitle}>{issue.title}</h4>
                    <p className={styles.issueRowSummary}>{issue.summary}</p>
                    <div className={styles.issueRowMeta}>
                      <span>{issue.totalEvaluations.toLocaleString('id-ID')} evaluasi</span>
                      <span>•</span>
                      <span>{issue.createdAt}</span>
                      <span>•</span>
                      <span>{issue.actorTags.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.issueActions}>
                  <div className={styles.statusGroup}>
                    <div
                      className={`toggle ${issue.status === 'active' ? 'active' : ''}`}
                      onClick={() => handleToggleStatus(issue)}
                      title={
                        issue.status === 'active'
                          ? 'Klik untuk menutup evaluasi'
                          : 'Klik untuk mengaktifkan kembali'
                      }
                    />
                    <span
                      className={`badge ${
                        issue.status === 'active' ? 'badge-active' : 'badge-closed'
                      }`}
                    >
                      {issue.status === 'active' ? 'Aktif' : 'Ditutup'}
                    </span>
                  </div>

                  <div className={styles.actionButtons}>
                    <button
                      className={styles.actionIconBtn}
                      onClick={() => handleStartEdit(issue)}
                      title="Edit Isu & Kriteria"
                      id={`btn-edit-issue-${issue.id}`}
                    >
                      <Icon name="edit_note" size={17} />
                    </button>
                    <button
                      className={styles.actionIconBtn}
                      onClick={() => router.push(`/evaluate?issue=${issue.id}`)}
                      title="Pratinjau Halaman Evaluasi"
                      id={`btn-preview-issue-${issue.id}`}
                    >
                      <Icon name="open_in_new" size={16} />
                    </button>
                    <button
                      className={`${styles.actionIconBtn} ${styles.deleteBtn}`}
                      onClick={() => handleDelete(issue.id, issue.title)}
                      title="Hapus Isu"
                      id={`btn-delete-issue-${issue.id}`}
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showToast && (
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
