'use client';

import { useState, useEffect, useRef } from 'react';
import { PolicyIssue } from '@/types';
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
import { useToast } from '@/hooks/useToast';
import Icon from '@/components/Icon';
import { useAuth } from '@/presentation/hooks/useAuth';
import {
  AiBackendStatus,
  createEmptyIssueForm,
  DEFAULT_AI_STATUS,
  DEFAULT_CRITERIA,
  ExtractMethod,
  IssueFormData,
} from './_components/adminConfig';
import AdminLoginGate from './_components/AdminLoginGate';
import AdminDashboardHeader from './_components/AdminDashboardHeader';
import IssueForm from './_components/IssueForm';
import IssueList from './_components/IssueList';
import styles from './admin.module.css';

export default function AdminPage() {
  const { user, isAdmin, isLoading: isAuthLoading, signInWithEmail, signOut } = useAuth();

  // Tandai pemeriksaan sesi awal selesai (isLoading juga true selama proses login berlangsung)
  const [authChecked, setAuthChecked] = useState(false);
  if (!isAuthLoading && !authChecked) setAuthChecked(true);
  const { toast, showToast, hideToast } = useToast();
  const [isSavingIssue, setIsSavingIssue] = useState(false);
  const isSavingRef = useRef(false);

  const [issues, setIssues] = useState<PolicyIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);

  // Backend AI Status
  const [aiStatus, setAiStatus] = useState<AiBackendStatus>(DEFAULT_AI_STATUS);

  // AI Extraction State
  const [aiUrl, setAiUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedMethod, setExtractedMethod] = useState<ExtractMethod | null>(null);
  const [extractedModel, setExtractedModel] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<IssueFormData>(createEmptyIssueForm);

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
      showToast('Silakan tempel (paste) tautan berita terlebih dahulu!', 'error');
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

        const method = (res.method as ExtractMethod) || 'heuristic';
        setExtractedMethod(method);
        setExtractedModel(res.model || '');

        if (method === 'deepseek') {
          showToast(`✨ Analisis DeepSeek AI (${res.model || 'deepseek-chat'}) sukses! Kriteria dan aktor disesuaikan.`, 'success');
        } else if (method === 'gemini' || method === 'openai') {
          showToast(`✨ Analisis AI (${method.toUpperCase()}) sukses! Kriteria dan aktor disesuaikan.`, 'success');
        } else {
          showToast('✨ Berita berhasil diekstrak! Isi DEEPSEEK_API_KEY di file .env untuk analisis AI DeepSeek penuh.', 'success');
        }
      } else {
        showToast(res.error || 'Gagal mengekstrak berita dari link', 'error');
      }
    } catch (err: unknown) {
      showToast((err as Error).message || 'Terjadi kesalahan ekstraksi', 'error');
    } finally {
      setIsExtracting(false);
    }
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
    setFormData(createEmptyIssueForm());
    setAiUrl('');
    setExtractedMethod(null);
    setShowForm(false);
  };

  // Submit create or update — dicegah terkirim ganda (isu duplikat) saat tombol diklik berulang
  const handleSubmit = async () => {
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
      showToast('Judul dan ringkasan kebijakan wajib diisi!', 'error');
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
        showToast('Perubahan isu kebijakan dan kriteria berhasil disimpan!', 'success');
      } else {
        showToast(res.error || 'Gagal memperbarui isu', 'error');
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
        showToast('Isu kebijakan baru berhasil diterbitkan secara langsung ke publik!', 'success');
      } else {
        showToast(res.error || 'Gagal menerbitkan isu', 'error');
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
      showToast(`Status isu diubah menjadi: ${nextStatus === 'active' ? 'Aktif' : 'Ditutup'}`, 'info');
    } else {
      showToast(res.error || 'Gagal memperbarui status isu', 'error');
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
      showToast('Isu berhasil dihapus dari sistem', 'info');
    } else {
      showToast(res.error || 'Gagal menghapus isu', 'error');
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
    showToast('Push broadcast notifikasi berhasil dikirimkan ke subscriber!', 'success');
  };

  const handleAdminLogin = async (identifier: string, password: string): Promise<string | null> => {
    const res = await signInWithEmail(identifier, password);
    if (!res.success) return res.error || 'Autentikasi administrator gagal.';
    showToast('Selamat datang kembali, Administrator!', 'success');
    return null;
  };

  const toastNode = toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />;

  // Tunggu verifikasi sesi server agar form login tidak berkedip untuk admin yang sudah masuk
  if (!authChecked && !isAdmin) {
    return <div className="page" aria-busy="true" />;
  }

  // Gerbang Keamanan Admin (Jika belum login sebagai administrator)
  if (!isAdmin) {
    return (
      <>
        {toastNode}
        <AdminLoginGate onLogin={handleAdminLogin} />
      </>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 'var(--space-2xl)' }}>
      <AdminDashboardHeader
        aiStatus={aiStatus}
        user={user}
        onSignOut={async () => {
          await signOut();
          showToast('Berhasil keluar dari mode administrator.', 'info');
        }}
      />

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
        <IssueForm
          formData={formData}
          setFormData={setFormData}
          editingIssueId={editingIssueId}
          isSaving={isSavingIssue}
          onSubmit={handleSubmit}
          onCancelEdit={handleCancelEdit}
          onError={(message) => showToast(message, 'error')}
          aiStatus={aiStatus}
          aiUrl={aiUrl}
          onAiUrlChange={setAiUrl}
          isExtracting={isExtracting}
          extractedMethod={extractedMethod}
          extractedModel={extractedModel}
          onExtract={handleExtractFromUrl}
        />
      )}

      {/* Issues Management List */}
      <IssueList
        issues={issues}
        isLoading={isLoading}
        onToggleStatus={handleToggleStatus}
        onEdit={handleStartEdit}
        onDelete={handleDelete}
      />

      {toastNode}
    </div>
  );
}
