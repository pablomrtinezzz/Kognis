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

// ─── Exercise Combobox ─────────────────────────────────────────────────────────

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
        className="w-full bg-transparent font-semibold placeholder-foreground/30 focus:outline-none"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-[#111827] border border-gray-700 shadow-2xl overflow-hidden">
          {isSearching ? (
            <div className="max-h-72 overflow-y-auto overscroll-contain">
              {Object.keys(searchGrouped).length > 0 ? (
                Object.entries(searchGrouped).map(([muscle, names]) => (
                  <div key={muscle}>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                      {muscle}
                    </p>
                    {names.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={() => selectExercise(name)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          value === name
                            ? "bg-accent/20 text-accent font-semibold"
                            : "hover:bg-white/5 text-foreground/80"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-foreground/40 italic">
                  Sin coincidencias — se guardará como ejercicio personalizado
                </p>
              )}
            </div>
          ) : selectedMuscle ? (
            <>
              <div className="sticky top-0 bg-[#111827] border-b border-gray-700/60 z-10">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedMuscle(null);
                  }}
                  className="flex items-center gap-1.5 w-full px-3 py-2.5 text-xs text-foreground/50 hover:text-foreground/80 transition-colors"
                >
                  ← Cambiar grupo muscular
                </button>
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                  {selectedMuscle}
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto overscroll-contain pb-1">
                {muscleExercises.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={() => selectExercise(name)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      value === name
                        ? "bg-accent/20 text-accent font-semibold"
                        : "hover:bg-white/5 text-foreground/80"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="max-h-72 overflow-y-auto overscroll-contain p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2.5 px-1">
                ¿Qué músculo trabajas?
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.keys(EXERCISE_CATALOG).map((muscle) => (
                  <button
                    key={muscle}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedMuscle(muscle);
                    }}
                    className="text-left px-3 py-2 rounded-lg text-sm text-foreground/70 hover:bg-white/5 hover:text-foreground transition-colors"
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
    <div className="rounded-2xl bg-[#1C2331] border border-gray-800">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 rounded-t-2xl">
        <ExerciseCombobox
          value={ex.name}
          onChange={onUpdateName}
          autoFocus={isLast && ex.name === ""}
        />
        {!isOnly && (
          <button
            onClick={onRemoveExercise}
            className="text-foreground/30 hover:text-red-400 transition-colors p-1 shrink-0"
            aria-label="Eliminar ejercicio"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1.5rem_1fr_1fr_1.5rem_1.5rem] gap-2 px-4 pt-3 pb-1">
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
        <span />
      </div>

      <div className="px-4 pb-3 space-y-2">
        {ex.sets.map((s, setIdx) => (
          <div
            key={s.localId}
            className="grid grid-cols-[1.5rem_1fr_1fr_1.5rem_1.5rem] gap-2 items-center"
          >
            <span className="text-sm text-foreground/40 text-center font-mono">
              {setIdx + 1}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={s.reps}
              onChange={(e) => onUpdateSet(setIdx, "reps", e.target.value)}
              placeholder="0"
              className="w-full h-10 bg-background rounded-lg text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
            />
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={s.weightKg}
              onChange={(e) => onUpdateSet(setIdx, "weightKg", e.target.value)}
              placeholder="0"
              className="w-full h-10 bg-background rounded-lg text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
            />
            <button
              onClick={() => onCopySet(setIdx)}
              className="flex items-center justify-center text-foreground/20 hover:text-accent transition-colors"
              aria-label="Duplicar serie"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={() => onRemoveSet(setIdx)}
              disabled={ex.sets.length === 1}
              className="flex items-center justify-center text-foreground/20 hover:text-red-400 transition-colors disabled:pointer-events-none disabled:opacity-0"
              aria-label="Eliminar serie"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAddSet}
        className="w-full py-3 text-sm font-semibold text-accent hover:bg-accent/5 border-t border-gray-800 transition-colors rounded-b-2xl"
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
      <div className="space-y-4">
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
        className="mt-4 w-full py-4 rounded-2xl border-2 border-dashed border-gray-700 hover:border-primary/50 text-foreground/40 hover:text-primary/60 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
      >
        <Plus size={18} />
        Añadir ejercicio
      </button>
    </>
  );
}
