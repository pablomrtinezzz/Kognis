"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/db";
import {
  DraftExercise,
  ExerciseList,
  newExercise,
  useExerciseActions,
} from "../_workout-form";
import { GlassPanel } from "@/components/ui/GlassPanel";

// ─── Inner page ───────────────────────────────────────────────────────────────

function NewWorkoutInner() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const fromTemplateId = searchParams.get("from");

  const startedAt = useRef(new Date().toISOString());

  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [templateLoading, setTemplateLoading] = useState(!!fromTemplateId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = useExerciseActions(setExercises);

  useEffect(() => {
    if (!fromTemplateId) {
      setExercises([newExercise()]);
      return;
    }

    (async () => {
      const template = await db.workout_templates.get(fromTemplateId);
      if (!template) {
        setExercises([newExercise()]);
        setTemplateLoading(false);
        return;
      }

      setWorkoutName(template.name);
      setExercises(
        template.exercises.map(({ name, sets, reps }) => ({
          localId: crypto.randomUUID(),
          name,
          sets: Array.from({ length: sets }, () => ({
            localId: crypto.randomUUID(),
            reps: String(reps),
            weightKg: "",
          })),
        })),
      );
      setTemplateLoading(false);
    })();
  }, [fromTemplateId]);

  const handleSave = async () => {
    setError(null);

    if (exercises.some((ex) => !ex.name.trim())) {
      setError("All exercises must have a name.");
      return;
    }
    if (exercises.some((ex) => ex.sets.length === 0)) {
      setError("Each exercise must have at least one set.");
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

      router.push("/progress");
    } catch {
      setError("Could not save workout. Please try again.");
      setSaving(false);
    }
  };

  const startTime = new Date(startedAt.current).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full">
      {/* ── Sticky header — full width ── */}
      <div
        className="sticky top-0 z-20 -mx-4 md:-mx-10 px-4 md:px-10 py-3 mb-6 flex items-center justify-between"
        style={{
          backgroundColor: "rgba(9,9,14,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium transition-all duration-300 ease-out active:scale-[0.96]"
          style={{ color: "rgba(255,255,255,0.40)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.80)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.40)")
          }
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={exercises.length === 0 || saving || templateLoading}
          className="flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-full disabled:opacity-30 active:scale-[0.96] transition-all duration-300 ease-out"
          style={{
            backgroundColor: "rgb(16,185,129)",
            color: "rgb(0,0,0)",
            boxShadow: "0 8px 24px -4px rgba(16,185,129,0.40)",
          }}
        >
          <CheckCircle size={14} strokeWidth={2.5} />
          {saving ? "Saving…" : "Finish workout"}
        </button>
      </div>

      {/* ── 2-column body ── */}
      <div className="flex flex-col md:grid md:grid-cols-[340px_1fr] gap-6 items-start">
        {/* ─ LEFT: sticky workout overview ─ */}
        <div className="md:sticky md:top-20 flex flex-col gap-4">
          {/* Workout info */}
          <GlassPanel glow className="p-5 flex flex-col gap-2">
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="Workout name"
              className="w-full bg-transparent text-xl font-bold tracking-tight placeholder:text-white/15 focus:outline-none"
              style={{ color: "rgba(255,255,255,0.90)" }}
            />
            <p
              className="text-xs font-medium tabular-nums"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Started at {startTime}
            </p>
          </GlassPanel>

          {/* Exercise overview — live summary */}
          {!templateLoading && exercises.length > 0 && (
            <GlassPanel className="p-4 flex flex-col gap-2">
              <h3
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: "rgba(255,255,255,0.50)" }}
              >
                Exercises · {exercises.length}
              </h3>
              {exercises.map((ex, i) => (
                <div
                  key={ex.localId}
                  className="flex items-center gap-3 px-2.5 py-2 rounded-xl"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    className="text-[10px] font-bold tabular-nums shrink-0"
                    style={{ color: "rgba(255,255,255,0.20)" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="flex-1 text-sm font-medium truncate"
                    style={{
                      color: ex.name
                        ? "rgba(255,255,255,0.70)"
                        : "rgba(255,255,255,0.20)",
                    }}
                  >
                    {ex.name || "—"}
                  </span>
                  <span
                    className="text-[11px] font-semibold tabular-nums shrink-0"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                  >
                    {ex.sets.length} sets
                  </span>
                </div>
              ))}
            </GlassPanel>
          )}
        </div>

        {/* ─ RIGHT: exercise cards ─ */}
        <div className="w-full">
          {templateLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <GlassPanel key={i} className="h-[140px] animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <ExerciseList exercises={exercises} actions={actions} />
              {error && (
                <p
                  className="mt-4 text-sm text-center font-medium"
                  style={{ color: "rgba(248,113,113,0.90)" }}
                >
                  {error}
                </p>
              )}
            </>
          )}
          <div className="h-10" />
        </div>
      </div>
    </div>
  );
}

// ─── Suspense wrapper ─────────────────────────────────────────────────────────

export default function NewWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full space-y-3 pt-16">
          {[1, 2, 3].map((i) => (
            <GlassPanel key={i} className="h-[140px] animate-pulse" />
          ))}
        </div>
      }
    >
      <NewWorkoutInner />
    </Suspense>
  );
}
