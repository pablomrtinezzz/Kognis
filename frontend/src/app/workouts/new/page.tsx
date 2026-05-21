"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/db";

// ─── Draft types (form state only — never persisted directly) ─────────────────

interface DraftSet {
  localId: string;
  reps: string;
  weightKg: string;
}

interface DraftExercise {
  localId: string;
  name: string;
  sets: DraftSet[];
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

const newSet = (): DraftSet => ({
  localId: crypto.randomUUID(),
  reps: "",
  weightKg: "",
});

const newExercise = (): DraftExercise => ({
  localId: crypto.randomUUID(),
  name: "",
  sets: [newSet()],
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewWorkoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Capture start time once on mount — stable via ref
  const startedAt = useRef(new Date().toISOString());

  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([newExercise()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Exercise actions ────────────────────────────────────────────────────

  const addExercise = () => setExercises((prev) => [...prev, newExercise()]);

  const removeExercise = (exIdx: number) =>
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));

  const updateExerciseName = (exIdx: number, name: string) =>
    setExercises((prev) =>
      prev.map((ex, i) => (i === exIdx ? { ...ex, name } : ex)),
    );

  // ── Set actions ─────────────────────────────────────────────────────────

  const addSet = (exIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, newSet()] } : ex,
      ),
    );

  const removeSet = (exIdx: number, setIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex,
      ),
    );

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: "reps" | "weightKg",
    value: string,
  ) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, [field]: value } : s,
              ),
            }
          : ex,
      ),
    );

  // ── Save ────────────────────────────────────────────────────────────────

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

      // Write workout header
      await db.workouts.put({
        local_id: workoutLocalId,
        user_id: user!.id,
        name: workoutName.trim() || undefined,
        started_at: startedAt.current,
        finished_at: finishedAt,
        sync_status: "pending",
      });

      // Write each exercise and its sets
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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* Sticky top bar */}
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

      {/* Workout name + timestamp */}
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

      {/* Exercise cards */}
      <div className="space-y-4">
        {exercises.map((ex, exIdx) => (
          <div
            key={ex.localId}
            className="rounded-2xl bg-[#1C2331] border border-gray-800 overflow-hidden"
          >
            {/* Exercise header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <input
                type="text"
                value={ex.name}
                onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                placeholder="Nombre del ejercicio"
                // Auto-focus the name input when a new exercise is added
                autoFocus={exIdx === exercises.length - 1 && ex.name === ""}
                className="flex-1 bg-transparent font-semibold placeholder-foreground/30 focus:outline-none"
              />
              {exercises.length > 1 && (
                <button
                  onClick={() => removeExercise(exIdx)}
                  className="text-foreground/30 hover:text-red-400 transition-colors p-1 shrink-0"
                  aria-label="Eliminar ejercicio"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1.5rem_1fr_1fr_1.5rem] gap-2 px-4 pt-3 pb-1">
              <span className="text-[10px] text-foreground/30 text-center font-semibold uppercase tracking-wide">
                #
              </span>
              <span className="text-[10px] text-foreground/30 font-semibold uppercase tracking-wide">
                Reps
              </span>
              <span className="text-[10px] text-foreground/30 font-semibold uppercase tracking-wide">
                Peso (kg)
              </span>
              <span />
            </div>

            {/* Set rows */}
            <div className="px-4 pb-3 space-y-2">
              {ex.sets.map((s, setIdx) => (
                <div
                  key={s.localId}
                  className="grid grid-cols-[1.5rem_1fr_1fr_1.5rem] gap-2 items-center"
                >
                  <span className="text-sm text-foreground/40 text-center font-mono">
                    {setIdx + 1}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={s.reps}
                    onChange={(e) =>
                      updateSet(exIdx, setIdx, "reps", e.target.value)
                    }
                    placeholder="0"
                    className="w-full h-10 bg-background rounded-lg text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={s.weightKg}
                    onChange={(e) =>
                      updateSet(exIdx, setIdx, "weightKg", e.target.value)
                    }
                    placeholder="0"
                    className="w-full h-10 bg-background rounded-lg text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
                  />
                  <button
                    onClick={() => removeSet(exIdx, setIdx)}
                    disabled={ex.sets.length === 1}
                    className="flex items-center justify-center text-foreground/20 hover:text-red-400 transition-colors disabled:pointer-events-none disabled:opacity-0"
                    aria-label="Eliminar serie"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add set — inline, no navigation */}
            <button
              onClick={() => addSet(exIdx)}
              className="w-full py-3 text-sm font-semibold text-accent hover:bg-accent/5 border-t border-gray-800 transition-colors"
            >
              + Añadir serie
            </button>
          </div>
        ))}
      </div>

      {/* Add exercise — inline, no navigation */}
      <button
        onClick={addExercise}
        className="mt-4 w-full py-4 rounded-2xl border-2 border-dashed border-gray-700 hover:border-primary/50 text-foreground/40 hover:text-primary/60 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
      >
        <Plus size={18} />
        Añadir ejercicio
      </button>

      {/* Validation error */}
      {error && (
        <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-8" />
    </div>
  );
}
