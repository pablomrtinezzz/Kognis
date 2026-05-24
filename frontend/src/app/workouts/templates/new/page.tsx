"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Minus, Plus } from "lucide-react";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { EXERCISE_CATALOG } from "../../_workout-form";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TemplateExerciseDraft {
  id: string;
  name: string;
  sets: number;
  reps: number;
}

const newDraftExercise = (): TemplateExerciseDraft => ({
  id: crypto.randomUUID(),
  name: "",
  sets: 3,
  reps: 10,
});

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">
        {label}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.10] flex items-center justify-center transition-all duration-300 ease-out active:scale-90 text-white/50 hover:text-white/90"
        >
          <Minus size={10} />
        </button>
        <span className="text-sm font-bold tabular-nums w-6 text-center text-white/80">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.10] flex items-center justify-center transition-all duration-300 ease-out active:scale-90 text-white/50 hover:text-white/90"
        >
          <Plus size={10} />
        </button>
      </div>
    </div>
  );
}

// ─── Exercise row ──────────────────────────────────────────────────────────────

function ExerciseRow({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: TemplateExerciseDraft;
  onChange: (updated: TemplateExerciseDraft) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(exercise.name);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const muscles = Object.keys(EXERCISE_CATALOG);
  const isSearching = query.length > 0;
  const searchResults = isSearching
    ? Object.entries(EXERCISE_CATALOG).reduce<Record<string, string[]>>(
        (acc, [muscle, names]) => {
          const matches = names.filter((n) =>
            n.toLowerCase().includes(query.toLowerCase()),
          );
          if (matches.length) acc[muscle] = matches;
          return acc;
        },
        {},
      )
    : {};

  const selectExercise = (name: string) => {
    setQuery(name);
    onChange({ ...exercise, name });
    setOpen(false);
    setSelectedMuscle(null);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-white/[0.06] shadow-card">
      {/* Name input */}
      <div className="flex-1 min-w-0 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ ...exercise, name: e.target.value });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() =>
            setTimeout(() => {
              setOpen(false);
              setSelectedMuscle(null);
            }, 150)
          }
          placeholder="Nombre del ejercicio"
          className="w-full bg-transparent text-sm font-semibold text-white/80 placeholder-white/20 focus:outline-none py-0.5"
        />

        {open && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-[#111118]/95 backdrop-blur-xl border border-white/[0.07] shadow-float overflow-hidden">
            {isSearching ? (
              <div className="max-h-56 overflow-y-auto overscroll-contain">
                {Object.keys(searchResults).length > 0 ? (
                  Object.entries(searchResults).map(([muscle, names]) => (
                    <div key={muscle}>
                      <p className="px-4 pt-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                        {muscle}
                      </p>
                      {names.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={() => selectExercise(name)}
                          className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white/90 transition-all duration-200"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-4 text-sm text-white/25 italic">
                    Sin coincidencias — ejercicio personalizado
                  </p>
                )}
              </div>
            ) : selectedMuscle ? (
              <div className="max-h-56 overflow-y-auto overscroll-contain">
                <div className="sticky top-0 bg-[#111118]/98 border-b border-white/[0.05] z-10">
                  <button
                    type="button"
                    onMouseDown={() => setSelectedMuscle(null)}
                    className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium text-white/35 hover:text-white/70 transition-all duration-200"
                  >
                    ← {selectedMuscle}
                  </button>
                </div>
                {EXERCISE_CATALOG[selectedMuscle].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={() => selectExercise(name)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white/90 transition-all duration-200"
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2.5">
                {muscles.map((muscle) => (
                  <button
                    key={muscle}
                    type="button"
                    onMouseDown={() => setSelectedMuscle(muscle)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-white/55 hover:bg-white/[0.05] hover:text-white/90 transition-all duration-200 font-medium"
                  >
                    {muscle}
                    <span className="text-white/20 text-xs">
                      {EXERCISE_CATALOG[muscle].length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Steppers */}
      <Stepper
        label="Series"
        value={exercise.sets}
        min={1}
        max={10}
        onChange={(v) => onChange({ ...exercise, sets: v })}
      />
      <Stepper
        label="Reps"
        value={exercise.reps}
        min={1}
        max={30}
        onChange={(v) => onChange({ ...exercise, reps: v })}
      />

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="text-white/15 hover:text-red-400 transition-all duration-300 ease-out p-1.5 rounded-xl hover:bg-red-400/[0.07] shrink-0 active:scale-90"
        aria-label="Eliminar"
      >
        <Minus size={13} />
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewTemplatePage() {
  const router = useRouter();
  const { createTemplate } = useWorkoutTemplates();

  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<TemplateExerciseDraft[]>([
    newDraftExercise(),
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateExercise = (id: string, updated: TemplateExerciseDraft) =>
    setExercises((prev) => prev.map((e) => (e.id === id ? updated : e)));

  const removeExercise = (id: string) =>
    setExercises((prev) => prev.filter((e) => e.id !== id));

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError("La rutina necesita un nombre.");
      return;
    }
    if (exercises.length === 0) {
      setError("Añade al menos un ejercicio.");
      return;
    }
    if (exercises.some((e) => !e.name.trim())) {
      setError("Todos los ejercicios deben tener un nombre.");
      return;
    }

    setSaving(true);
    try {
      await createTemplate(
        name.trim(),
        exercises.map(({ name, sets, reps }) => ({ name, sets, reps })),
      );
      router.push("/workouts");
    } catch {
      setError("No se pudo guardar la rutina.");
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-none flex-1 flex flex-col px-4 md:px-10">
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
          disabled={saving}
          className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-5 py-2 rounded-full disabled:opacity-30 active:scale-[0.96] transition-all duration-300 ease-out shadow-primary-glow"
        >
          <CheckCircle size={14} strokeWidth={2.5} />
          {saving ? "Guardando…" : "Guardar rutina"}
        </button>
      </div>

      {/* ── Name ── */}
      <div className="mb-8">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la rutina"
          className="w-full bg-transparent text-2xl font-bold tracking-tight text-white/90 placeholder-white/15 focus:outline-none"
          autoFocus
        />
        <p className="text-xs text-white/20 mt-1.5">
          Ej: Push, Pierna, Full Body…
        </p>
      </div>

      {/* ── Exercises ── */}
      <div className="space-y-2.5">
        {exercises.map((ex) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            onChange={(updated) => updateExercise(ex.id, updated)}
            onRemove={() => removeExercise(ex.id)}
          />
        ))}
      </div>

      {/* Add exercise */}
      <button
        onClick={() => setExercises((prev) => [...prev, newDraftExercise()])}
        className="mt-3 w-full py-4 rounded-3xl border border-dashed border-white/[0.07] hover:border-primary/25 text-white/25 hover:text-primary/60 hover:bg-primary/[0.03] transition-all duration-300 ease-out text-sm font-semibold active:scale-[0.98]"
      >
        + Añadir ejercicio
      </button>

      {error && (
        <p className="mt-4 text-sm text-red-400/90 text-center font-medium">
          {error}
        </p>
      )}

      <div className="h-10" />
    </div>
  );
}
