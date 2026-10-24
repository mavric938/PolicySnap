import Icon from '@/components/Icon';
import type { ActorCard } from '@/types';
import styles from '../admin.module.css';

interface ActorCardsEditorProps {
  actorCards: ActorCard[];
  actorTags: string;
  onActorTagsChange: (tags: string) => void;
  onActorChange: (index: number, field: keyof ActorCard, value: string) => void;
  onAddActor: () => void;
  onRemoveActor: (index: number) => void;
}

/** Editor kartu aktor/stakeholder yang nanti di-swipe pengguna. */
export default function ActorCardsEditor({
  actorCards,
  actorTags,
  onActorTagsChange,
  onActorChange,
  onAddActor,
  onRemoveActor,
}: ActorCardsEditorProps) {
  return (
    <div className={styles.formSectionDivider}>
      <div className={styles.sectionHeaderRow}>
        <div>
          <span className={styles.sectionHeading}>
            <Icon name="person" size={18} style={{ color: 'var(--info-text)' }} />
            Profil Stakeholder & Aktor Kunci (Kartu Swipe Evaluasi)
          </span>
          <p className={styles.sectionSubtext}>
            Kartu yang akan digeser (swipe) oleh pengguna saat menilai dampak kebijakan pada tiap aktor.
          </p>
        </div>
        <button
          type="button"
          className={styles.addActorBtn}
          onClick={onAddActor}
          id="btn-add-actor"
        >
          <Icon name="add" size={14} />
          <span>Tambah Aktor</span>
        </button>
      </div>

      <div className={styles.actorCardsContainer}>
        {actorCards.map((actor, idx) => (
          <div key={actor.id || idx} className={styles.actorCardEditRow}>
            <div className={styles.actorCardRowTop}>
              <input
                className={styles.actorEmojiInput}
                value={actor.imageEmoji}
                onChange={(e) => onActorChange(idx, 'imageEmoji', e.target.value)}
                title="Emoji Aktor"
                maxLength={4}
              />
              <input
                className={styles.actorNameInput}
                value={actor.name}
                onChange={(e) => onActorChange(idx, 'name', e.target.value)}
                placeholder="Nama Aktor (cth: Guru & Pendidik)"
              />
              <input
                className={styles.actorRoleInput}
                value={actor.role}
                onChange={(e) => onActorChange(idx, 'role', e.target.value)}
                placeholder="Peran (cth: Pelaksana Lapangan)"
              />
              <button
                type="button"
                className={styles.actorRemoveBtn}
                onClick={() => onRemoveActor(idx)}
                title="Hapus Aktor"
                aria-label="Hapus aktor"
              >
                <Icon name="delete" size={15} />
              </button>
            </div>
            <textarea
              className={styles.actorDescTextarea}
              value={actor.description}
              onChange={(e) => onActorChange(idx, 'description', e.target.value)}
              placeholder="Deskripsi kekhawatiran, posisi, atau beban yang dihadapi aktor terkait isu ini..."
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className={styles.formGroup} style={{ marginTop: '12px' }}>
        <label htmlFor="input-actor-tags" className={styles.formLabel}>Tag Stakeholder Ringkas (Pisahkan koma)</label>
        <input
          className="input"
          placeholder="Contoh: Kemendikdasmen, Guru, Murid, Wali Murid"
          value={actorTags}
          onChange={(e) => onActorTagsChange(e.target.value)}
          id="input-actor-tags"
        />
      </div>
    </div>
  );
}
