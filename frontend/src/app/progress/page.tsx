"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  ListOrdered,
  Pencil,
  RefreshCw,
  Trash2,
  TrendingUp,
  WifiOff,
  Zap,
} from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useProgressData } from "@/hooks/useProgressData";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { useWorkouts } from "@/hooks/useWorkouts";
import { db } from "@/lib/db";
import type { LocalWorkout } from "@/lib/db";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

type ProgressTab = "historial" | "analisis";

function TabBar({
  active,
  onChange,
}: {
  active: ProgressTab;
  onChange: (t: ProgressTab) => void;
}) {
  return (
    <div
      className="flex gap-1 p-1 rounded-2xl"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      {(
        [
          { id: "historial", label: "Historial" },
          { id: "analisis", label: "Análisis" },
        ] as { id: ProgressTab; label: string }[]
      ).map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200"
          style={
            active === id
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
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Workout detail (drill-down) ──────────────────────────────────────────────

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

// ─── Workout row ──────────────────────────────────────────────────────────────

function WorkoutRow({
  workout,
  onRetry,
  onDelete,
}: {
  workout: LocalWorkout;
  onRetry: (id: string) => void;
  onDelete: (localId: string) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const duration = formatDuration(workout.started_at, workout.finished_at);

  return (
    <GlassPanel className="flex flex-col gap-0 p-0 overflow-hidden group">
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

        {/* ── Edit / Delete ── */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/workouts/edit/${workout.local_id}`);
            }}
            className="p-1.5 rounded-xl text-white/20 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-200"
            aria-label="Editar entreno"
          >
            <Pencil size={11} />
          </button>
          {deleteConfirm ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onDelete(workout.local_id);
                  setDeleteConfirm(false);
                }}
                className="text-[10px] font-bold text-red-400 px-2 py-0.5 rounded-lg hover:bg-red-400/[0.08] transition-colors"
              >
                Borrar
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-[10px] text-white/30 px-1.5 py-0.5 rounded-lg transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(true);
              }}
              className="p-1.5 rounded-xl text-white/15 hover:text-red-400 hover:bg-red-400/[0.07] transition-all duration-200"
              aria-label="Eliminar entreno"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

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
      </div>

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
  const { workouts, loading, isOffline, refresh } = useWorkouts();
  const { session } = useAuth();
  const toast = useToast();

  const handleRetry = async (_localId: string) => {
    await refresh();
    toast("Reintentando sincronización…", "info");
  };

  const handleDelete = async (localId: string) => {
    try {
      const exs = await db.workout_exercises
        .where("workout_local_id")
        .equals(localId)
        .toArray();
      for (const ex of exs) {
        await db.sets
          .where("workout_exercise_local_id")
          .equals(ex.local_id)
          .delete();
      }
      await db.workout_exercises
        .where("workout_local_id")
        .equals(localId)
        .delete();
      await db.workouts.delete(localId);

      // Best-effort server delete
      try {
        const token = session?.access_token;
        if (token) {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/workouts/${localId}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
          );
        }
      } catch {
        // ignore — local delete already done
      }

      await refresh();
      toast("Entreno eliminado", "success");
    } catch {
      toast("No se pudo eliminar el entreno", "error");
    }
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
        <Link
          href="/workouts"
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
          onRetry={handleRetry}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

// ─── Analytics tab helpers ────────────────────────────────────────────────────

function Dropdown<T extends string>({
  value,
  placeholder,
  options,
  icon: Icon,
  onSelect,
}: {
  value: T | null;
  placeholder: string;
  options: { value: T; label: string }[];
  icon: React.ElementType;
  onSelect: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  if (options.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-white/60 hover:text-white/90 transition-all duration-300 ease-out w-full active:scale-[0.99]"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Icon size={14} className="text-primary/60 shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left truncate">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={13}
          className={`text-white/25 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl max-h-64 overflow-y-auto"
          style={{
            backgroundColor: "rgba(11,11,20,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.04) inset",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-all duration-200
                ${
                  opt.value === value
                    ? "text-primary font-bold bg-primary/[0.07]"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white/90"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-2xl px-3.5 py-3 text-xs"
      style={{
        backgroundColor: "rgba(11,11,20,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
      }}
    >
      <p className="text-white/35 mb-2 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name === "ewma" ? "Tendencia" : "1RM estimado"}: {p.value} kg
        </p>
      ))}
    </div>
  );
}

function SuggestionCard({
  predicted1rm,
  optionA,
  optionB,
}: {
  predicted1rm: number;
  optionA: { reps: number; weightKg: number };
  optionB: { reps: number; weightKg: number };
}) {
  return (
    <GlassPanel glow className="overflow-hidden">
      <div className="px-5 pt-4 pb-3.5 border-b border-white/[0.05] flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-accent/[0.10] flex items-center justify-center">
          <Zap size={15} className="text-accent" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">Sugerencia para hoy</p>
          <p className="text-xs text-white/30">
            1RM predicho: {predicted1rm} kg
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
        <div className="px-5 py-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
            Más peso
          </p>
          <p className="text-2xl font-bold text-white/90 tracking-tight">
            {optionA.weightKg}
            <span className="text-sm text-white/35 font-semibold ml-1">kg</span>
          </p>
          <p className="text-xs text-white/30 mt-1">× {optionA.reps} reps</p>
        </div>
        <div className="px-5 py-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
            Más reps
          </p>
          <p className="text-2xl font-bold text-white/90 tracking-tight">
            {optionB.weightKg}
            <span className="text-sm text-white/35 font-semibold ml-1">kg</span>
          </p>
          <p className="text-xs text-white/30 mt-1">× {optionB.reps} reps</p>
        </div>
      </div>
    </GlassPanel>
  );
}

// ─── Análisis tab ─────────────────────────────────────────────────────────────

function AnalisisTab() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { templates, loading: templatesLoading } = useWorkoutTemplates();
  const {
    points,
    suggestion,
    loading: dataLoading,
  } = useProgressData(selectedExercise);

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) ?? null;

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.name,
  }));
  const exerciseOptions = (selectedTemplate?.exercises ?? []).map((e) => ({
    value: e.name,
    label: e.name,
  }));

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    setSelectedExercise(null);
  };

  const hasData = points.length >= 2;
  const loading = templatesLoading || dataLoading;

  if (!templatesLoading && templates.length === 0) {
    return (
      <GlassPanel className="py-10 flex flex-col items-center gap-3 text-center">
        <TrendingUp size={22} className="text-primary/30" strokeWidth={1.5} />
        <p className="text-sm text-white/40">Aún no tienes rutinas creadas.</p>
        <Link
          href="/workouts/templates/new"
          className="text-xs font-bold text-primary/70 hover:text-primary transition-colors"
        >
          Crear primera rutina →
        </Link>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-4">
      {!templatesLoading && templates.length > 0 && (
        <Dropdown
          value={selectedTemplateId}
          placeholder="Selecciona una rutina"
          options={templateOptions}
          icon={ListOrdered}
          onSelect={handleSelectTemplate}
        />
      )}

      {selectedTemplate && (
        <Dropdown
          value={selectedExercise}
          placeholder="Selecciona un ejercicio"
          options={exerciseOptions}
          icon={Dumbbell}
          onSelect={setSelectedExercise}
        />
      )}

      {loading && <GlassPanel className="h-52 animate-pulse" />}

      {!loading && !selectedTemplateId && (
        <GlassPanel className="py-14 flex flex-col items-center text-center px-6 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/[0.07] flex items-center justify-center">
            <TrendingUp
              size={22}
              className="text-primary/40"
              strokeWidth={1.75}
            />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white/40 text-sm">
              Elige una rutina para empezar
            </p>
            <p className="text-white/20 text-xs max-w-[220px]">
              Registra sesiones para empezar a ver tu progreso.
            </p>
          </div>
        </GlassPanel>
      )}

      {!loading && selectedTemplateId && !selectedExercise && (
        <GlassPanel className="py-10 text-center">
          <p className="text-sm text-white/35">
            Selecciona un ejercicio de{" "}
            <span className="text-white/60 font-semibold">
              {selectedTemplate?.name}
            </span>
          </p>
        </GlassPanel>
      )}

      {!loading && selectedExercise && !hasData && (
        <GlassPanel className="py-10 text-center space-y-1">
          <p className="text-sm text-white/40">
            Sin datos para{" "}
            <span className="text-white/65 font-semibold">
              {selectedExercise}
            </span>
            .
          </p>
          <p className="text-xs text-white/20">
            Necesitas al menos 2 sesiones registradas.
          </p>
        </GlassPanel>
      )}

      {!loading && hasData && (
        <>
          <GlassPanel glow className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-5">
              1RM estimado (Epley) · kg
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={points}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.03)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "rgba(242,244,248,0.25)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    });
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(242,244,248,0.25)" }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="oneRm"
                  name="oneRm"
                  stroke="rgba(37,119,255,0.45)"
                  strokeWidth={1.5}
                  dot={{ fill: "#2577FF", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#2577FF" }}
                />
                <Line
                  type="monotone"
                  dataKey="ewma"
                  name="ewma"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#10B981" }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-5 mt-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-px bg-primary/45 rounded-full inline-block" />
                <span className="text-[10px] text-white/25">1RM sesión</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-px bg-accent rounded-full inline-block" />
                <span className="text-[10px] text-white/25">
                  Tendencia (EWMA)
                </span>
              </div>
            </div>
          </GlassPanel>

          {suggestion && (
            <SuggestionCard
              predicted1rm={suggestion.predicted1rm}
              optionA={suggestion.optionA}
              optionB={suggestion.optionB}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [tab, setTab] = useState<ProgressTab>("historial");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white/90">
          Progreso
        </h1>
        <p className="text-xs text-white/30 mt-0.5">
          {tab === "historial"
            ? "Historial de sesiones"
            : "Evolución de tus ejercicios"}
        </p>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === "historial" ? <HistorialTab /> : <AnalisisTab />}
    </div>
  );
}
