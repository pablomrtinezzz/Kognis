"use client";

import { useState } from "react";

// ─── Exercise catalog ──────────────────────────────────────────────────────────

export const EXERCISE_CATALOG: Record<string, string[]> = {
  Pecho: [
    "Press banca",
    "Press banca inclinado",
    "Press banca declinado",
    "Press con mancuernas",
    "Press con mancuernas inclinado",
    "Cruce de poleas alto",
    "Cruce de poleas bajo",
    "Cruce de poleas medio",
    "Aperturas con mancuernas",
    "Pec Deck (mariposa)",
    "Fondos en paralelas",
    "Pull-over con mancuerna",
    "Flexiones",
    "Flexiones con lastre",
  ],
  Espalda: [
    "Dominadas (prono)",
    "Chin-up (supino)",
    "Jalón al pecho",
    "Jalón agarre estrecho",
    "Jalón en V",
    "Remo con barra",
    "Remo T-bar",
    "Remo con mancuerna",
    "Remo en polea baja",
    "Remo en máquina",
    "Peso muerto convencional",
    "Peso muerto sumo",
    "Pull-over en polea",
    "Straight-arm pulldown",
    "Buenos días",
    "Hiperextensión",
  ],
  Pierna: [
    "Sentadilla libre",
    "Sentadilla en Smith",
    "Sentadilla búlgara",
    "Sentadilla frontal",
    "Prensa de piernas",
    "Hack squat",
    "Extensión de cuádriceps",
    "Curl de femoral tumbado",
    "Curl de femoral sentado",
    "Zancadas con barra",
    "Zancadas con mancuernas",
    "Zancadas caminando",
    "Hip thrust",
    "Puente de glúteo",
    "Peso muerto rumano",
    "Peso muerto con mancuernas",
    "Abducción de cadera",
    "Aducción de cadera",
    "Pantorrillas de pie",
    "Pantorrillas sentado",
  ],
  Hombros: [
    "Press militar con barra",
    "Press militar con mancuernas",
    "Press Arnold",
    "Press en máquina",
    "Elevaciones laterales",
    "Elevaciones laterales en polea",
    "Elevaciones frontales con barra",
    "Elevaciones frontales con mancuernas",
    "Elevaciones frontales en polea",
    "Pájaro (posterior)",
    "Face pull",
    "Encogimientos con barra",
    "Encogimientos con mancuernas",
  ],
  Bíceps: [
    "Curl con barra recta",
    "Curl con barra EZ",
    "Curl con mancuernas alterno",
    "Curl con mancuernas simultáneo",
    "Curl martillo",
    "Curl en predicador (Scott)",
    "Curl concentrado",
    "Curl araña (spider curl)",
    "Curl en polea baja",
    "Curl en máquina",
  ],
  Tríceps: [
    "Press francés con barra EZ",
    "Press francés con mancuernas",
    "Skull crusher",
    "Extensión en polea alta (cuerda)",
    "Extensión en polea alta (barra)",
    "Extensión en polea baja",
    "Extensión sobre la cabeza",
    "Press cerrado",
    "Fondos en banco",
    "Fondos en paralelas (tríceps)",
    "Patada de tríceps",
  ],
  Core: [
    "Plancha frontal",
    "Plancha lateral",
    "Crunch",
    "Crunch con cable",
    "Crunch en máquina",
    "Rueda abdominal",
    "Elevación de piernas en barra",
    "Elevación de piernas en suelo",
    "Hanging knee raise",
    "Russian twist",
    "Dead bug",
    "Bird dog",
    "Pallof press",
    "L-sit",
    "Tijeras",
  ],
  Cardio: [
    "Remo ergómetro",
    "Bicicleta estática",
    "Elíptica",
    "Cinta de correr",
    "Salto a la comba",
    "Burpees",
    "Box jumps",
    "Mountain climbers",
    "Sprints",
    "Escalador (stepper)",
  ],
};

export const ALL_EXERCISES = Object.entries(EXERCISE_CATALOG).flatMap(
  ([muscle, names]) => names.map((name) => ({ muscle, name })),
);

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
        placeholder="Ejercicio"
        autoFocus={autoFocus}
        className="w-full bg-transparent text-sm font-semibold text-white/90 placeholder-white/20 focus:outline-none"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-[#111118]/95 backdrop-blur-xl border border-white/[0.07] shadow-float overflow-hidden">
          {isSearching ? (
            <div className="max-h-72 overflow-y-auto overscroll-contain">
              {Object.keys(searchGrouped).length > 0 ? (
                Object.entries(searchGrouped).map(([muscle, names]) => (
                  <div key={muscle}>
                    <p className="px-4 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                      {muscle}
                    </p>
                    {names.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={() => selectExercise(name)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200
                          ${
                            value === name
                              ? "bg-accent/10 text-accent font-semibold"
                              : "text-white/60 hover:bg-white/[0.05] hover:text-white/90"
                          }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <p className="px-4 py-4 text-sm text-white/30 italic">
                  Sin coincidencias — se guardará como personalizado
                </p>
              )}
            </div>
          ) : selectedMuscle ? (
            <>
              <div className="sticky top-0 bg-[#111118]/98 border-b border-white/[0.05] z-10">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedMuscle(null);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-xs text-white/40 hover:text-white/70 transition-all duration-200"
                >
                  ← Cambiar grupo muscular
                </button>
                <p className="px-4 pb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                  {selectedMuscle}
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto overscroll-contain pb-2">
                {muscleExercises.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={() => selectExercise(name)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200
                      ${
                        value === name
                          ? "bg-accent/10 text-accent font-semibold"
                          : "text-white/60 hover:bg-white/[0.05] hover:text-white/90"
                      }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-3 px-1.5">
                ¿Qué músculo trabajas?
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
                    className="text-left px-3 py-2.5 rounded-xl text-sm text-white/55 hover:bg-white/[0.06] hover:text-white/90 transition-all duration-200 font-medium"
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

// ─── Shared set/exercise form rows ────────────────────────────────────────────

import { Copy, Plus, Trash2 } from "lucide-react";

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
    <div className="rounded-3xl bg-card border border-white/[0.06] shadow-card overflow-visible">
      {/* Exercise header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/20 tabular-nums shrink-0 w-4 text-center">
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
            className="text-white/15 hover:text-red-400 transition-all duration-300 ease-out p-1.5 rounded-xl hover:bg-red-400/[0.08] active:scale-90 shrink-0"
            aria-label="Eliminar ejercicio"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1.75rem_1fr_1fr_1.75rem_1.75rem] gap-2 px-5 pt-4 pb-1.5">
        <span className="text-[9px] text-white/20 text-center font-bold uppercase tracking-[0.1em]">
          #
        </span>
        <span className="text-[9px] text-white/20 font-bold uppercase tracking-[0.1em]">
          Reps
        </span>
        <span className="text-[9px] text-white/20 font-bold uppercase tracking-[0.1em]">
          Peso kg
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
            <span className="text-xs text-white/25 text-center font-semibold tabular-nums">
              {setIdx + 1}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={s.reps}
              onChange={(e) => onUpdateSet(setIdx, "reps", e.target.value)}
              placeholder="—"
              className="w-full h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-center font-semibold tabular-nums text-white/80 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-all duration-300 placeholder:text-white/15 hover:bg-white/[0.06]"
            />
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={s.weightKg}
              onChange={(e) => onUpdateSet(setIdx, "weightKg", e.target.value)}
              placeholder="—"
              className="w-full h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-center font-semibold tabular-nums text-white/80 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-all duration-300 placeholder:text-white/15 hover:bg-white/[0.06]"
            />
            <button
              onClick={() => onCopySet(setIdx)}
              className="flex items-center justify-center text-white/15 hover:text-accent transition-all duration-300 ease-out active:scale-90"
              aria-label="Duplicar serie"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={() => onRemoveSet(setIdx)}
              disabled={ex.sets.length === 1}
              className="flex items-center justify-center text-white/15 hover:text-red-400 transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-0 active:scale-90"
              aria-label="Eliminar serie"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Add set */}
      <button
        onClick={onAddSet}
        className="w-full py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/25 hover:text-accent hover:bg-accent/[0.04] border-t border-white/[0.05] transition-all duration-300 ease-out rounded-b-3xl"
      >
        + Añadir serie
      </button>
    </div>
  );
}

// ─── Shared exercise list actions ─────────────────────────────────────────────

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

// ─── Shared exercise list renderer ───────────────────────────────────────────

interface ExerciseListProps {
  exercises: DraftExercise[];
  actions: ReturnType<typeof useExerciseActions>;
}

export function ExerciseList({ exercises, actions }: ExerciseListProps) {
  return (
    <>
      <div className="space-y-3">
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
        className="mt-3 w-full py-4 rounded-3xl border border-dashed border-white/[0.07] hover:border-primary/25 text-white/25 hover:text-primary/60 hover:bg-primary/[0.03] transition-all duration-300 ease-out flex items-center justify-center gap-2 text-sm font-semibold active:scale-[0.98]"
      >
        <Plus size={15} strokeWidth={2.5} />
        Añadir ejercicio
      </button>
    </>
  );
}

// ─── Workout templates ────────────────────────────────────────────────────────

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
