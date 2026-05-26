"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import {
  DraftExercise,
  DraftSet,
  ExerciseList,
  newExercise,
  useExerciseActions,
} from "../../_workout-form";

export default function EditWorkoutPage() {
  const router = useRouter();
  const { local_id } = useParams<{ local_id: string }>();
  const toast = useToast();

  const [workoutName, setWorkoutName] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([newExercise()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = useExerciseActions(setExercises);

  // Load existing workout from Dexie on mount
  useEffect(() => {
    if (!local_id) return;

    (async () => {
      const workout = await db.workouts.get(local_id);
      if (!workout) {
        router.replace("/workouts");
        return;
      }

      setWorkoutName(workout.name ?? "");
      setStartedAt(workout.started_at);

      const dbExercises = await db.workout_exercises
        .where("workout_local_id")
        .equals(local_id)
        .sortBy("order_index");

      const draftExercises: DraftExercise[] = await Promise.all(
        dbExercises.map(async (ex) => {
          const dbSets = await db.sets
            .where("workout_exercise_local_id")
            .equals(ex.local_id)
            .sortBy("set_number");

          const draftSets: DraftSet[] = dbSets.map((s) => ({
            localId: s.local_id,
            reps: s.reps != null ? String(s.reps) : "",
            weightKg: s.weight_kg != null ? String(s.weight_kg) : "",
          }));

          return {
            localId: ex.local_id,
            name: ex.exercise_name,
            block: ex.block ?? "main",
            sets:
              draftSets.length > 0
                ? draftSets
                : [{ localId: crypto.randomUUID(), reps: "", weightKg: "" }],
          };
        }),
      );

      setExercises(
        draftExercises.length > 0 ? draftExercises : [newExercise()],
      );
      setLoading(false);
    })();
  }, [local_id, router]);

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
      // Replace exercises and sets in Dexie
      const oldExercises = await db.workout_exercises
        .where("workout_local_id")
        .equals(local_id)
        .toArray();

      const oldExerciseIds = oldExercises.map((e) => e.local_id);

      if (oldExerciseIds.length > 0) {
        await db.sets
          .where("workout_exercise_local_id")
          .anyOf(oldExerciseIds)
          .delete();
      }
      await db.workout_exercises
        .where("workout_local_id")
        .equals(local_id)
        .delete();

      // Update workout header and mark pending so useSyncManager triggers PUT
      await db.workouts.update(local_id, {
        name: workoutName.trim() || undefined,
        started_at: startedAt,
        sync_status: "pending",
      });

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await db.workout_exercises.put({
          local_id: ex.localId,
          workout_local_id: local_id,
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

      toast("Entreno actualizado", "success");
      router.push("/workouts");
    } catch {
      setError("No se pudo guardar los cambios. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  // Format ISO to datetime-local value (YYYY-MM-DDTHH:mm)
  const toDatetimeLocal = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-8">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-40 rounded-2xl bg-[#1C2331] border border-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="sticky top-0 z-10 border-b border-white/[0.05] -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-8 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,14,0.90) 0%, rgba(9,9,14,0.72) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-foreground/40 hover:text-foreground/80 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={17} strokeWidth={2} />
          Entrenos
        </button>
        <button
          onClick={handleSave}
          disabled={exercises.length === 0 || saving}
          className="flex items-center gap-1.5 bg-accent text-background text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-30 active:scale-95 transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
        >
          <CheckCircle size={15} strokeWidth={2.5} />
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="mb-8 space-y-2">
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="Nombre del entreno (opcional)"
          className="w-full bg-transparent text-2xl font-bold tracking-tight placeholder-foreground/15 focus:outline-none"
        />
        {/* C4 — editable start time */}
        {startedAt && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/30 font-medium shrink-0">
              Iniciado:
            </span>
            <input
              type="datetime-local"
              value={toDatetimeLocal(startedAt)}
              onChange={(e) =>
                setStartedAt(new Date(e.target.value).toISOString())
              }
              className="bg-transparent text-xs text-foreground/40 focus:text-foreground/70 focus:outline-none border-b border-white/[0.07] focus:border-white/20 transition-colors pb-0.5"
            />
          </div>
        )}
      </div>

      <ExerciseList exercises={exercises} actions={actions} />

      {error && (
        <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
      )}

      <div className="h-8" />
    </div>
  );
}
