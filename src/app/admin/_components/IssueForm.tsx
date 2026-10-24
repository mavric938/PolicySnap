'use client';

import type { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/Icon';
import type { ActorCard, CriteriaDescriptions } from '@/types';
import AiAutopilotBox from './AiAutopilotBox';
import CriteriaEditor from './CriteriaEditor';
import ActorCardsEditor from './ActorCardsEditor';
import { AiBackendStatus, CATEGORIES, ExtractMethod, IssueFormData } from './adminConfig';
import styles from '../admin.module.css';

interface IssueFormProps {
  formData: IssueFormData;
  setFormData: Dispatch<SetStateAction<IssueFormData>>;
  editingIssueId: string | null;
  isSaving: boolean;
  onSubmit: () => void;
  onCancelEdit: () => void;
  onError: (message: string) => void;
  // AI Auto-Pilot
  aiStatus: AiBackendStatus;
  aiUrl: string;
  onAiUrlChange: (url: string) => void;
  isExtracting: boolean;
  extractedMethod: ExtractMethod | null;
  extractedModel: string;
  onExtract: () => void;
}

/** Formulir buat/edit isu kebijakan (US-002). */
export default function IssueForm({
  formData,
  setFormData,
  editingIssueId,
  isSaving,
  onSubmit,
  onCancelEdit,
  onError,
  aiStatus,
  aiUrl,
  onAiUrlChange,
  isExtracting,
  extractedMethod,
  extractedModel,
  onExtract,
}: IssueFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleCriteriaChange = (key: keyof CriteriaDescriptions, val: string) => {
    setFormData((prev) => ({ ...prev, criteria: { ...prev.criteria, [key]: val } }));
  };

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
      onError('Minimal harus ada 1 aktor stakeholder!');
      return;
    }
    setFormData((prev) => ({ ...prev, actorCards: prev.actorCards.filter((_, idx) => idx !== index) }));
  };

  return (
    <form className={`${styles.form} animate-slide-up`} onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 className={styles.formTitle} style={{ margin: 0 }}>
          {editingIssueId ? 'Edit Isu & Matriks Kriteria' : 'Formulir Isu Kebijakan Baru'}
        </h3>
        {editingIssueId && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancelEdit}
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            Batal Edit
          </button>
        )}
      </div>

      <AiAutopilotBox
        aiStatus={aiStatus}
        aiUrl={aiUrl}
        onAiUrlChange={onAiUrlChange}
        isExtracting={isExtracting}
        extractedMethod={extractedMethod}
        extractedModel={extractedModel}
        onExtract={onExtract}
      />

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

      <CriteriaEditor criteria={formData.criteria} onChange={handleCriteriaChange} />

      <ActorCardsEditor
        actorCards={formData.actorCards}
        actorTags={formData.actorTags}
        onActorTagsChange={(tags) => setFormData((f) => ({ ...f, actorTags: tags }))}
        onActorChange={handleActorChange}
        onAddActor={handleAddActor}
        onRemoveActor={handleRemoveActor}
      />

      <button
        className="btn btn-primary btn-full"
        type="submit"
        disabled={isSaving}
        aria-busy={isSaving}
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
  );
}
