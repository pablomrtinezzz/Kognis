"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  FileText,
  FolderOpen,
  Layers,
  Loader2,
  Pencil,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useDocuments, type DocumentItem } from "@/hooks/useDocuments";
import { useStudySession } from "@/hooks/useStudySession";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";
import { FolderGrid, useFolders, type Folder } from "@/components/FolderGrid";
import { apiGet } from "@/lib/apiClient";
import { useAuth } from "@/store/AuthContext";

// ─── 3D Flashcard ─────────────────────────────────────────────────────────────

function FlashCard3D({
  front,
  back,
  flipped,
  onFlip,
}: {
  front: string;
  back: string;
  flipped: boolean;
  onFlip: () => void;
}) {
  const glassBase: React.CSSProperties = {
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility:
      "hidden" as React.CSSProperties["WebkitBackfaceVisibility"],
  };

  return (
    <div
      className="relative w-full cursor-pointer select-none"
      style={{ perspective: "1600px", minHeight: 300 }}
      onClick={onFlip}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          width: "100%",
          minHeight: 300,
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 rounded-3xl"
          style={{
            ...glassBase,
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 40px rgba(0,0,0,0.7)",
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)",
            }}
          />
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: "rgba(37,119,255,0.12)",
              border: "1px solid rgba(37,119,255,0.15)",
            }}
          >
            <Brain
              size={15}
              style={{ color: "rgb(37,119,255)" }}
              strokeWidth={2}
            />
          </div>
          <p className="text-white/90 text-lg font-semibold text-center leading-relaxed max-w-xs">
            {front}
          </p>
          <p className="text-[11px] text-white/20 font-medium tracking-widest uppercase">
            tap to reveal · space
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 rounded-3xl"
          style={{
            ...glassBase,
            transform: "rotateY(180deg)",
            background:
              "linear-gradient(145deg, rgba(37,119,255,0.06) 0%, rgba(37,119,255,0.02) 100%)",
            border: "1px solid rgba(37,119,255,0.18)",
            boxShadow:
              "0 0 0 1px rgba(37,119,255,0.18) inset, 0 8px 40px rgba(37,119,255,0.10)",
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(37,119,255,0.25), transparent)",
            }}
          />
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: "rgba(37,119,255,0.15)",
              border: "1px solid rgba(37,119,255,0.20)",
            }}
          >
            <CheckCircle2
              size={15}
              style={{ color: "rgb(37,119,255)" }}
              strokeWidth={2}
            />
          </div>
          <p className="text-white/88 text-base text-center leading-relaxed max-w-xs">
            {back}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Edit flashcard modal ─────────────────────────────────────────────────────

function EditCardModal({
  front,
  back,
  onSave,
  onClose,
}: {
  front: string;
  back: string;
  onSave: (front: string, back: string) => Promise<void>;
  onClose: () => void;
}) {
  const [f, setF] = useState(front);
  const [b, setB] = useState(back);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!f.trim() || !b.trim()) return;
    setSaving(true);
    await onSave(f.trim(), b.trim());
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <GlassPanel
        glow
        className="w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white/70">Edit flashcard</p>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5">
              Question
            </p>
            <textarea
              value={f}
              onChange={(e) => setF(e.target.value)}
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/85 focus:outline-none focus:border-blue-500/40 resize-none"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5">
              Answer
            </p>
            <textarea
              value={b}
              onChange={(e) => setB(e.target.value)}
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/85 focus:outline-none focus:border-blue-500/40 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 transition-colors"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !f.trim() || !b.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{
              backgroundColor: "rgba(37,119,255,0.14)",
              border: "1px solid rgba(37,119,255,0.25)",
              color: "rgb(37,119,255)",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}

// ─── Leitner progress dots ────────────────────────────────────────────────────

function BoxDots({ box }: { box: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((b) => (
          <div
            key={b}
            className="rounded-full transition-all duration-400"
            style={{
              width: b <= box ? 20 : 12,
              height: 5,
              backgroundColor:
                b <= box ? "rgb(37,119,255)" : "rgba(255,255,255,0.08)",
              ...(b <= box
                ? { boxShadow: "0 0 8px rgba(37,119,255,0.5)" }
                : {}),
            }}
          />
        ))}
      </div>
      <span className="text-[10px] text-white/25 font-semibold tracking-widest uppercase">
        Box {box}
      </span>
    </div>
  );
}

// ─── Study view ───────────────────────────────────────────────────────────────

function StudyView({
  documentId,
  all,
  onExit,
  onRepeatAll,
}: {
  documentId?: string;
  all?: boolean;
  onExit: () => void;
  onRepeatAll: () => void;
}) {
  const {
    currentCard,
    stats,
    loading,
    submitting,
    isDone,
    submitReview,
    skipCard,
    deleteCard,
    editCard,
    restart,
  } = useStudySession(documentId, all);

  const [flipped, setFlipped] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const toast = useToast();

  // D3 — Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editOpen) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.code === "ArrowRight" && flipped && !submitting) {
        handleAnswer(true);
      }
      if (e.code === "ArrowLeft" && flipped && !submitting) {
        handleAnswer(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, submitting, editOpen]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setFlipped(false);
      setDeleteConfirm(false);
      setTimeout(() => submitReview(correct), 200);
    },
    [submitReview],
  );

  const handleDelete = async () => {
    if (!currentCard) return;
    try {
      await deleteCard(currentCard.id);
      setDeleteConfirm(false);
      setFlipped(false);
      toast("Flashcard deleted", "success");
    } catch {
      toast("Could not delete card. Try again.", "error");
    }
  };

  const handleEdit = async (front: string, back: string) => {
    if (!currentCard) return;
    try {
      await editCard(currentCard.id, front, back);
      toast("Card updated", "success");
    } catch {
      toast("Could not save changes.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2
          size={22}
          style={{ color: "rgb(37,119,255)" }}
          className="animate-spin"
        />
        <p className="text-white/30 text-sm">Loading cards…</p>
      </div>
    );
  }

  if (isDone && stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
        <GlassPanel
          variant="elevated"
          className="w-16 h-16 flex items-center justify-center"
        >
          <CheckCircle2 size={22} className="text-white/25" />
        </GlassPanel>
        <div>
          <p className="text-white/70 font-semibold">No cards due</p>
          <p className="text-white/30 text-sm mt-1">
            Come back later — you&apos;re all caught up.
          </p>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to dashboard
        </button>
      </div>
    );
  }

  if (isDone) {
    const pct =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-7 px-4">
        <GlassPanel
          variant="primary"
          glow
          className="flex items-center justify-center p-5"
        >
          <Zap size={26} style={{ color: "rgb(37,119,255)" }} strokeWidth={2} />
        </GlassPanel>

        <div>
          <h2 className="text-2xl font-bold text-white/90 tracking-tight">
            Session done
          </h2>
          <p className="text-white/35 text-sm mt-1">
            {stats.total} card{stats.total !== 1 ? "s" : ""} reviewed
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 w-full max-w-[340px]">
          {[
            {
              label: "Correct",
              value: stats.correct,
              color: "rgb(52,211,153)",
            },
            {
              label: "Missed",
              value: stats.incorrect,
              color: "rgb(248,113,113)",
            },
            {
              label: "Skipped",
              value: stats.skipped,
              color: "rgba(255,255,255,0.40)",
            },
            { label: "Score", value: `${pct}%`, color: "rgb(37,119,255)" },
          ].map(({ label, value, color }) => (
            <GlassPanel
              key={label}
              glow
              className="py-4 flex flex-col items-center gap-1.5"
            >
              <span className="text-xl font-bold" style={{ color }}>
                {value}
              </span>
              <span className="text-[10px] text-white/25 font-semibold uppercase tracking-wider">
                {label}
              </span>
            </GlassPanel>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white/50 text-sm font-semibold hover:text-white/75 transition-all duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ChevronLeft size={14} />
            Volver
          </button>
          {!all && (
            <button
              onClick={restart}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              <RotateCcw size={14} />
              Solo pendientes
            </button>
          )}
          <button
            onClick={onRepeatAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: "rgba(37,119,255,0.10)",
              border: "1px solid rgba(37,119,255,0.22)",
              color: "rgb(37,119,255)",
            }}
          >
            <RotateCcw size={14} />
            Repetir todo
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const reviewed = stats.correct + stats.incorrect + stats.skipped;
  const progress = stats.total > 0 ? (reviewed / stats.total) * 100 : 0;

  return (
    <>
      {editOpen && (
        <EditCardModal
          front={currentCard.front}
          back={currentCard.back}
          onSave={handleEdit}
          onClose={() => setEditOpen(false)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-white/35 hover:text-white/65 transition-colors text-sm font-medium"
          >
            <ChevronLeft size={15} />
            Back
          </button>
          <div className="flex items-center gap-2">
            {/* D2 — Skip */}
            <button
              onClick={() => {
                skipCard();
                setFlipped(false);
                setDeleteConfirm(false);
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-white/25 hover:text-white/55 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
              title="Skip card (doesn't count)"
            >
              <SkipForward size={12} />
              Skip
            </button>
            <span className="text-xs text-white/30 font-semibold tabular-nums">
              {reviewed + 1} / {stats.total}
            </span>
          </div>
        </div>

        <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: "rgb(37,119,255)",
              boxShadow: "0 0 8px rgba(37,119,255,0.5)",
            }}
          />
        </div>

        <BoxDots box={currentCard.box} />

        <FlashCard3D
          key={currentCard.id}
          front={currentCard.front}
          back={currentCard.back}
          flipped={flipped}
          onFlip={() => {
            setFlipped((f) => !f);
            setDeleteConfirm(false);
          }}
        />

        {/* Answer buttons */}
        <div
          className="grid grid-cols-2 gap-3 transition-all duration-300"
          style={{
            opacity: flipped ? 1 : 0,
            transform: flipped ? "translateY(0)" : "translateY(10px)",
            pointerEvents: flipped ? "auto" : "none",
          }}
        >
          <button
            onClick={() => handleAnswer(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl text-red-400 font-bold text-sm active:scale-[0.97] transition-all duration-200 disabled:opacity-40"
            style={{
              backgroundColor: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.16)",
            }}
          >
            <XCircle size={16} strokeWidth={2} />
            Didn&apos;t know
          </button>
          <button
            onClick={() => handleAnswer(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl text-emerald-400 font-bold text-sm active:scale-[0.97] transition-all duration-200 disabled:opacity-40"
            style={{
              backgroundColor: "rgba(16,185,129,0.07)",
              border: "1px solid rgba(16,185,129,0.16)",
            }}
          >
            <CheckCircle2 size={16} strokeWidth={2} />
            Got it
          </button>
        </div>

        {/* D1/A1 — Edit / Delete card (visible once flipped) */}
        <div
          className="flex items-center justify-center gap-3 transition-all duration-300"
          style={{
            opacity: flipped ? 1 : 0,
            pointerEvents: flipped ? "auto" : "none",
          }}
        >
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-white/25 hover:text-white/55 px-3 py-1.5 rounded-full hover:bg-white/[0.05] transition-all duration-200"
          >
            <Pencil size={11} />
            Edit card
          </button>

          {deleteConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="text-[11px] font-bold text-red-400 px-3 py-1.5 rounded-full hover:bg-red-400/[0.08] transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-[11px] text-white/30 px-2 py-1.5 rounded-full hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white/20 hover:text-red-400 px-3 py-1.5 rounded-full hover:bg-red-400/[0.06] transition-all duration-200"
            >
              <Trash2 size={11} />
              Delete card
            </button>
          )}

          <span className="text-[10px] text-white/15 hidden md:block">
            ← wrong · right →
          </span>
        </div>
      </div>
    </>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onUpload,
  stage,
  message,
}: {
  onUpload: (file: File) => void;
  stage: string;
  message: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const isActive = stage === "uploading" || stage === "processing";

  const handleFile = (file: File | undefined) => {
    if (file?.type === "application/pdf") onUpload(file);
  };

  let borderColor = "rgba(255,255,255,0.07)";
  let bgColor = "rgba(255,255,255,0.015)";
  if (isActive) {
    borderColor = "rgba(37,119,255,0.25)";
    bgColor = "rgba(37,119,255,0.03)";
  } else if (dragging) {
    borderColor = "rgba(37,119,255,0.45)";
    bgColor = "rgba(37,119,255,0.05)";
  } else if (stage === "done") {
    borderColor = "rgba(16,185,129,0.25)";
    bgColor = "rgba(16,185,129,0.04)";
  } else if (stage === "error") {
    borderColor = "rgba(239,68,68,0.25)";
    bgColor = "rgba(239,68,68,0.04)";
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!isActive) handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => !isActive && inputRef.current?.click()}
      className="relative flex flex-col items-center justify-center gap-4 py-10 px-6 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden"
      style={{
        borderColor,
        backgroundColor: bgColor,
        ...(dragging ? { transform: "scale(1.01)" } : {}),
      }}
    >
      {dragging && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(37,119,255,0.04), transparent)",
          }}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
        style={
          isActive
            ? {
                backgroundColor: "rgba(37,119,255,0.10)",
                border: "1px solid rgba(37,119,255,0.18)",
              }
            : stage === "done"
              ? {
                  backgroundColor: "rgba(16,185,129,0.10)",
                  border: "1px solid rgba(16,185,129,0.18)",
                }
              : stage === "error"
                ? {
                    backgroundColor: "rgba(239,68,68,0.10)",
                    border: "1px solid rgba(239,68,68,0.18)",
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }
        }
      >
        {isActive ? (
          <Loader2
            size={20}
            style={{ color: "rgb(37,119,255)" }}
            className="animate-spin"
          />
        ) : stage === "done" ? (
          <CheckCircle2 size={20} className="text-emerald-400" />
        ) : stage === "error" ? (
          <XCircle size={20} className="text-red-400" />
        ) : (
          <UploadCloud
            size={18}
            style={{
              color: dragging ? "rgb(37,119,255)" : "rgba(255,255,255,0.35)",
            }}
          />
        )}
      </div>

      <div className="text-center relative z-10">
        {isActive ? (
          <p className="text-sm font-medium text-white/50">{message}</p>
        ) : stage === "done" ? (
          <p className="text-sm font-semibold text-emerald-400">{message}</p>
        ) : stage === "error" ? (
          <p className="text-sm font-semibold text-red-400">{message}</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-white/50">
              {dragging ? "Drop to upload" : "Drop a PDF here"}
            </p>
            <p className="text-xs text-white/25 mt-1">
              or click to browse — AI generates flashcards instantly
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ABC Quiz ─────────────────────────────────────────────────────────────────

interface AbcTest {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
}

function AbcQuizPanel({ docId }: { docId: string }) {
  const { session } = useAuth();
  const token = session?.access_token;

  const [tests, setTests] = useState<AbcTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<AbcTest[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet<AbcTest[]>(`/api/v1/documents/${docId}/abc-tests`, token)
      .then((data) => {
        setTests(data);
        setQueue([...data].sort(() => Math.random() - 0.5));
      })
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, [docId, token]);

  const restart = () => {
    setQueue([...tests].sort(() => Math.random() - 0.5));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 rounded-xl animate-pulse"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          />
        ))}
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <p className="text-xs text-white/25 italic py-2">
        Sin tests disponibles. Vuelve a procesar el documento para generarlos.
      </p>
    );
  }

  if (done) {
    const pct = Math.round((score / queue.length) * 100);
    const color =
      pct >= 80
        ? "rgb(16,185,129)"
        : pct >= 50
          ? "rgb(37,119,255)"
          : "rgb(239,68,68)";
    return (
      <div className="flex flex-col items-center gap-4 py-3">
        <div
          className="w-16 h-16 rounded-full flex flex-col items-center justify-center"
          style={{
            backgroundColor: `${color}18`,
            border: `1px solid ${color}30`,
          }}
        >
          <span className="text-xl font-bold tabular-nums" style={{ color }}>
            {pct}%
          </span>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/80">
            {score}/{queue.length} correctas
          </p>
          <p className="text-[11px] text-white/30 mt-0.5">
            {pct >= 80
              ? "¡Excelente dominio!"
              : pct >= 50
                ? "Sigue practicando"
                : "Repasa el material"}
          </p>
        </div>
        <button
          onClick={restart}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.97]"
          style={{
            backgroundColor: "rgba(37,119,255,0.10)",
            border: "1px solid rgba(37,119,255,0.20)",
            color: "rgb(37,119,255)",
          }}
        >
          <RotateCcw size={12} strokeWidth={2.5} />
          Repetir
        </button>
      </div>
    );
  }

  const q = queue[current];
  const answered = selected !== null;
  const isLast = current + 1 >= queue.length;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    if (idx === q.correct_index) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (isLast) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar + counter */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((current + (answered ? 1 : 0)) / queue.length) * 100}%`,
              background:
                "linear-gradient(to right, rgba(37,119,255,0.70), rgb(37,119,255))",
            }}
          />
        </div>
        <span className="text-[10px] text-white/30 font-semibold tabular-nums shrink-0">
          {current + 1}/{queue.length}
        </span>
      </div>

      {/* Question */}
      <p className="text-sm font-semibold text-white/80 leading-snug">
        {q.question}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-1.5">
        {q.options.map((opt, idx) => {
          const isCorrect = idx === q.correct_index;
          const isSelected = idx === selected;
          let bg = "rgba(255,255,255,0.03)";
          let border = "rgba(255,255,255,0.07)";
          let textColor = "rgba(255,255,255,0.60)";
          let labelColor = "rgba(255,255,255,0.20)";

          if (answered) {
            if (isCorrect) {
              bg = "rgba(16,185,129,0.10)";
              border = "rgba(16,185,129,0.30)";
              textColor = "rgba(16,185,129,0.90)";
              labelColor = "rgba(16,185,129,0.60)";
            } else if (isSelected) {
              bg = "rgba(239,68,68,0.08)";
              border = "rgba(239,68,68,0.25)";
              textColor = "rgba(239,68,68,0.70)";
              labelColor = "rgba(239,68,68,0.40)";
            } else {
              textColor = "rgba(255,255,255,0.20)";
              labelColor = "rgba(255,255,255,0.10)";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className="flex items-start gap-2.5 w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: bg,
                border: `1px solid ${border}`,
                cursor: answered ? "default" : "pointer",
              }}
            >
              <span
                className="shrink-0 w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold mt-[1px]"
                style={{
                  backgroundColor: `${labelColor}30`,
                  color: labelColor,
                  border: `1px solid ${labelColor}`,
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span
                className="text-xs leading-snug font-medium"
                style={{ color: textColor }}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next / Finish button */}
      {answered && (
        <button
          onClick={handleNext}
          className="w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.98] mt-1"
          style={{
            backgroundColor: "rgba(37,119,255,0.10)",
            border: "1px solid rgba(37,119,255,0.20)",
            color: "rgb(37,119,255)",
          }}
        >
          {isLast ? "Ver resultado →" : "Siguiente →"}
        </button>
      )}
    </div>
  );
}

// ─── Summary renderer ─────────────────────────────────────────────────────────

function SummaryContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      nodes.push(
        <p
          key={key++}
          className="text-[11px] font-bold uppercase tracking-[0.10em] mt-4 mb-1.5 first:mt-0"
          style={{ color: "rgba(37,119,255,0.75)" }}
        >
          {line.slice(3)}
        </p>,
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      nodes.push(
        <div key={key++} className="flex gap-2 py-0.5">
          <span className="shrink-0 mt-[5px] w-1 h-1 rounded-full bg-white/20" />
          <span className="text-xs text-white/55 leading-relaxed">
            {line.slice(2)}
          </span>
        </div>,
      );
    } else if (line.trim()) {
      nodes.push(
        <p key={key++} className="text-xs text-white/50 leading-relaxed py-0.5">
          {line}
        </p>,
      );
    }
  }
  return <div className="space-y-0.5">{nodes}</div>;
}

function DeckSummaryPanel({ docId }: { docId: string }) {
  const { session } = useAuth();
  const token = session?.access_token;
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<{ content: string }>(
          `/api/v1/documents/${docId}/summary`,
          token,
        );
        setSummary(data.content);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [docId, token]);

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-3 rounded animate-pulse"
            style={{
              width: i === 2 ? "70%" : "100%",
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          />
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <p className="text-xs text-white/25 italic py-2">
        Sin resumen disponible. Vuelve a procesar el documento para generarlo.
      </p>
    );
  }

  return <SummaryContent text={summary} />;
}

// ─── Deck card ────────────────────────────────────────────────────────────────

function DeckCard({
  doc,
  folders,
  assignments,
  onStudy,
  onAssign,
  onDelete,
}: {
  doc: DocumentItem;
  folders: Folder[];
  assignments: Record<string, string>;
  onStudy: (id: string, all?: boolean) => void;
  onAssign: (docId: string, folderId: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<"flashcards" | "resumen" | "tests">(
    "flashcards",
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const toast = useToast();
  const name = doc.file_name.replace(/\.pdf$/i, "");
  const hasDue = doc.due_count > 0;
  const hasCards = doc.flashcard_count > 0;
  const masteryPct = hasCards
    ? Math.max(4, 100 - (doc.due_count / doc.flashcard_count) * 100)
    : 0;
  const currentFolder = folders.find((f) => assignments[doc.id] === f.id);

  const handleDelete = async () => {
    try {
      await onDelete(doc.id);
      toast(`"${name}" eliminado`, "success");
    } catch {
      toast("No se pudo eliminar. Inténtalo de nuevo.", "error");
    }
  };

  return (
    <GlassPanel hover glow className="p-5 flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        >
          <FileText size={15} className="text-white/35" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white/85 text-sm truncate leading-tight">
            {name}
          </p>
          <p className="text-[11px] text-white/30 mt-0.5 font-medium">
            {hasCards
              ? `${doc.flashcard_count} tarjetas`
              : "Sin tarjetas — procesa el PDF para generarlas"}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasDue && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "rgba(37,119,255,0.12)",
                border: "1px solid rgba(37,119,255,0.20)",
                color: "rgb(37,119,255)",
              }}
            >
              <Sparkles size={9} strokeWidth={2.5} />
              {doc.due_count}
            </span>
          )}
          {deleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="text-[10px] font-bold text-red-400 px-1.5 py-0.5 rounded-lg hover:bg-red-400/[0.08] transition-colors"
              >
                Borrar
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-[10px] text-white/30 px-1.5 py-0.5 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-white/15 hover:text-red-400 p-1 rounded-lg hover:bg-red-400/[0.06] transition-all duration-200"
              aria-label="Eliminar deck"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      {hasCards && (
        <div
          className="flex gap-1 p-0.5 rounded-xl"
          style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
        >
          {(
            [
              { id: "flashcards", label: "Flashcards" },
              { id: "resumen", label: "Resumen" },
              { id: "tests", label: "Tests" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200"
              style={
                tab === id
                  ? {
                      backgroundColor: "rgba(37,119,255,0.14)",
                      color: "rgb(37,119,255)",
                      border: "1px solid rgba(37,119,255,0.22)",
                    }
                  : {
                      color: "rgba(255,255,255,0.30)",
                      border: "1px solid transparent",
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Flashcards tab ── */}
      {(!hasCards || tab === "flashcards") && (
        <>
          {hasCards && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/20 font-semibold uppercase tracking-wider">
                  Dominio
                </span>
                <span className="text-[10px] text-white/30 tabular-nums font-semibold">
                  {Math.round(masteryPct)}%
                </span>
              </div>
              <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${masteryPct}%`,
                    background:
                      "linear-gradient(to right, rgba(37,119,255,0.70), rgb(37,119,255))",
                  }}
                />
              </div>
            </div>
          )}

          {/* Folder assignment — no "No folder" option */}
          {folders.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setPickerOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-200"
                style={{
                  color: currentFolder
                    ? "rgba(37,119,255,0.70)"
                    : "rgba(255,255,255,0.25)",
                }}
              >
                <FolderOpen size={12} strokeWidth={1.75} />
                {currentFolder ? currentFolder.name : "Sin carpeta"}
              </button>

              {pickerOpen && (
                <div
                  className="absolute bottom-full mb-1 left-0 z-20 rounded-xl overflow-hidden min-w-[160px]"
                  style={{
                    backgroundColor: "rgba(11,11,20,0.97)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                >
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        onAssign(doc.id, f.id);
                        setPickerOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs transition-colors"
                      style={{
                        color:
                          assignments[doc.id] === f.id
                            ? "rgb(37,119,255)"
                            : "rgba(255,255,255,0.60)",
                        backgroundColor:
                          assignments[doc.id] === f.id
                            ? "rgba(37,119,255,0.07)"
                            : "transparent",
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasCards && (
            <button
              onClick={() => onStudy(doc.id, !hasDue)}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98]"
              style={
                hasDue
                  ? {
                      backgroundColor: "rgba(37,119,255,0.10)",
                      border: "1px solid rgba(37,119,255,0.20)",
                      color: "rgb(37,119,255)",
                    }
                  : {
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.35)",
                    }
              }
            >
              {hasDue ? "Estudiar ahora" : "Repasar todo ↺"}
            </button>
          )}
        </>
      )}

      {/* ── Resumen tab ── */}
      {hasCards && tab === "resumen" && <DeckSummaryPanel docId={doc.id} />}

      {/* ── Tests tab ── */}
      {hasCards && tab === "tests" && <AbcQuizPanel docId={doc.id} />}
    </GlassPanel>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────

function StatsStrip({
  totalDue,
  totalCards,
  deckCount,
}: {
  totalDue: number;
  totalCards: number;
  deckCount: number;
}) {
  const items = [
    { label: "Due today", value: totalDue, highlight: totalDue > 0 },
    { label: "Total cards", value: totalCards, highlight: false },
    { label: "Decks", value: deckCount, highlight: false },
  ];

  return (
    <GlassPanel glow className="p-1">
      <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
        {items.map(({ label, value, highlight }) => (
          <div key={label} className="flex flex-col items-center gap-1 py-4">
            <span
              className="text-2xl font-bold tabular-nums tracking-tight"
              style={{
                color: highlight ? "rgb(37,119,255)" : "rgba(255,255,255,0.75)",
              }}
            >
              {value}
            </span>
            <span className="text-[10px] text-white/25 font-semibold uppercase tracking-wider text-center leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// ─── Deck list ────────────────────────────────────────────────────────────────

function DeckList({
  documents,
  folders,
  assignments,
  loading,
  onStudy,
  onAssign,
  onDelete,
}: {
  documents: DocumentItem[];
  folders: Folder[];
  assignments: Record<string, string>;
  loading: boolean;
  onStudy: (id: string, all?: boolean) => void;
  onAssign: (docId: string, folderId: string | null) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <GlassPanel key={i} className="h-[110px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <GlassPanel className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div
          className="w-14 h-14 rounded-3xl flex items-center justify-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Brain size={22} className="text-white/18" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-white/50 font-semibold text-sm">
            No decks here yet
          </p>
          <p className="text-white/25 text-xs mt-1 max-w-[220px] mx-auto leading-relaxed">
            Upload a PDF and Kognis will generate flashcards with AI.
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <DeckCard
          key={doc.id}
          doc={doc}
          folders={folders}
          assignments={assignments}
          onStudy={onStudy}
          onAssign={onAssign}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ─── Dashboard view ───────────────────────────────────────────────────────────

function DashboardView({
  onStartAll,
  onStudyDeck,
}: {
  onStartAll: () => void;
  onStudyDeck: (id: string, all?: boolean) => void;
}) {
  const {
    documents,
    loading,
    uploadState,
    uploadAndProcess,
    deleteDocument,
    resetUpload,
  } = useDocuments();

  const {
    folders,
    assignments,
    createFolder,
    deleteFolder,
    renameFolder,
    assignDocument,
    reload: reloadFolders,
  } = useFolders();

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const visibleDocuments = selectedFolder
    ? documents.filter((d) => assignments[d.id] === selectedFolder.id)
    : documents;

  const folderDue = visibleDocuments.reduce((s, d) => s + d.due_count, 0);
  const folderCards = visibleDocuments.reduce(
    (s, d) => s + d.flashcard_count,
    0,
  );

  // After a successful upload the Dexie assignment was written inside the hook;
  // reload folder assignments so the DeckCard picker reflects the change.
  const prevStage = useRef(uploadState.stage);
  useEffect(() => {
    if (prevStage.current !== "done" && uploadState.stage === "done") {
      reloadFolders();
    }
    prevStage.current = uploadState.stage;
  }, [uploadState.stage, reloadFolders]);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          {selectedFolder ? (
            <button
              onClick={() => setSelectedFolder(null)}
              className="flex items-center gap-1.5 text-white/35 hover:text-white/65 transition-colors text-xs font-medium mb-1"
            >
              <ChevronLeft size={13} />
              Folders
            </button>
          ) : (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-0.5">
              Cognitive module
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-white/92">
            {selectedFolder ? selectedFolder.name : "Study"}
          </h1>
        </div>
      </div>

      {selectedFolder === null ? (
        /* ── ROOT: folders only ─────────────────────────────────────── */
        <FolderGrid
          folders={folders}
          documents={documents}
          assignments={assignments}
          onSelectFolder={setSelectedFolder}
          onCreateFolder={(name) => createFolder(name)}
          onDeleteFolder={deleteFolder}
          onRenameFolder={renameFolder}
        />
      ) : (
        /* ── FOLDER VIEW ────────────────────────────────────────────── */
        <>
          {/* Study-all CTA */}
          {folderDue > 0 && (
            <button
              onClick={onStartAll}
              className="w-full flex items-center gap-4 p-5 rounded-3xl active:scale-[0.99] transition-all duration-300"
              style={{
                backgroundColor: "rgba(37,119,255,0.07)",
                border: "1px solid rgba(37,119,255,0.16)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(37,119,255,0.12)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(37,119,255,0.26)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(37,119,255,0.07)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(37,119,255,0.16)";
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(37,119,255,0.14)",
                  border: "1px solid rgba(37,119,255,0.18)",
                }}
              >
                <Brain
                  size={18}
                  style={{ color: "rgb(37,119,255)" }}
                  strokeWidth={2}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-white/90 text-sm">
                  {folderDue} card{folderDue !== 1 ? "s" : ""} ready for review
                </p>
                <p
                  className="text-xs mt-0.5 font-medium tracking-wide"
                  style={{ color: "rgba(37,119,255,0.55)" }}
                >
                  Start session →
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(37,119,255,0.12)",
                  border: "1px solid rgba(37,119,255,0.16)",
                }}
              >
                <Layers size={14} style={{ color: "rgb(37,119,255)" }} />
              </div>
            </button>
          )}

          {/* Folder stats */}
          {!loading && visibleDocuments.length > 0 && (
            <StatsStrip
              totalDue={folderDue}
              totalCards={folderCards}
              deckCount={visibleDocuments.length}
            />
          )}

          {/* Upload zone — auto-assigns to this folder */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-3">
              Add material
            </p>
            <UploadZone
              onUpload={(file) => uploadAndProcess(file, selectedFolder.id)}
              stage={uploadState.stage}
              message={uploadState.message}
            />
            {(uploadState.stage === "done" ||
              uploadState.stage === "error") && (
              <button
                onClick={resetUpload}
                className="mt-2 w-full text-center text-xs text-white/25 hover:text-white/45 transition-colors py-1.5"
              >
                Upload another
              </button>
            )}
          </div>

          {/* Deck list */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-4">
              Decks
            </p>
            <DeckList
              documents={visibleDocuments}
              folders={folders}
              assignments={assignments}
              loading={loading}
              onStudy={onStudyDeck}
              onAssign={assignDocument}
              onDelete={deleteDocument}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type View =
  | { mode: "dashboard" }
  | { mode: "study"; documentId?: string; all?: boolean };

export default function StudyPage() {
  const [view, setView] = useState<View>({ mode: "dashboard" });

  if (view.mode === "study") {
    const { documentId, all } = view;
    return (
      <StudyView
        documentId={documentId}
        all={all}
        onExit={() => setView({ mode: "dashboard" })}
        onRepeatAll={() => setView({ mode: "study", documentId, all: true })}
      />
    );
  }

  return (
    <DashboardView
      onStartAll={() => setView({ mode: "study" })}
      onStudyDeck={(id, all) => setView({ mode: "study", documentId: id, all })}
    />
  );
}
