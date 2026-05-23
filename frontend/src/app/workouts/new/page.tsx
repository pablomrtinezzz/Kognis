"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/db";
import {
  DraftExercise,
  ExerciseList,
  newExercise,
  useExerciseActions,
} from "../_workout-form";

// ─── Inner page (uses useSearchParams — must be inside Suspense) ───────────────

function NewWorkoutInner() {
  const router = useRouter();
  const { user } = useAuth();
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
      setError("Todos los ejercicios deben tener un nombre.");
      return;
    }
    if (exercises.some((ex) => ex.sets.length === 0)) {
      setError("Cada ejercicio debe tener al menos una serie.");
      return;
    }

    setSaving(true);
    try {
      const workoutLocalId = crypto.randomUUID();
      const finishedAt = new Date().toISOString();

      await db.workouts.put({
        local_id: workoutLocalId,
        user_id: user!.id,
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

      router.push("/progress");
    } catch {
      setError("No se pudo guardar el entreno. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  const startTime = new Date(startedAt.current).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-xl mx-auto">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-8 flex items-center justify-between bg-background/80 backdrop-blur-2xl border-b border-white/[0.05]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-all duration-300 ease-out text-sm font-medium active:scale-[0.96]"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Rutinas
        </button>
        <button
          onClick={handleSave}
          disabled={exercises.length === 0 || saving || templateLoading}
          className="flex items-center gap-1.5 bg-accent text-black text-sm font-bold px-5 py-2 rounded-full disabled:opacity-30 active:scale-[0.96] transition-all duration-300 ease-out shadow-accent-glow"
        >
          <CheckCircle size={14} strokeWidth={2.5} />
          {saving ? "Guardando…" : "Finalizar"}
        </button>
      </div>

      {/* ── Title ── */}
      <div className="mb-8 space-y-1">
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="Nombre del entreno"
          className="w-full bg-transparent text-2xl font-bold tracking-tight text-white/90 placeholder-white/15 focus:outline-none"
        />
        <p className="text-xs text-white/25 font-medium tabular-nums">
          Iniciado a las {startTime}
        </p>
      </div>

      {/* ── Loading skeleton ── */}
      {templateLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[140px] rounded-3xl bg-card border border-white/[0.05] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <ExerciseList exercises={exercises} actions={actions} />
          {error && (
            <p className="mt-4 text-sm text-red-400/90 text-center font-medium">
              {error}
            </p>
          )}
        </>
      )}

      <div className="h-10" />
    </div>
  );
}

// ─── Suspense wrapper ─────────────────────────────────────────────────────────

export default function NewWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto space-y-3 pt-16">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[140px] rounded-3xl bg-card border border-white/[0.05] animate-pulse"
            />
          ))}
        </div>
      }
    >
      <NewWorkoutInner />
    </Suspense>
  );
}
