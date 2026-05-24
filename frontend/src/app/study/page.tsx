"use client";

import { useCallback, useRef, useState } from "react";
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  FileText,
  FolderOpen,
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
import { FolderGrid, useFolders, type Folder } from "@/components/FolderGrid";

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
            tap to reveal
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

        <div className="grid grid-cols-3 gap-3 w-full max-w-[300px]">
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

        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white/50 text-sm font-semibold hover:text-white/75 transition-all duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ChevronLeft size={14} />
            Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: "rgba(37,119,255,0.10)",
              border: "1px solid rgba(37,119,255,0.22)",
              color: "rgb(37,119,255)",
            }}
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
        onFlip={() => setFlipped((f) => !f)}
      />

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

// ─── Deck card ────────────────────────────────────────────────────────────────

function DeckCard({
  doc,
  folders,
  assignments,
  onStudy,
  onAssign,
}: {
  doc: DocumentItem;
  folders: Folder[];
  assignments: Record<string, string>;
  onStudy: (id: string) => void;
  onAssign: (docId: string, folderId: string | null) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const name = doc.file_name.replace(/\.pdf$/i, "");
  const hasDue = doc.due_count > 0;
  const hasCards = doc.flashcard_count > 0;
  const masteryPct = hasCards
    ? Math.max(4, 100 - (doc.due_count / doc.flashcard_count) * 100)
    : 0;
  const currentFolder = folders.find((f) => assignments[doc.id] === f.id);

  return (
    <GlassPanel hover glow className="p-5 flex flex-col gap-4">
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
              ? `${doc.flashcard_count} cards`
              : "No cards yet — process to generate"}
          </p>
        </div>

        {hasDue && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
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

      {/* Folder assignment row */}
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
            {currentFolder ? currentFolder.name : "No folder"}
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
              <button
                onClick={() => {
                  onAssign(doc.id, null);
                  setPickerOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-white/40 hover:bg-white/[0.05] hover:text-white/70 transition-colors"
              >
                No folder
              </button>
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
          onClick={() => onStudy(doc.id)}
          disabled={!hasDue}
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
                  border: "1px solid rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.18)",
                  cursor: "default",
                }
          }
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
}: {
  documents: DocumentItem[];
  folders: Folder[];
  assignments: Record<string, string>;
  loading: boolean;
  onStudy: (id: string) => void;
  onAssign: (docId: string, folderId: string | null) => void;
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

  const { folders, assignments, createFolder, deleteFolder, assignDocument } =
    useFolders();

  // null = folder grid, Folder = folder detail
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const visibleDocuments = selectedFolder
    ? documents.filter((d) => assignments[d.id] === selectedFolder.id)
    : documents;

  const folderDue = selectedFolder
    ? visibleDocuments.reduce((s, d) => s + d.due_count, 0)
    : totalDue;

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
              All folders
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

      {/* ── Study-all CTA ── */}
      {folderDue > 0 && (
        <button
          onClick={onStartAll}
          className="w-full flex items-center gap-4 p-5 rounded-3xl active:scale-[0.99] transition-all duration-300 group"
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
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
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
              Start full session →
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

      {/* ── Stats ── */}
      {!loading && documents.length > 0 && !selectedFolder && (
        <StatsStrip
          totalDue={totalDue}
          totalCards={totalCards}
          deckCount={documents.length}
        />
      )}

      {/* ── Folder grid OR folder-detail deck list ── */}
      {selectedFolder === null ? (
        <>
          <FolderGrid
            folders={folders}
            documents={documents}
            assignments={assignments}
            onSelectFolder={setSelectedFolder}
            onCreateFolder={(name) => createFolder(name)}
            onDeleteFolder={deleteFolder}
          />

          {/* All decks below folder grid */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-4">
              All decks
            </p>
            <DeckList
              documents={documents}
              folders={folders}
              assignments={assignments}
              loading={loading}
              onStudy={onStudyDeck}
              onAssign={assignDocument}
            />
          </div>
        </>
      ) : (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-4">
            Decks in this folder
          </p>
          <DeckList
            documents={visibleDocuments}
            folders={folders}
            assignments={assignments}
            loading={loading}
            onStudy={onStudyDeck}
            onAssign={assignDocument}
          />
        </div>
      )}

      {/* ── Upload ── */}
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
