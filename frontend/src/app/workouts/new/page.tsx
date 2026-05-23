"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/db";
import {
  DraftExercise,
  ExerciseList,
  newExercise,
  useExerciseActions,
} from "../_workout-form";

export default function NewWorkoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  const startedAt = useRef(new Date().toISOString());

  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([newExercise()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = useExerciseActions(setExercises);

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

      router.push("/workouts");
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
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-gray-800 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Entrenos</span>
        </button>
        <button
          onClick={handleSave}
          disabled={exercises.length === 0 || saving}
          className="flex items-center gap-1.5 bg-accent text-[#0B0F17] text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40 active:scale-95 transition-all"
        >
          <CheckCircle size={16} />
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>

      <div className="mb-8 space-y-1">
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="Nombre del entreno (opcional)"
          className="w-full bg-transparent text-xl font-bold placeholder-foreground/20 focus:outline-none"
        />
        <p className="text-xs text-foreground/40">Iniciado a las {startTime}</p>
      </div>

      <ExerciseList exercises={exercises} actions={actions} />

      {error && (
        <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
      )}

      <div className="h-8" />
    </div>
  );
}
