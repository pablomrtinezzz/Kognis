"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Pause,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/db";
import {
  DraftExercise,
  ExerciseList,
  newExercise,
  useExerciseActions,
} from "../_workout-form";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";

// ─── C1 — Rest timer ──────────────────────────────────────────────────────────

const REST_OPTIONS = [60, 90, 120, 180];

function RestTimer() {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((secs: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(secs);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r === null || r <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          return null;
        }
        return r - 1;
      });
    }, 1000);
  }, []);

  const toggle = () => {
    if (running) {
      clearInterval(intervalRef.current!);
      setRunning(false);
    } else if (remaining !== null) {
      start(remaining);
    } else {
      start(duration);
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setRemaining(null);
  };

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  const pct = remaining !== null ? (remaining / duration) * 100 : 100;
  const done = remaining === null && !running;

  return (
    <GlassPanel className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={13} className="text-white/35" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
            Descanso
          </span>
        </div>
        {/* Duration selector */}
        <div className="flex gap-1">
          {REST_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setDuration(s);
                reset();
              }}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg transition-all duration-200"
              style={
                duration === s
                  ? {
                      backgroundColor: "rgba(37,119,255,0.14)",
                      color: "rgb(37,119,255)",
                      border: "1px solid rgba(37,119,255,0.22)",
                    }
                  : {
                      color: "rgba(255,255,255,0.25)",
                      border: "1px solid transparent",
                    }
              }
            >
              {s}s
            </button>
          ))}
        </div>
      </div>

      {/* Progress + controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0"
          style={{
            backgroundColor: running
              ? "rgba(37,119,255,0.12)"
              : "rgba(16,185,129,0.10)",
            border: running
              ? "1px solid rgba(37,119,255,0.22)"
              : "1px solid rgba(16,185,129,0.20)",
            color: running ? "rgb(37,119,255)" : "rgb(16,185,129)",
          }}
        >
          {running ? (
            <Pause size={15} strokeWidth={2.5} />
          ) : (
            <Play size={15} strokeWidth={0} fill="currentColor" />
          )}
        </button>

        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 linear"
              style={{
                width: `${pct}%`,
                backgroundColor: running
                  ? "rgb(37,119,255)"
                  : done
                    ? "rgba(255,255,255,0.10)"
                    : "rgb(16,185,129)",
              }}
            />
          </div>
          <p
            className="text-xs font-bold tabular-nums mt-1.5"
            style={{ color: "rgba(255,255,255,0.50)" }}
          >
            {remaining !== null
              ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
              : done
                ? "Listo"
                : `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`}
          </p>
        </div>

        {(running || remaining !== null) && (
          <button
            onClick={reset}
            className="text-white/20 hover:text-white/50 transition-colors p-1"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </GlassPanel>
  );
}

// ─── C2 — Last session hint for an exercise ──────────────────────────────────

function usePreviousData(exerciseName: string) {
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseName.trim()) return;
    (async () => {
      const exs = await db.workout_exercises
        .filter(
          (e) => e.exercise_name.toLowerCase() === exerciseName.toLowerCase(),
        )
        .toArray();

      if (exs.length === 0) return;

      // Find the most recent one
      const workoutIds = exs.map((e) => e.workout_local_id);
      const workouts = await db.workouts
        .where("local_id")
        .anyOf(workoutIds)
        .sortBy("started_at");

      if (workouts.length === 0) return;
      const latest = workouts[workouts.length - 1];
      const latestEx = exs.find((e) => e.workout_local_id === latest.local_id);
      if (!latestEx) return;

      const sets = await db.sets
        .where("workout_exercise_local_id")
        .equals(latestEx.local_id)
        .sortBy("set_number");

      if (sets.length === 0) return;

      const firstSet = sets[0];
      const parts: string[] = [];
      if (firstSet.weight_kg) parts.push(`${firstSet.weight_kg} kg`);
      if (firstSet.reps) parts.push(`${firstSet.reps} reps`);
      if (parts.length > 0) {
        setHint(`Última vez: ${parts.join(" · ")} × ${sets.length} sets`);
      }
    })();
  }, [exerciseName]);

  return hint;
}

// ─── Exercise card with previous data hint ───────────────────────────────────

function ExerciseHint({ name }: { name: string }) {
  const hint = usePreviousData(name);
  if (!hint) return null;
  return (
    <p className="text-[10px] text-white/25 font-medium px-5 pb-2 -mt-2">
      {hint}
    </p>
  );
}

// ─── Page inner ───────────────────────────────────────────────────────────────

function NewWorkoutInner() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const fromTemplateId = searchParams.get("from");

  const startedAt = useRef(new Date().toISOString());

  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [templateLoading, setTemplateLoading] = useState(!!fromTemplateId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = useExerciseActions(setExercises);

  useEffect(() => {
    if (!fromTemplateId) {
      setExercises([newExercise()]);
      return;
    }

    (async () => {
      const template = await db.workout_templates.get(fromTemplateId);
      if (!template) {
        setExercises([newExercise()]);
        setTemplateLoading(false);
        return;
      }

      setWorkoutName(template.name);
      setExercises(
        template.exercises.map(({ name, sets, reps }) => ({
          localId: crypto.randomUUID(),
          name,
          sets: Array.from({ length: sets }, () => ({
            localId: crypto.randomUUID(),
            reps: String(reps),
            weightKg: "",
          })),
        })),
      );
      setTemplateLoading(false);
    })();
  }, [fromTemplateId]);

  const handleSave = async () => {
    setError(null);

    if (exercises.some((ex) => !ex.name.trim())) {
      setError("All exercises must have a name.");
      return;
    }
    if (exercises.some((ex) => ex.sets.length === 0)) {
      setError("Each exercise must have at least one set.");
      return;
    }

    setSaving(true);
    try {
      const workoutLocalId = crypto.randomUUID();
      const finishedAt = new Date().toISOString();

      await db.workouts.put({
        local_id: workoutLocalId,
        user_id: user?.id ?? "local-user",
        name: workoutName.trim() || undefined,
        started_at: startedAt.current,
        finished_at: finishedAt,
        sync_status: "pending",
      });

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await db.workout_exercises.put({
          local_id: ex.localId,
          workout_local_id: workoutLocalId,
          exercise_name: ex.name.trim(),
          order_index: i,
          sync_status: "pending",
        });

        for (let j = 0; j < ex.sets.length; j++) {
          const s = ex.sets[j];
          await db.sets.put({
            local_id: s.localId,
            workout_exercise_local_id: ex.localId,
            set_number: j + 1,
            reps: s.reps ? parseInt(s.reps, 10) : undefined,
            weight_kg: s.weightKg ? parseFloat(s.weightKg) : undefined,
            sync_status: "pending",
          });
        }
      }

      toast("Entreno guardado", "success");
      router.replace("/workouts");
    } catch {
      setError("Failed to save workout locally.");
      setSaving(false);
    }
  };

  if (templateLoading) return null;

  return (
    <div className="w-full max-w-none flex-1 flex flex-col">
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-20 px-4 md:px-8 py-4 mb-6 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,14,0.90) 0%, rgba(9,9,14,0.72) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-all duration-300 text-sm font-medium"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Rutinas
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-30 active:scale-[0.96] transition-all shadow-[0_0_20px_rgba(37,119,255,0.3)]"
        >
          <CheckCircle size={15} strokeWidth={2.5} />
          {saving ? "Guardando..." : "Terminar Entreno"}
        </button>
      </div>

      {/* ── Desktop Two-Column Grid ── */}
      <div className="flex-1 md:grid md:grid-cols-[360px_1fr] gap-8 px-4 md:px-8 pb-12">
        {/* Left Column */}
        <div className="mb-8 md:mb-0">
          <div className="md:sticky md:top-24 flex flex-col gap-4">
            <GlassPanel className="p-6">
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="Nombre del entreno (Opcional)"
                className="w-full bg-transparent text-2xl font-bold tracking-tight text-white/90 placeholder-white/20 focus:outline-none"
              />
              <p className="text-xs text-white/30 mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Grabando sesión
              </p>
            </GlassPanel>

            {/* C1 — Rest timer */}
            <RestTimer />

            <GlassPanel glow className="p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 mb-4">
                Resumen Activo
              </h3>
              <ul className="space-y-3.5">
                {exercises.map((ex, idx) => (
                  <li key={ex.localId} className="space-y-0.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/70 truncate mr-4">
                        {ex.name || `Ejercicio ${idx + 1}`}
                      </span>
                      <span className="text-white/30 font-mono text-xs shrink-0">
                        {ex.sets.length} sets
                      </span>
                    </div>
                    {/* C2 — previous session hint */}
                    {ex.name && <ExerciseHint name={ex.name} />}
                  </li>
                ))}
              </ul>
            </GlassPanel>

            {error && (
              <p className="text-sm text-red-400 font-medium text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <ExerciseList exercises={exercises} actions={actions} />
        </div>
      </div>
    </div>
  );
}

export default function NewWorkoutPage() {
  return (
    <Suspense>
      <NewWorkoutInner />
    </Suspense>
  );
}
