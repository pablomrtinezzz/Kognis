"use client";

import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { EXERCISE_CATALOG, ALL_EXERCISES } from "@/lib/exercises";
import { GlassPanel } from "@/components/ui/GlassPanel";

export { EXERCISE_CATALOG, ALL_EXERCISES };

// ─── Draft types ──────────────────────────────────────────────────────────────

export interface DraftSet {
  localId: string;
  reps: string;
  weightKg: string;
}

export interface DraftExercise {
  localId: string;
  name: string;
  sets: DraftSet[];
}

export const newSet = (): DraftSet => ({
  localId: crypto.randomUUID(),
  reps: "",
  weightKg: "",
});

export const newExercise = (): DraftExercise => ({
  localId: crypto.randomUUID(),
  name: "",
  sets: [newSet()],
});

// ─── Exercise Combobox ────────────────────────────────────────────────────────

interface ExerciseComboboxProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export function ExerciseCombobox({
  value,
  onChange,
  autoFocus,
}: ExerciseComboboxProps) {
  const [open, setOpen] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const isSearching = value.trim().length > 0;

  const searchResults = isSearching
    ? ALL_EXERCISES.filter((ex) =>
        ex.name.toLowerCase().includes(value.toLowerCase()),
      )
    : [];

  const searchGrouped = searchResults.reduce<Record<string, string[]>>(
    (acc, ex) => {
      (acc[ex.muscle] ??= []).push(ex.name);
      return acc;
    },
    {},
  );

  const muscleExercises = selectedMuscle
    ? (EXERCISE_CATALOG[selectedMuscle] ?? [])
    : [];

  const selectExercise = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  const DROPDOWN_STYLE: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: "calc(100% + 8px)",
    zIndex: 9999,
    borderRadius: "1rem",
    overflow: "hidden",
    backgroundColor: "rgba(10,10,18,0.97)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 25px 50px -12px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.04) inset",
  };

  const STICKY_HEADER_STYLE: React.CSSProperties = {
    position: "sticky",
    top: 0,
    backgroundColor: "rgba(10,10,18,0.99)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    zIndex: 10,
  };

  return (
    <div className="relative flex-1 min-w-0">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() =>
          setTimeout(() => {
            setOpen(false);
            setSelectedMuscle(null);
          }, 150)
        }
        placeholder="Exercise"
        autoFocus={autoFocus}
        className="w-full bg-transparent text-sm font-semibold text-white/90 placeholder-white/20 focus:outline-none"
      />

      {open && (
        <div style={DROPDOWN_STYLE}>
          {isSearching ? (
            <div className="max-h-72 overflow-y-auto overscroll-contain">
              {Object.keys(searchGrouped).length > 0 ? (
                Object.entries(searchGrouped).map(([muscle, names]) => (
                  <div key={muscle}>
                    <p
                      className="px-4 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      {muscle}
                    </p>
                    {names.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={() => selectExercise(name)}
                        className="w-full text-left px-4 py-2.5 text-sm transition-all duration-200"
                        style={
                          value === name
                            ? {
                                backgroundColor: "rgba(16,185,129,0.08)",
                                color: "rgb(16,185,129)",
                                fontWeight: 600,
                              }
                            : { color: "rgba(255,255,255,0.60)" }
                        }
                        onMouseEnter={(e) => {
                          if (value !== name)
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "rgba(255,255,255,0.04)";
                        }}
                        onMouseLeave={(e) => {
                          if (value !== name)
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "transparent";
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <p
                  className="px-4 py-4 text-sm italic"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  No matches — will be saved as custom
                </p>
              )}
            </div>
          ) : selectedMuscle ? (
            <>
              <div style={STICKY_HEADER_STYLE}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedMuscle(null);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-xs transition-all duration-200"
                  style={{ color: "rgba(255,255,255,0.40)" }}
                >
                  ← Change muscle group
                </button>
                <p
                  className="px-4 pb-2.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {selectedMuscle}
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto overscroll-contain pb-2">
                {muscleExercises.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={() => selectExercise(name)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-all duration-200"
                    style={
                      value === name
                        ? {
                            backgroundColor: "rgba(16,185,129,0.08)",
                            color: "rgb(16,185,129)",
                            fontWeight: 600,
                          }
                        : { color: "rgba(255,255,255,0.60)" }
                    }
                    onMouseEnter={(e) => {
                      if (value !== name)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (value !== name)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = "transparent";
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="p-3">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3 px-1.5"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Which muscle group?
              </p>
              <div className="grid grid-cols-2 gap-1">
                {Object.keys(EXERCISE_CATALOG).map((muscle) => (
                  <button
                    key={muscle}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedMuscle(muscle);
                    }}
                    className="text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "rgba(255,255,255,0.90)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "rgba(255,255,255,0.55)";
                    }}
                  >
                    {muscle}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Exercise card ────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  ex: DraftExercise;
  exIdx: number;
  isOnly: boolean;
  isLast: boolean;
  onRemoveExercise: () => void;
  onUpdateName: (name: string) => void;
  onAddSet: () => void;
  onCopySet: (setIdx: number) => void;
  onRemoveSet: (setIdx: number) => void;
  onUpdateSet: (
    setIdx: number,
    field: "reps" | "weightKg",
    value: string,
  ) => void;
}

export function ExerciseCard({
  ex,
  exIdx,
  isOnly,
  isLast,
  onRemoveExercise,
  onUpdateName,
  onAddSet,
  onCopySet,
  onRemoveSet,
  onUpdateSet,
}: ExerciseCardProps) {
  return (
    <GlassPanel style={{ overflow: "visible", borderRadius: "1.5rem" }}>
      {/* Exercise name row */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums shrink-0 w-4 text-center"
          style={{ color: "rgba(255,255,255,0.20)" }}
        >
          {exIdx + 1}
        </span>
        <ExerciseCombobox
          value={ex.name}
          onChange={onUpdateName}
          autoFocus={isLast && ex.name === ""}
        />
        {!isOnly && (
          <button
            onClick={onRemoveExercise}
            className="transition-all duration-300 ease-out p-1.5 rounded-xl active:scale-90 shrink-0"
            style={{ color: "rgba(255,255,255,0.15)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgb(248,113,113)";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(248,113,113,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
            }}
            aria-label="Remove exercise"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1.75rem_1fr_1fr_1.75rem_1.75rem] gap-2 px-5 pt-4 pb-1.5">
        <span
          className="text-[9px] text-center font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.20)" }}
        >
          #
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.20)" }}
        >
          Reps
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.20)" }}
        >
          Weight kg
        </span>
        <span />
        <span />
      </div>

      {/* Set rows */}
      <div className="px-5 pb-4 space-y-2">
        {ex.sets.map((s, setIdx) => (
          <div
            key={s.localId}
            className="grid grid-cols-[1.75rem_1fr_1fr_1.75rem_1.75rem] gap-2 items-center"
          >
            <span
              className="text-xs text-center font-semibold tabular-nums"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {setIdx + 1}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={s.reps}
              onChange={(e) => onUpdateSet(setIdx, "reps", e.target.value)}
              placeholder="—"
              className="w-full h-10 rounded-xl text-sm text-center font-semibold tabular-nums focus:outline-none transition-all duration-300 placeholder:text-white/15"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.80)",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  "rgba(37,119,255,0.45)";
                (e.currentTarget as HTMLInputElement).style.boxShadow =
                  "0 0 0 3px rgba(37,119,255,0.10)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={s.weightKg}
              onChange={(e) => onUpdateSet(setIdx, "weightKg", e.target.value)}
              placeholder="—"
              className="w-full h-10 rounded-xl text-sm text-center font-semibold tabular-nums focus:outline-none transition-all duration-300 placeholder:text-white/15"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.80)",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  "rgba(37,119,255,0.45)";
                (e.currentTarget as HTMLInputElement).style.boxShadow =
                  "0 0 0 3px rgba(37,119,255,0.10)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
            <button
              onClick={() => onCopySet(setIdx)}
              className="flex items-center justify-center transition-all duration-300 ease-out active:scale-90"
              style={{ color: "rgba(255,255,255,0.15)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "rgb(16,185,129)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,255,255,0.15)")
              }
              aria-label="Duplicate set"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={() => onRemoveSet(setIdx)}
              disabled={ex.sets.length === 1}
              className="flex items-center justify-center transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-0 active:scale-90"
              style={{ color: "rgba(255,255,255,0.15)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "rgb(248,113,113)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,255,255,0.15)")
              }
              aria-label="Remove set"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Add set */}
      <button
        onClick={onAddSet}
        className="w-full py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-300 ease-out rounded-b-3xl"
        style={{
          color: "rgba(255,255,255,0.25)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "rgb(16,185,129)";
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "rgba(16,185,129,0.04)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "rgba(255,255,255,0.25)";
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "transparent";
        }}
      >
        + Add set
      </button>
    </GlassPanel>
  );
}

// ─── Exercise list actions ────────────────────────────────────────────────────

export function useExerciseActions(
  setExercises: React.Dispatch<React.SetStateAction<DraftExercise[]>>,
) {
  const addExercise = () => setExercises((prev) => [...prev, newExercise()]);

  const removeExercise = (exIdx: number) =>
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));

  const updateExerciseName = (exIdx: number, name: string) =>
    setExercises((prev) =>
      prev.map((ex, i) => (i === exIdx ? { ...ex, name } : ex)),
    );

  const addSet = (exIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, newSet()] } : ex,
      ),
    );

  const copySet = (exIdx: number, setIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: [
                ...ex.sets.slice(0, setIdx + 1),
                { ...ex.sets[setIdx], localId: crypto.randomUUID() },
                ...ex.sets.slice(setIdx + 1),
              ],
            }
          : ex,
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

  return {
    addExercise,
    removeExercise,
    updateExerciseName,
    addSet,
    copySet,
    removeSet,
    updateSet,
  };
}

// ─── Exercise list renderer ───────────────────────────────────────────────────

interface ExerciseListProps {
  exercises: DraftExercise[];
  actions: ReturnType<typeof useExerciseActions>;
}

export function ExerciseList({ exercises, actions }: ExerciseListProps) {
  return (
    <div className="flex flex-col">
      {/* Scrollable exercise cards — scrollbars hidden via globals.css */}
      <div
        className="overflow-y-auto overscroll-contain space-y-3"
        style={{ scrollbarWidth: "none" }}
      >
        {exercises.map((ex, exIdx) => (
          <ExerciseCard
            key={ex.localId}
            ex={ex}
            exIdx={exIdx}
            isOnly={exercises.length === 1}
            isLast={exIdx === exercises.length - 1}
            onRemoveExercise={() => actions.removeExercise(exIdx)}
            onUpdateName={(name) => actions.updateExerciseName(exIdx, name)}
            onAddSet={() => actions.addSet(exIdx)}
            onCopySet={(setIdx) => actions.copySet(exIdx, setIdx)}
            onRemoveSet={(setIdx) => actions.removeSet(exIdx, setIdx)}
            onUpdateSet={(setIdx, field, value) =>
              actions.updateSet(exIdx, setIdx, field, value)
            }
          />
        ))}
      </div>

      <button
        onClick={actions.addExercise}
        className="mt-3 w-full py-4 rounded-3xl border border-dashed flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 ease-out active:scale-[0.98]"
        style={{
          borderColor: "rgba(255,255,255,0.07)",
          color: "rgba(255,255,255,0.25)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(37,119,255,0.30)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "rgba(37,119,255,0.70)";
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "rgba(37,119,255,0.03)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(255,255,255,0.07)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "rgba(255,255,255,0.25)";
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "transparent";
        }}
      >
        <Plus size={15} strokeWidth={2.5} />
        Add exercise
      </button>
    </div>
  );
}

// ─── Static workout templates (UI presets) ────────────────────────────────────

export interface WorkoutTemplate {
  id: string;
  label: string;
  split: string;
  exercises: { name: string; sets: number; reps: number }[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "push",
    label: "Push",
    split: "PPL",
    exercises: [
      { name: "Press banca", sets: 4, reps: 8 },
      { name: "Press banca inclinado", sets: 3, reps: 10 },
      { name: "Press militar con mancuernas", sets: 3, reps: 12 },
      { name: "Elevaciones laterales", sets: 3, reps: 15 },
      { name: "Extensión en polea alta (cuerda)", sets: 3, reps: 12 },
    ],
  },
  {
    id: "pull",
    label: "Pull",
    split: "PPL",
    exercises: [
      { name: "Dominadas (prono)", sets: 4, reps: 8 },
      { name: "Remo con barra", sets: 4, reps: 8 },
      { name: "Jalón al pecho", sets: 3, reps: 10 },
      { name: "Curl con barra EZ", sets: 3, reps: 12 },
      { name: "Curl martillo", sets: 3, reps: 12 },
    ],
  },
  {
    id: "legs",
    label: "Legs",
    split: "PPL",
    exercises: [
      { name: "Sentadilla libre", sets: 4, reps: 8 },
      { name: "Prensa de piernas", sets: 3, reps: 10 },
      { name: "Peso muerto rumano", sets: 3, reps: 10 },
      { name: "Curl de femoral tumbado", sets: 3, reps: 12 },
      { name: "Pantorrillas de pie", sets: 4, reps: 15 },
    ],
  },
  {
    id: "arnold-chest-back",
    label: "Pecho & Espalda",
    split: "Arnold",
    exercises: [
      { name: "Press banca", sets: 4, reps: 8 },
      { name: "Aperturas con mancuernas", sets: 3, reps: 12 },
      { name: "Dominadas (prono)", sets: 4, reps: 8 },
      { name: "Remo con barra", sets: 4, reps: 8 },
      { name: "Jalón al pecho", sets: 3, reps: 10 },
    ],
  },
  {
    id: "arnold-shoulders-arms",
    label: "Hombros & Brazos",
    split: "Arnold",
    exercises: [
      { name: "Press Arnold", sets: 4, reps: 10 },
      { name: "Elevaciones laterales", sets: 3, reps: 15 },
      { name: "Face pull", sets: 3, reps: 15 },
      { name: "Curl con barra EZ", sets: 3, reps: 12 },
      { name: "Extensión en polea alta (cuerda)", sets: 3, reps: 12 },
    ],
  },
  {
    id: "arnold-legs",
    label: "Pierna",
    split: "Arnold",
    exercises: [
      { name: "Sentadilla libre", sets: 4, reps: 8 },
      { name: "Prensa de piernas", sets: 3, reps: 12 },
      { name: "Peso muerto rumano", sets: 3, reps: 10 },
      { name: "Curl de femoral tumbado", sets: 3, reps: 12 },
      { name: "Pantorrillas de pie", sets: 4, reps: 15 },
    ],
  },
  {
    id: "full-body",
    label: "Full Body",
    split: "Full Body",
    exercises: [
      { name: "Sentadilla libre", sets: 3, reps: 8 },
      { name: "Press banca", sets: 3, reps: 8 },
      { name: "Peso muerto convencional", sets: 3, reps: 6 },
      { name: "Press militar con barra", sets: 3, reps: 10 },
      { name: "Remo con barra", sets: 3, reps: 8 },
    ],
  },
];

export function templateToExercises(
  template: WorkoutTemplate,
): DraftExercise[] {
  return template.exercises.map(({ name, sets, reps }) => ({
    localId: crypto.randomUUID(),
    name,
    sets: Array.from({ length: sets }, () => ({
      localId: crypto.randomUUID(),
      reps: String(reps),
      weightKg: "",
    })),
  }));
}
