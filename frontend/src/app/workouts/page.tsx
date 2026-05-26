"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  WifiOff,
} from "lucide-react";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { useWorkouts } from "@/hooks/useWorkouts";
import { db } from "@/lib/db";
import type { LocalWorkout, LocalWorkoutTemplate } from "@/lib/db";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDuration(startIso: string, endIso?: string) {
  if (!endIso) return null;
  const mins = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000,
  );
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: {
  active: "rutinas" | "historial";
  onChange: (t: "rutinas" | "historial") => void;
}) {
  return (
    <div
      className="flex gap-1 p-1 rounded-2xl"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      {(["rutinas", "historial"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200"
          style={
            active === tab
              ? {
                  backgroundColor: "rgba(37,119,255,0.14)",
                  color: "rgb(37,119,255)",
                  border: "1px solid rgba(37,119,255,0.22)",
                }
              : {
                  color: "rgba(255,255,255,0.35)",
                  border: "1px solid transparent",
                }
          }
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── Day chips (Rutinas) ──────────────────────────────────────────────────────

function DayChips({
  templateId,
  weekdays,
  allTemplates,
  onToggle,
}: {
  templateId: string;
  weekdays: number[];
  allTemplates: LocalWorkoutTemplate[];
  onToggle: (day: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {DAY_LABELS.map((label, day) => {
        const active = weekdays.includes(day);
        const takenBy = allTemplates.find(
          (t) => t.id !== templateId && t.weekdays?.includes(day),
        );
        return (
          <button
            key={day}
            type="button"
            title={takenBy ? `Asignado a "${takenBy.name}"` : undefined}
            onClick={() => onToggle(day)}
            className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300 ease-out active:scale-90
              ${
                active
                  ? "bg-primary text-white"
                  : takenBy
                    ? "bg-white/[0.03] text-white/15 cursor-default"
                    : "bg-white/[0.05] text-white/30 hover:bg-white/[0.10] hover:text-white/60"
              }`}
            style={
              active
                ? { boxShadow: "0 0 12px rgba(37,119,255,0.5)" }
                : undefined
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Template card (Rutinas) ──────────────────────────────────────────────────

function TemplateCard({
  template,
  allTemplates,
  onDelete,
  onToggleDay,
}: {
  template: LocalWorkoutTemplate;
  allTemplates: LocalWorkoutTemplate[];
  onDelete: (id: string) => void;
  onToggleDay: (templateId: string, day: number) => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const weekdays = template.weekdays ?? [];
  const preview = template.exercises
    .slice(0, 2)
    .map((e) => e.name)
    .join(" · ");
  const remaining = template.exercises.length - 2;

  return (
    <GlassPanel hover glow className="group flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Dumbbell size={15} className="text-primary/80" strokeWidth={2} />
        </div>

        {confirming ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              onClick={() => onDelete(template.id)}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 px-2.5 py-1 rounded-full hover:bg-red-400/[0.08] transition-all duration-300"
            >
              Eliminar
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-[11px] text-white/30 hover:text-white/60 px-2.5 py-1 rounded-full hover:bg-white/[0.05] transition-all duration-300"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {/* A3 — Edit template */}
            <button
              onClick={() =>
                router.push(`/workouts/templates/edit/${template.id}`)
              }
              className="p-1.5 rounded-xl text-white/20 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-300"
              aria-label="Editar rutina"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-xl text-white/15 hover:text-red-400 hover:bg-red-400/[0.07] active:scale-90 transition-all duration-300"
              aria-label="Eliminar"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="min-w-0 -mt-1">
        <p className="font-bold text-sm text-white/90 leading-snug truncate">
          {template.name}
        </p>
        <p className="text-[11px] text-white/30 mt-0.5 truncate leading-relaxed">
          {preview}
          {remaining > 0 && (
            <span className="text-white/15"> +{remaining}</span>
          )}
        </p>
        <p className="text-[10px] text-white/20 mt-1 font-medium">
          {template.exercises.length} ejercicio
          {template.exercises.length !== 1 ? "s" : ""}
        </p>
      </div>

      <DayChips
        templateId={template.id}
        weekdays={weekdays}
        allTemplates={allTemplates}
        onToggle={(day) => onToggleDay(template.id, day)}
      />

      <button
        onClick={() => router.push(`/workouts/new?from=${template.id}`)}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold uppercase tracking-wide transition-all duration-300 ease-out active:scale-[0.97]"
      >
        <Play size={11} strokeWidth={0} fill="currentColor" />
        Iniciar
      </button>
    </GlassPanel>
  );
}

function TemplateCardSkeleton() {
  return (
    <GlassPanel className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-2xl bg-white/[0.04]" />
      <div className="space-y-2">
        <div className="h-3 bg-white/[0.04] rounded-full w-3/4" />
        <div className="h-2 bg-white/[0.03] rounded-full w-full" />
      </div>
      <div className="flex gap-1">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-white/[0.03]" />
        ))}
      </div>
      <div className="h-9 bg-white/[0.03] rounded-full" />
    </GlassPanel>
  );
}

// ─── Rutinas tab ──────────────────────────────────────────────────────────────

function RutinasTab() {
  const { templates, loading, deleteTemplate, patchTemplate } =
    useWorkoutTemplates();

  const handleToggleDay = async (templateId: string, day: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const current = template.weekdays ?? [];
    if (current.includes(day)) {
      await patchTemplate(templateId, {
        weekdays: current.filter((d) => d !== day),
      });
    } else {
      const owner = templates.find(
        (t) => t.id !== templateId && t.weekdays?.includes(day),
      );
      if (owner) {
        await patchTemplate(owner.id, {
          weekdays: (owner.weekdays ?? []).filter((d) => d !== day),
        });
      }
      await patchTemplate(templateId, { weekdays: [...current, day] });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <TemplateCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <GlassPanel
        glow
        className="py-16 flex flex-col items-center text-center px-6 gap-5"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/[0.08] flex items-center justify-center">
          <Dumbbell size={24} className="text-primary/50" strokeWidth={1.75} />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-white/50 text-sm">Sin rutinas todavía</p>
          <p className="text-white/20 text-xs max-w-[200px]">
            Crea tu primera rutina para empezar a entrenar.
          </p>
        </div>
        <Link
          href="/workouts/templates/new"
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-300 text-sm"
          style={{ boxShadow: "0 8px 32px -4px rgba(37,119,255,0.45)" }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Crear rutina
        </Link>
      </GlassPanel>
    );
  }

  return (
    <>
      <p className="text-[11px] text-white/20">
        Toca los días para planificar tu semana.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            allTemplates={templates}
            onDelete={deleteTemplate}
            onToggleDay={handleToggleDay}
          />
        ))}
      </div>
    </>
  );
}

// ─── Workout detail (C3) ──────────────────────────────────────────────────────

function WorkoutDetail({ localId }: { localId: string }) {
  const [exercises, setExercises] = useState<
    Array<{ name: string; sets: Array<{ reps?: number; weight_kg?: number }> }>
  >([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    (async () => {
      const exs = await db.workout_exercises
        .where("workout_local_id")
        .equals(localId)
        .sortBy("order_index");

      const withSets = await Promise.all(
        exs.map(async (ex) => {
          const sets = await db.sets
            .where("workout_exercise_local_id")
            .equals(ex.local_id)
            .sortBy("set_number");
          return { name: ex.exercise_name, sets };
        }),
      );
      setExercises(withSets);
      setLoading(false);
    })();
  });

  if (loading) {
    return (
      <div className="pt-2 space-y-1">
        {[1, 2].map((i) => (
          <div key={i} className="h-4 rounded bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  if (exercises.length === 0) return null;

  return (
    <div className="pt-2 space-y-2 border-t border-white/[0.05]">
      {exercises.map((ex, i) => (
        <div key={i} className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-white/55 min-w-0 truncate flex-1">
            {ex.name}
          </span>
          <span className="text-[10px] text-white/25 shrink-0 tabular-nums">
            {ex.sets.length} sets
            {ex.sets[0]?.weight_kg ? ` · ${ex.sets[0].weight_kg} kg` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Workout history row (Historial) ──────────────────────────────────────────

function WorkoutRow({
  workout,
  onDelete,
  onRetry,
}: {
  workout: LocalWorkout;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const duration = formatDuration(workout.started_at, workout.finished_at);

  return (
    <GlassPanel className="group flex flex-col gap-0 p-0 overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.14)",
          }}
        >
          <Dumbbell
            size={15}
            style={{ color: "rgba(16,185,129,0.7)" }}
            strokeWidth={2}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/85 truncate leading-tight">
            {workout.name || "Entreno sin nombre"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-white/30">
              {formatDate(workout.started_at)}
            </span>
            {duration && (
              <>
                <span className="text-white/15 text-[10px]">·</span>
                <span className="flex items-center gap-0.5 text-[11px] text-white/25">
                  <Clock size={9} className="shrink-0" />
                  {duration}
                </span>
              </>
            )}
          </div>
        </div>

        {/* B2 — Sync status + retry */}
        {workout.sync_status === "error" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry(workout.local_id);
            }}
            title="Reintentar sincronización"
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all duration-200"
            style={{
              color: "rgb(248,113,113)",
              backgroundColor: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.14)",
            }}
          >
            <RefreshCw size={10} />
            Retry
          </button>
        )}
        {workout.sync_status === "pending" && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "rgba(245,158,11,0.7)" }}
          />
        )}

        {/* C3 — Expand chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="text-white/20 hover:text-white/50 transition-colors p-0.5"
          aria-label="Ver detalles"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Delete */}
        {confirming ? (
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onDelete(workout.local_id)}
              className="text-[11px] font-bold text-red-400 px-2 py-1 rounded-lg hover:bg-red-400/[0.08] transition-colors"
            >
              Borrar
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-[11px] text-white/30 px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(true);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/[0.07] transition-all duration-200 shrink-0"
            aria-label="Eliminar entreno"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* C3 — Drill-down detail */}
      {expanded && (
        <div className="px-4 pb-4">
          <WorkoutDetail localId={workout.local_id} />
        </div>
      )}
    </GlassPanel>
  );
}

// ─── Historial tab ────────────────────────────────────────────────────────────

function HistorialTab() {
  const { workouts, loading, isOffline, deleteWorkout, refresh } =
    useWorkouts();
  const toast = useToast();

  const handleRetry = async (localId: string) => {
    await refresh();
    toast("Reintentando sincronización…", "info");
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <GlassPanel key={i} className="h-[72px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <GlassPanel className="py-16 flex flex-col items-center text-center px-6 gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.12)",
          }}
        >
          <Dumbbell
            size={22}
            style={{ color: "rgba(16,185,129,0.40)" }}
            strokeWidth={1.75}
          />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-white/40 text-sm">Sin sesiones aún</p>
          <p className="text-white/20 text-xs max-w-[220px]">
            Inicia una rutina para registrar tu primera sesión.
          </p>
        </div>
        {/* E3 — Cross-module CTA */}
        <Link
          href="/workouts"
          onClick={() => {}}
          className="text-xs font-semibold text-primary/60 hover:text-primary/90 transition-colors"
        >
          Ver rutinas →
        </Link>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-2">
      {isOffline && (
        <div
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold"
          style={{
            color: "rgb(251,191,36)",
            backgroundColor: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.12)",
          }}
        >
          <WifiOff size={11} />
          Sin conexión — mostrando datos locales
        </div>
      )}
      {workouts.map((w) => (
        <WorkoutRow
          key={w.local_id}
          workout={w}
          onDelete={deleteWorkout}
          onRetry={handleRetry}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const [tab, setTab] = useState<"rutinas" | "historial">("rutinas");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">
            Workouts
          </h1>
          <p className="text-xs text-white/30 mt-0.5">
            {tab === "rutinas" ? "Tus rutinas" : "Historial de sesiones"}
          </p>
        </div>

        {tab === "rutinas" && (
          <Link
            href="/workouts/templates/new"
            className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-300 ease-out"
            style={{ boxShadow: "0 8px 32px -4px rgba(37,119,255,0.45)" }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Nueva
          </Link>
        )}
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === "rutinas" ? <RutinasTab /> : <HistorialTab />}
    </div>
  );
}
