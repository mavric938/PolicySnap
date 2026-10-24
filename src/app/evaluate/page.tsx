'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MOCK_ISSUES, MOCK_ACTORS } from '@/data/mock';
import { PolicyIssue } from '@/types';
import { getIssues } from '@/lib/issueService';
import BottomNav from '@/components/BottomNav';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { compositeScore as computeCompositeScore } from '@/lib/scoring';
import { soundService } from '@/lib/soundService';
import { useAuth } from '@/presentation/hooks/useAuth';
import AuthModal from '@/presentation/components/AuthModal';
import {
  ActorVote,
  DEFAULT_FALLBACK_ISSUE,
  EvaluationRecord,
  ScoreKey,
  SwipeDirection,
} from './_components/evaluateConfig';
import EvaluationHistory from './_components/EvaluationHistory';
import StudioHeader from './_components/StudioHeader';
import PolicyCard from './_components/PolicyCard';
import CriteriaSliderStep from './_components/CriteriaSliderStep';
import ActorSwipeStep from './_components/ActorSwipeStep';
import StanceStep from './_components/StanceStep';
import EvaluationDetailModal from './_components/EvaluationDetailModal';
import SubmitSuccessModal from './_components/SubmitSuccessModal';

function EvaluateContent() {
  const searchParams = useSearchParams();
  const explicitIssueId = searchParams.get('issue');

  // If URL has ?issue=xxx, show studio; otherwise show the clean list of evaluated issues
  const { toast, showToast, hideToast } = useToast();
  const [viewMode, setViewMode] = useState<'results' | 'studio'>(explicitIssueId ? 'studio' : 'results');
  const [currentIssueId, setCurrentIssueId] = useState<string>(explicitIssueId || 'issue-001');
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<EvaluationRecord | null>(null);

  const [issue, setIssue] = useState<PolicyIssue>(
    MOCK_ISSUES.find((i) => i.id === (explicitIssueId || currentIssueId)) || DEFAULT_FALLBACK_ISSUE
  );

  const [step, setStep] = useState(0); // 0: sliders, 1: swipe actors, 2: stance & comment

  // Sinkronkan saat ?issue= di URL berubah (pola "adjust state during render", tanpa effect)
  const [syncedIssueId, setSyncedIssueId] = useState(explicitIssueId);
  if (explicitIssueId && explicitIssueId !== syncedIssueId) {
    setSyncedIssueId(explicitIssueId);
    setCurrentIssueId(explicitIssueId);
    setViewMode('studio');
    setStep(0);
  }

  const actors = useMemo(() => {
    if (issue.actorCards && issue.actorCards.length > 0) {
      return issue.actorCards;
    }
    if (MOCK_ACTORS[currentIssueId] && MOCK_ACTORS[currentIssueId].length > 0) {
      return MOCK_ACTORS[currentIssueId];
    }
    const emojis = ['🏛️', '💼', '👥', '🏢', '⚖️'];
    return (issue.actorTags || ['Pemerintah', 'Masyarakat']).map((tag, idx) => ({
      id: `actor-${idx + 1}`,
      name: tag,
      role: 'Stakeholder Kunci',
      description: `Pihak sentral yang berkaitan langsung dengan implementasi ${issue.title}.`,
      imageEmoji: emojis[idx % emojis.length],
    }));
  }, [currentIssueId, issue]);

  const [userXP, setUserXP] = useState(0);

  // Scores
  const [scores, setScores] = useState({
    effectiveness: 7,
    efficiency: 5,
    equity: 4,
    responsiveness: 6,
  });

  // Actor swipe state
  const [currentActorIndex, setCurrentActorIndex] = useState(0);
  const [actorVotes, setActorVotes] = useState<Record<string, ActorVote>>({});
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);

  // Stance & comment
  const [stance, setStance] = useState('Dukung Bersyarat');
  const [comment, setComment] = useState('');
  const { user: authUser, isAuthenticated } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const swipeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bersihkan timer animasi swipe saat halaman ditinggalkan
  useEffect(() => () => {
    if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
  }, []);

  // Load issues and evaluations from backend API & sync titles precisely
  useEffect(() => {
    let isMounted = true;

    getIssues().then((list) => {
      if (!isMounted) return;

      if (Array.isArray(list) && list.length > 0) {
        // Find matching issue by explicit query param, or current state ID, or first backend item
        const targetId = explicitIssueId || currentIssueId;
        const matched = list.find((i) => i.id === targetId) || list[0];
        if (matched) {
          setIssue(matched);
          if (matched.id !== currentIssueId) {
            setCurrentIssueId(matched.id);
          }
        }
      }

      if (typeof window !== 'undefined') {
        const storedList: EvaluationRecord[] = [];
        const histRaw = localStorage.getItem('policysnap_evaluation_history');
        if (histRaw) {
          try {
            const parsed = JSON.parse(histRaw);
            if (Array.isArray(parsed)) storedList.push(...parsed);
          } catch {}
        }

        // Scan any individual policysnap_eval_ keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('policysnap_eval_') && !key.includes('count') && !key.includes('history')) {
            const rawId = key.replace('policysnap_eval_', '');
            if (!storedList.some((item) => item.issueId === rawId)) {
              try {
                const itemData = JSON.parse(localStorage.getItem(key) || '{}');
                if (itemData && itemData.scores) {
                  const issueRef = list.find((it) => it.id === rawId);
                  storedList.push({
                    issueId: rawId,
                    issueTitle: issueRef?.title || itemData.issueTitle || rawId,
                    category: issueRef?.category || itemData.category || 'Kebijakan Publik',
                    scores: itemData.scores,
                    compositeScore: itemData.compositeScore || 6.5,
                    stance: itemData.stance || 'Dukung Bersyarat',
                    comment: itemData.comment || '',
                    timestamp: itemData.timestamp || new Date().toISOString(),
                    actorVotes: itemData.actorVotes,
                  });
                }
              } catch {}
            }
          }
        }

        // CRITICAL: Ensure the issue title and category ALWAYS match the backend registered issue!
        const enriched = storedList.map((item) => {
          const foundIssue = list.find((it) => it.id === item.issueId);
          return {
            ...item,
            issueTitle: foundIssue?.title || item.issueTitle || 'Evaluasi Kebijakan',
            category: foundIssue?.category || item.category || 'Umum',
          };
        });

        setEvaluations(enriched);

        const storedXP = localStorage.getItem('policysnap_xp');
        if (storedXP) setUserXP(Number(storedXP));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [explicitIssueId, currentIssueId]);

  const handleSliderChange = (key: ScoreKey, val: number) => {
    soundService.playTap();
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const compositeScore = computeCompositeScore(scores);

  const handleSwipe = (direction: SwipeDirection) => {
    // Abaikan klik/swipe ganda selama animasi kartu sebelumnya masih berjalan.
    // Pakai ref (bukan state) agar dua klik dalam satu tick pun tetap tertahan.
    if (swipeTimerRef.current) return;
    soundService.playTap();
    const actor = actors[currentActorIndex];
    if (!actor) return;

    setSwipeDirection(direction);
    setActorVotes((prev) => ({
      ...prev,
      [actor.id]: direction === 'right' ? 'approve' : direction === 'left' ? 'reject' : 'neutral',
    }));

    swipeTimerRef.current = setTimeout(() => {
      swipeTimerRef.current = null;
      setSwipeDirection(null);
      if (currentActorIndex < actors.length - 1) {
        setCurrentActorIndex((prev) => prev + 1);
      } else {
        setStep(2);
      }
    }, 280);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!isAuthenticated && !authUser) {
      setShowAuthModal(true);
      return;
    }

    if (!stance) {
      showToast('Pilih pendirian evaluasi terlebih dahulu', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: currentIssueId,
          scores,
          actorVotes,
          stance,
          comment: comment.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setShowAuthModal(true);
        return;
      }
      if (!res.ok) {
        showToast(data.error || 'Gagal mengirim evaluasi. Coba lagi.', 'error');
        return;
      }

      // Simpan riwayat lokal hanya setelah server menerima evaluasi
      const evalData: EvaluationRecord = {
        issueId: currentIssueId,
        issueTitle: issue.title,
        category: issue.category || 'Kebijakan Publik',
        scores,
        actorVotes,
        stance,
        comment,
        compositeScore,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(`policysnap_eval_${currentIssueId}`, JSON.stringify(evalData));
      localStorage.setItem(`evaluated_${currentIssueId}`, 'true');

      const nextHistory = [evalData, ...evaluations.filter((it) => it.issueId !== currentIssueId)];
      localStorage.setItem('policysnap_evaluation_history', JSON.stringify(nextHistory));
      setEvaluations(nextHistory);

      // XP dari server (penilaian ulang tidak menambah XP maupun jumlah evaluasi)
      if (typeof data.totalXP === 'number') {
        setUserXP(data.totalXP);
        localStorage.setItem('policysnap_xp', String(data.totalXP));
      }
      if (data.isFirstEvaluation) {
        const count = Number(localStorage.getItem('policysnap_eval_count') || '0');
        localStorage.setItem('policysnap_eval_count', String(count + 1));
      }

      soundService.playSuccess();
      setShowSuccessModal(true);
    } catch (err) {
      console.warn('Backend evaluation sync warning:', err);
      showToast('Tidak dapat terhubung ke server. Periksa koneksi Anda.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      {viewMode === 'results' ? (
        /* Tampilan 1: daftar isu yang telah dievaluasi */
        <EvaluationHistory evaluations={evaluations} userXP={userXP} onOpenDetail={setSelectedDetail} />
      ) : (
        /* Tampilan 2: Studio Evaluasi (jika tiba dari Beranda) */
        <div>
          <StudioHeader
            step={step}
            userXP={userXP}
            onBack={() => {
              if (step > 0) setStep(step - 1);
              else setViewMode('results');
            }}
          />

          <PolicyCard issue={issue} />

          {step === 0 && (
            <CriteriaSliderStep
              issue={issue}
              scores={scores}
              onScoreChange={handleSliderChange}
              onNext={() => setStep(1)}
            />
          )}

          {step === 1 && (
            <ActorSwipeStep
              actors={actors}
              currentActorIndex={currentActorIndex}
              swipeDirection={swipeDirection}
              onSwipe={handleSwipe}
              onSkip={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <StanceStep
              stance={stance}
              onStanceChange={setStance}
              comment={comment}
              onCommentChange={setComment}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      )}

      {selectedDetail && (
        <EvaluationDetailModal detail={selectedDetail} onClose={() => setSelectedDetail(null)} />
      )}

      {showSuccessModal && (
        <SubmitSuccessModal
          compositeScore={compositeScore}
          issueId={currentIssueId}
          onShowHistory={() => {
            setShowSuccessModal(false);
            setViewMode('results');
          }}
        />
      )}

      {/* Auth Gate Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Masuk untuk Mengirim Evaluasi"
        description="Sesuai standar validitas partisipasi publik PolicySnap, Anda perlu masuk dengan akun terverifikasi sebelum mengirim evaluasi."
      />

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}

      <BottomNav />
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense
      fallback={
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      }
    >
      <EvaluateContent />
    </Suspense>
  );
}
