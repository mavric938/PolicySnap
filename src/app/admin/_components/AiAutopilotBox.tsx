import Icon from '@/components/Icon';
import type { AiBackendStatus, ExtractMethod } from './adminConfig';
import styles from '../admin.module.css';

interface AiAutopilotBoxProps {
  aiStatus: AiBackendStatus;
  aiUrl: string;
  onAiUrlChange: (url: string) => void;
  isExtracting: boolean;
  extractedMethod: ExtractMethod | null;
  extractedModel: string;
  onExtract: () => void;
}

/** Kotak "AI Auto-Pilot": tempel link berita → isi form otomatis. */
export default function AiAutopilotBox({
  aiStatus,
  aiUrl,
  onAiUrlChange,
  isExtracting,
  extractedMethod,
  extractedModel,
  onExtract,
}: AiAutopilotBoxProps) {
  return (
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
          onChange={(e) => onAiUrlChange(e.target.value)}
          id="input-ai-url"
        />
        <button
          type="button"
          className={styles.aiButton}
          onClick={onExtract}
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
  );
}
