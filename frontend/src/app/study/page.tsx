"use client";

import { useCallback, useRef, useState } from "react";
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
  UploadCloud,
  XCircle,
  Zap,
} from "lucide-react";
import { useDocuments, type DocumentItem } from "@/hooks/useDocuments";
import { useStudySession } from "@/hooks/useStudySession";
import { GlassPanel } from "@/components/ui/GlassPanel";

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
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 rounded-3xl bg-white/[0.03] border border-white/[0.09] backdrop-blur-xl shadow-glass"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />
          <div className="w-9 h-9 rounded-2xl bg-primary/[0.12] border border-primary/[0.15] flex items-center justify-center">
            <Brain size={15} className="text-primary" strokeWidth={2} />
          </div>
          <p className="text-white/90 text-lg font-semibold text-center leading-relaxed max-w-xs">
            {front}
          </p>
          <p className="text-[11px] text-white/20 font-medium tracking-widest uppercase">
            tap to reveal
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 rounded-3xl bg-primary/[0.06] border border-primary/[0.18] backdrop-blur-xl shadow-primary-panel"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.25] to-transparent" />
          <div className="w-9 h-9 rounded-2xl bg-primary/[0.15] border border-primary/[0.20] flex items-center justify-center">
            <CheckCircle2 size={15} className="text-primary" strokeWidth={2} />
          </div>
          <p className="text-white/88 text-base text-center leading-relaxed max-w-xs">
            {back}
          </p>
        </div>
      </div>
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
            className={`rounded-full transition-all duration-400 ${
              b <= box
                ? "bg-primary w-5 h-[5px] shadow-[0_0_8px_rgba(37,119,255,0.5)]"
                : "bg-white/[0.08] w-3 h-[5px]"
            }`}
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
  onExit,
}: {
  documentId?: string;
  onExit: () => void;
}) {
  const { currentCard, stats, loading, submitting, isDone, submitReview } =
    useStudySession(documentId);
  const [flipped, setFlipped] = useState(false);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setFlipped(false);
      setTimeout(() => submitReview(correct), 200);
    },
    [submitReview],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={22} className="text-primary animate-spin" />
        <p className="text-white/30 text-sm">Loading cards…</p>
      </div>
    );
  }

  if (isDone && stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
        <GlassPanel
          className="w-16 h-16 flex items-center justify-center"
          variant="elevated"
        >
          <CheckCircle2 size={22} className="text-white/25" />
        </GlassPanel>
        <div>
          <p className="text-white/70 font-semibold">No cards due</p>
          <p className="text-white/30 text-sm mt-1">
            Come back later — you're all caught up.
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
          className="w-18 h-18 flex items-center justify-center p-5"
        >
          <Zap size={26} className="text-primary" strokeWidth={2} />
        </GlassPanel>

        <div>
          <h2 className="text-2xl font-bold text-white/90 tracking-tight">
            Session done
          </h2>
          <p className="text-white/35 text-sm mt-1">
            {stats.total} card{stats.total !== 1 ? "s" : ""} reviewed
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-[300px]">
          {[
            {
              label: "Correct",
              value: stats.correct,
              color: "text-emerald-400",
            },
            { label: "Missed", value: stats.incorrect, color: "text-red-400" },
            { label: "Score", value: `${pct}%`, color: "text-primary" },
          ].map(({ label, value, color }) => (
            <GlassPanel
              key={label}
              glow
              className="py-4 flex flex-col items-center gap-1.5"
            >
              <span className={`text-xl font-bold ${color}`}>{value}</span>
              <span className="text-[10px] text-white/25 font-semibold uppercase tracking-wider">
                {label}
              </span>
            </GlassPanel>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white/50 text-sm font-semibold hover:border-white/[0.14] hover:text-white/75 transition-all duration-200"
          >
            <ChevronLeft size={14} />
            Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/[0.10] border border-primary/[0.22] text-primary text-sm font-semibold hover:bg-primary/[0.18] hover:shadow-primary-glow transition-all duration-200"
          >
            <RotateCcw size={14} />
            Study again
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const reviewed = stats.correct + stats.incorrect;
  const progress = stats.total > 0 ? (reviewed / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-white/35 hover:text-white/65 transition-colors text-sm font-medium"
        >
          <ChevronLeft size={15} />
          Back
        </button>
        <span className="text-xs text-white/30 font-semibold tabular-nums">
          {reviewed + 1} / {stats.total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(37,119,255,0.5)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <BoxDots box={currentCard.box} />

      <FlashCard3D
        key={currentCard.id}
        front={currentCard.front}
        back={currentCard.back}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
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
          className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-red-500/[0.07] border border-red-500/[0.16] text-red-400 font-bold text-sm hover:bg-red-500/[0.13] hover:border-red-500/[0.26] hover:shadow-[0_0_20px_rgba(239,68,68,0.07)] active:scale-[0.97] transition-all duration-200 disabled:opacity-40"
        >
          <XCircle size={16} strokeWidth={2} />
          Didn't know
        </button>
        <button
          onClick={() => handleAnswer(true)}
          disabled={submitting}
          className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/[0.16] text-emerald-400 font-bold text-sm hover:bg-emerald-500/[0.13] hover:border-emerald-500/[0.26] hover:shadow-[0_0_20px_rgba(16,185,129,0.07)] active:scale-[0.97] transition-all duration-200 disabled:opacity-40"
        >
          <CheckCircle2 size={16} strokeWidth={2} />
          Got it
        </button>
      </div>
    </div>
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

  const handleFile = (file: File | undefined) => {
    if (file?.type === "application/pdf") onUpload(file);
  };

  const isActive = stage === "uploading" || stage === "processing";

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
      className={`relative flex flex-col items-center justify-center gap-4 py-10 px-6 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden ${
        isActive
          ? "border-primary/25 bg-primary/[0.03] cursor-default"
          : dragging
            ? "border-primary/45 bg-primary/[0.05] scale-[1.01] shadow-primary-glow"
            : stage === "done"
              ? "border-emerald-500/25 bg-emerald-500/[0.04]"
              : stage === "error"
                ? "border-red-500/25 bg-red-500/[0.04]"
                : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03]"
      }`}
    >
      {/* Subtle shimmer when dragging */}
      {dragging && (
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isActive
            ? "bg-primary/[0.10] border border-primary/[0.18]"
            : stage === "done"
              ? "bg-emerald-500/[0.10] border border-emerald-500/[0.18]"
              : stage === "error"
                ? "bg-red-500/[0.10] border border-red-500/[0.18]"
                : "bg-white/[0.05] border border-white/[0.09]"
        }`}
      >
        {isActive ? (
          <Loader2 size={20} className="text-primary animate-spin" />
        ) : stage === "done" ? (
          <CheckCircle2 size={20} className="text-emerald-400" />
        ) : stage === "error" ? (
          <XCircle size={20} className="text-red-400" />
        ) : (
          <UploadCloud
            size={18}
            className={dragging ? "text-primary" : "text-white/35"}
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

// ─── Deck card ────────────────────────────────────────────────────────────────

function DeckCard({
  doc,
  onStudy,
}: {
  doc: DocumentItem;
  onStudy: (id: string) => void;
}) {
  const name = doc.file_name.replace(/\.pdf$/i, "");
  const hasDue = doc.due_count > 0;
  const hasCards = doc.flashcard_count > 0;
  const masteryPct = hasCards
    ? Math.max(4, 100 - (doc.due_count / doc.flashcard_count) * 100)
    : 0;

  return (
    <GlassPanel hover glow className="p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center shrink-0 mt-0.5">
          <FileText size={15} className="text-white/35" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white/85 text-sm truncate leading-tight">
            {name}
          </p>
          <p className="text-[11px] text-white/30 mt-0.5 font-medium">
            {hasCards
              ? `${doc.flashcard_count} cards`
              : "No cards yet — process to generate"}
          </p>
        </div>

        {hasDue && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/[0.12] border border-primary/[0.20] text-primary shrink-0">
            <Sparkles size={9} strokeWidth={2.5} />
            {doc.due_count}
          </span>
        )}
      </div>

      {hasCards && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/20 font-semibold uppercase tracking-wider">
              Mastery
            </span>
            <span className="text-[10px] text-white/30 tabular-nums font-semibold">
              {Math.round(masteryPct)}%
            </span>
          </div>
          <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
        </div>
      )}

      {hasCards && (
        <button
          onClick={() => onStudy(doc.id)}
          disabled={!hasDue}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            hasDue
              ? "bg-primary/[0.10] border border-primary/[0.20] text-primary hover:bg-primary/[0.18] hover:shadow-[0_0_16px_rgba(37,119,255,0.12)] active:scale-[0.98]"
              : "bg-white/[0.03] border border-white/[0.05] text-white/18 cursor-default"
          }`}
        >
          {hasDue ? "Study now" : "All caught up ✓"}
        </button>
      )}
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
              className={`text-2xl font-bold tabular-nums tracking-tight ${
                highlight ? "text-primary" : "text-white/75"
              }`}
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

// ─── Dashboard view ───────────────────────────────────────────────────────────

function DashboardView({
  onStartAll,
  onStudyDeck,
}: {
  onStartAll: () => void;
  onStudyDeck: (id: string) => void;
}) {
  const {
    documents,
    loading,
    uploadState,
    uploadAndProcess,
    resetUpload,
    totalDue,
    totalCards,
  } = useDocuments();

  const hasDocuments = documents.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-0.5">
          Cognitive module
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white/92">
          Study
        </h1>
      </div>

      {/* Study all CTA */}
      {totalDue > 0 && (
        <button
          onClick={onStartAll}
          className="w-full flex items-center gap-4 p-5 rounded-3xl bg-primary/[0.07] border border-primary/[0.16] hover:bg-primary/[0.12] hover:border-primary/[0.26] hover:shadow-primary-panel active:scale-[0.99] transition-all duration-300 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-primary/[0.14] border border-primary/[0.18] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.22] transition-all duration-300">
            <Brain size={18} className="text-primary" strokeWidth={2} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-white/90 text-sm">
              {totalDue} card{totalDue !== 1 ? "s" : ""} ready for review
            </p>
            <p className="text-xs text-primary/55 mt-0.5 font-medium tracking-wide">
              Start full session →
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/[0.12] border border-primary/[0.16] flex items-center justify-center shrink-0">
            <Layers size={14} className="text-primary" />
          </div>
        </button>
      )}

      {/* Stats */}
      {hasDocuments && (
        <StatsStrip
          totalDue={totalDue}
          totalCards={totalCards}
          deckCount={documents.length}
        />
      )}

      {/* Decks */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-4">
          My decks
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-[110px] rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : !hasDocuments ? (
          <GlassPanel className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-14 h-14 rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Brain size={22} className="text-white/18" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-white/50 font-semibold text-sm">
                Your study space is empty
              </p>
              <p className="text-white/25 text-xs mt-1 max-w-[220px] mx-auto leading-relaxed">
                Upload a PDF below and Kognis will generate flashcards with AI
                instantly.
              </p>
            </div>
          </GlassPanel>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <DeckCard key={doc.id} doc={doc} onStudy={onStudyDeck} />
            ))}
          </div>
        )}
      </div>

      {/* Upload */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-3">
          Add material
        </p>
        <UploadZone
          onUpload={uploadAndProcess}
          stage={uploadState.stage}
          message={uploadState.message}
        />
        {(uploadState.stage === "done" || uploadState.stage === "error") && (
          <button
            onClick={resetUpload}
            className="mt-2 w-full text-center text-xs text-white/25 hover:text-white/45 transition-colors py-1.5"
          >
            Upload another
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type View = { mode: "dashboard" } | { mode: "study"; documentId?: string };

export default function StudyPage() {
  const [view, setView] = useState<View>({ mode: "dashboard" });

  if (view.mode === "study") {
    return (
      <StudyView
        documentId={view.documentId}
        onExit={() => setView({ mode: "dashboard" })}
      />
    );
  }

  return (
    <DashboardView
      onStartAll={() => setView({ mode: "study" })}
      onStudyDeck={(id) => setView({ mode: "study", documentId: id })}
    />
  );
}
