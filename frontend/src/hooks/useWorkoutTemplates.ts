"use client";

import { useCallback, useEffect, useState } from "react";
import { db, type LocalWorkoutTemplate, type TemplateExercise } from "@/lib/db";

// ─── Default templates (seeded on first open) ─────────────────────────────────

const DEFAULTS: Omit<LocalWorkoutTemplate, "id" | "created_at">[] = [
  {
    name: "Push — Empuje",
    exercises: [
      { name: "Press banca", sets: 4, reps: 8 },
      { name: "Press banca inclinado", sets: 3, reps: 10 },
      { name: "Press militar con mancuernas", sets: 3, reps: 12 },
      { name: "Elevaciones laterales", sets: 3, reps: 15 },
      { name: "Extensión en polea alta (cuerda)", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Pull — Tirón",
    exercises: [
      { name: "Dominadas (prono)", sets: 4, reps: 8 },
      { name: "Remo con barra", sets: 4, reps: 8 },
      { name: "Jalón al pecho", sets: 3, reps: 10 },
      { name: "Curl con barra EZ", sets: 3, reps: 12 },
      { name: "Curl martillo", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Legs — Pierna",
    exercises: [
      { name: "Sentadilla libre", sets: 4, reps: 8 },
      { name: "Prensa de piernas", sets: 3, reps: 10 },
      { name: "Peso muerto rumano", sets: 3, reps: 10 },
      { name: "Curl de femoral tumbado", sets: 3, reps: 12 },
      { name: "Pantorrillas de pie", sets: 4, reps: 15 },
    ],
  },
  {
    name: "Arnold — Pecho & Espalda",
    exercises: [
      { name: "Press banca", sets: 4, reps: 8 },
      { name: "Aperturas con mancuernas", sets: 3, reps: 12 },
      { name: "Dominadas (prono)", sets: 4, reps: 8 },
      { name: "Remo con barra", sets: 4, reps: 8 },
      { name: "Jalón al pecho", sets: 3, reps: 10 },
    ],
  },
  {
    name: "Arnold — Hombros & Brazos",
    exercises: [
      { name: "Press Arnold", sets: 4, reps: 10 },
      { name: "Elevaciones laterales", sets: 3, reps: 15 },
      { name: "Face pull", sets: 3, reps: 15 },
      { name: "Curl con barra EZ", sets: 3, reps: 12 },
      { name: "Extensión en polea alta (cuerda)", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Arnold — Pierna",
    exercises: [
      { name: "Sentadilla libre", sets: 4, reps: 8 },
      { name: "Prensa de piernas", sets: 3, reps: 12 },
      { name: "Peso muerto rumano", sets: 3, reps: 10 },
      { name: "Curl de femoral tumbado", sets: 3, reps: 12 },
      { name: "Pantorrillas de pie", sets: 4, reps: 15 },
    ],
  },
  {
    name: "Full Body",
    exercises: [
      { name: "Sentadilla libre", sets: 3, reps: 8 },
      { name: "Press banca", sets: 3, reps: 8 },
      { name: "Peso muerto convencional", sets: 3, reps: 6 },
      { name: "Press militar con barra", sets: 3, reps: 10 },
      { name: "Remo con barra", sets: 3, reps: 8 },
    ],
  },
];

async function seedDefaultTemplates(): Promise<void> {
  const count = await db.workout_templates.count();
  if (count > 0) return;
  const rows: LocalWorkoutTemplate[] = DEFAULTS.map((t, i) => ({
    id: crypto.randomUUID(),
    name: t.name,
    exercises: t.exercises,
    created_at: new Date(Date.now() + i).toISOString(),
  }));
  await db.workout_templates.bulkPut(rows);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<LocalWorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    await seedDefaultTemplates();
    const all = await db.workout_templates.orderBy("created_at").toArray();
    setTemplates(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTemplate = useCallback(
    async (name: string, exercises: TemplateExercise[]): Promise<string> => {
      const t: LocalWorkoutTemplate = {
        id: crypto.randomUUID(),
        name,
        exercises,
        created_at: new Date().toISOString(),
      };
      await db.workout_templates.put(t);
      setTemplates((prev) => [...prev, t]);
      return t.id;
    },
    [],
  );

  const updateTemplate = useCallback(
    async (id: string, name: string, exercises: TemplateExercise[]) => {
      await db.workout_templates.update(id, { name, exercises });
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name, exercises } : t)),
      );
    },
    [],
  );

  const deleteTemplate = useCallback(async (id: string) => {
    await db.workout_templates.delete(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const patchTemplate = useCallback(
    async (id: string, patch: Partial<LocalWorkoutTemplate>) => {
      await db.workout_templates.update(id, patch);
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
    },
    [],
  );

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    patchTemplate,
    reload: load,
  };
}
