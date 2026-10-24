'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import type { PolicyIssue } from '@/types';
import styles from '../admin.module.css';

interface IssueListProps {
  issues: PolicyIssue[];
  isLoading: boolean;
  onToggleStatus: (issue: PolicyIssue) => void;
  onEdit: (issue: PolicyIssue) => void;
  onDelete: (issueId: string, title: string) => void;
}

/** Daftar isu terbit + aksi status/edit/pratinjau/hapus. */
export default function IssueList({ issues, isLoading, onToggleStatus, onEdit, onDelete }: IssueListProps) {
  const router = useRouter();

  return (
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
                      onClick={() => onToggleStatus(issue)}
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
                      onClick={() => onEdit(issue)}
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
                      onClick={() => onDelete(issue.id, issue.title)}
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
  );
}
