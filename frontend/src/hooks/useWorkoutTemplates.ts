"use client";

import { useCallback, useEffect, useState } from "react";
import { db, type LocalWorkoutTemplate, type TemplateExercise } from "@/lib/db";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<LocalWorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
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
