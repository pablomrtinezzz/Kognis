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
import { GlassPanel } from "@/components/ui/GlassPanel";

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

      let orderIdx = 0;
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await db.workout_exercises.put({
          local_id: ex.localId,
          workout_local_id: workoutLocalId,
          exercise_name: ex.name.trim(),
          order_index: i,
          sync_status: "pending", // <--- AÑADE ESTO
        });

        for (let j = 0; j < ex.sets.length; j++) {
          const s = ex.sets[j];
          await db.sets.put({
            local_id: s.localId,
            workout_exercise_local_id: ex.localId,
            set_number: j + 1,
            reps: s.reps ? parseInt(s.reps, 10) : undefined,
            weight_kg: s.weightKg ? parseFloat(s.weightKg) : undefined,
            sync_status: "pending", // <--- AÑADE ESTO TAMBIÉN
          });
        }
      }

      router.replace("/workouts");
    } catch (e) {
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
          backgroundColor: "rgba(9, 9, 14, 0.88)",
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
        {/* Left Column: Summary & Info (Sticky on Desktop) */}
        <div className="mb-8 md:mb-0">
          <div className="md:sticky md:top-24 flex flex-col gap-6">
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

            <GlassPanel glow className="p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 mb-4">
                Resumen Activo
              </h3>
              <ul className="space-y-3">
                {exercises.map((ex, idx) => (
                  <li
                    key={ex.localId}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-white/70 truncate mr-4">
                      {ex.name || `Ejercicio ${idx + 1}`}
                    </span>
                    <span className="text-white/30 font-mono text-xs shrink-0">
                      {ex.sets.length} sets
                    </span>
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

        {/* Right Column: Execution Area */}
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
