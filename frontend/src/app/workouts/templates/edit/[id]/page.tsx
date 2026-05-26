"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { db } from "@/lib/db";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { useToast } from "@/components/ui/Toast";
import {
  DraftExercise,
  ExerciseList,
  useExerciseActions,
} from "../../../_workout-form";

function EditTemplateInner() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { updateTemplate } = useWorkoutTemplates();
  const toast = useToast();

  const [templateName, setTemplateName] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const template = await db.workout_templates.get(id);
      if (!template) {
        router.replace("/workouts");
        return;
      }
      setTemplateName(template.name);
      setExercises(
        template.exercises.map(({ name, sets, reps, block }) => ({
          localId: crypto.randomUUID(),
          name,
          block: block ?? "main",
          sets: Array.from({ length: sets }, () => ({
            localId: crypto.randomUUID(),
            reps: String(reps),
            weightKg: "",
          })),
        })),
      );
      setLoading(false);
    })();
  }, [id, router]);

  const actions = useExerciseActions(setExercises);

  const handleSave = async () => {
    if (!templateName.trim()) return;
    if (exercises.some((ex) => !ex.name.trim())) {
      toast("All exercises must have a name.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateTemplate(
        id,
        templateName.trim(),
        exercises.map((ex) => ({
          name: ex.name.trim(),
          sets: ex.sets.length,
          reps: parseInt(ex.sets[0]?.reps || "0", 10) || 0,
          block: ex.block,
        })),
      );
      toast("Routine updated", "success");
      router.push("/workouts");
    } catch {
      toast("Could not save changes.", "error");
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="w-full max-w-none flex-1 flex flex-col">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 px-4 md:px-8 py-4 mb-6 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,14,0.90) 0%, rgba(9,9,14,0.72) 100%)",
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
          disabled={saving || !templateName.trim()}
          className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-30 active:scale-[0.96] transition-all shadow-[0_0_20px_rgba(37,119,255,0.3)]"
        >
          <CheckCircle size={15} strokeWidth={2.5} />
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="flex-1 px-4 md:px-8 pb-12 space-y-6">
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Nombre de la rutina"
          className="w-full bg-transparent text-2xl font-bold tracking-tight text-white/90 placeholder-white/20 focus:outline-none border-b border-white/[0.07] pb-2"
        />
        <ExerciseList exercises={exercises} actions={actions} />
      </div>
    </div>
  );
}

export default function EditTemplatePage() {
  return (
    <Suspense>
      <EditTemplateInner />
    </Suspense>
  );
}
