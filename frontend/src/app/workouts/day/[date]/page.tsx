"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Dumbbell, Play } from "lucide-react";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { db, type LocalWorkout } from "@/lib/db";
import { GlassPanel } from "@/components/ui/GlassPanel";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7; // 0=Mon … 6=Sun
}

const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function formatDuration(startIso: string, endIso?: string) {
  if (!endIso) return null;
  const mins = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000,
  );
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DayPage() {
  const router = useRouter();
  // date param is YYYY-MM-DD
  const { date } = useParams<{ date: string }>();

  const { templates, loading: templatesLoading } = useWorkoutTemplates();

  const [workouts, setWorkouts] = useState<LocalWorkout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);

  // Parse date at noon to avoid timezone shifts
  const dateObj = new Date(`${date}T12:00:00`);
  const dayIndex = isoWeekday(dateObj);
  const dayName = DAY_NAMES[dayIndex];
  const dateStr = dateObj.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = date === todayStr;
  const isPast = date < todayStr;

  const template = templates.find((t) => t.weekdays?.includes(dayIndex));

  useEffect(() => {
    (async () => {
      try {
        const start = new Date(`${date}T00:00:00`).toISOString();
        const end = new Date(`${date}T23:59:59`).toISOString();
        const found = await db.workouts
          .filter((w) => w.started_at >= start && w.started_at <= end)
          .toArray();
        setWorkouts(
          found.sort((a, b) => b.started_at.localeCompare(a.started_at)),
        );
      } catch {
        setWorkouts([]);
      } finally {
        setWorkoutsLoading(false);
      }
    })();
  }, [date]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/35 hover:text-white/65 transition-colors text-xs font-medium mb-2"
        >
          <ArrowLeft size={13} />
          Dashboard
        </button>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.14em] mb-0.5"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          {isToday ? "Hoy" : isPast ? "Historial" : "Próximo"}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white/90 capitalize">
          {dayName}
        </h1>
        <p className="text-xs text-white/30 mt-0.5 capitalize">{dateStr}</p>
      </div>

      {/* ── Assigned template ── */}
      {!templatesLoading && (
        <div className="space-y-3">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Rutina planificada
          </p>

          {template ? (
            <GlassPanel glow className="p-5 space-y-4">
              {/* Template header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(37,119,255,0.10)",
                    border: "1px solid rgba(37,119,255,0.18)",
                  }}
                >
                  <Dumbbell
                    size={15}
                    style={{ color: "rgba(37,119,255,0.80)" }}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="font-bold text-white/85 text-sm">
                    {template.name}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {template.exercises.length} ejercicio
                    {template.exercises.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Exercise list */}
              <div
                className="space-y-0 rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {template.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom:
                        i < template.exercises.length - 1
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
                    }}
                  >
                    <span
                      className="text-[10px] tabular-nums w-4 text-center shrink-0"
                      style={{ color: "rgba(255,255,255,0.20)" }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-sm font-medium flex-1 truncate"
                      style={{ color: "rgba(255,255,255,0.70)" }}
                    >
                      {ex.name}
                    </span>
                    <span
                      className="text-[11px] shrink-0 tabular-nums"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>
                ))}
              </div>

              {/* Start button — only for today or future */}
              {!isPast && (
                <button
                  onClick={() =>
                    router.push(`/workouts/new?from=${template.id}`)
                  }
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98]"
                  style={{
                    backgroundColor: "rgba(37,119,255,0.12)",
                    border: "1px solid rgba(37,119,255,0.24)",
                    color: "rgb(37,119,255)",
                  }}
                >
                  <Play size={13} strokeWidth={0} fill="currentColor" />
                  Iniciar {template.name}
                </button>
              )}
            </GlassPanel>
          ) : (
            <GlassPanel className="py-10 flex flex-col items-center text-center gap-2">
              <p
                className="font-semibold text-sm"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Sin rutina asignada
              </p>
              <p
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.18)" }}
              >
                Este día no tiene ninguna rutina planificada.
              </p>
            </GlassPanel>
          )}
        </div>
      )}

      {/* ── Workouts logged this day ── */}
      {(isPast || isToday) && (
        <div className="space-y-3">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {isToday ? "Registrado hoy" : "Registrado este día"}
          </p>

          {workoutsLoading ? (
            <div
              className="h-14 rounded-xl animate-pulse"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />
          ) : workouts.length > 0 ? (
            <div className="space-y-2">
              {workouts.map((w) => (
                <GlassPanel
                  key={w.local_id}
                  className="p-4 flex items-center gap-3"
                >
                  <CheckCircle2
                    size={14}
                    style={{ color: "rgb(16,185,129)" }}
                    strokeWidth={2.5}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "rgba(255,255,255,0.75)" }}
                    >
                      {w.name || "Entreno sin nombre"}
                    </p>
                    {w.finished_at && (
                      <p
                        className="text-[11px] flex items-center gap-1 mt-0.5"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        <Clock size={9} />
                        {formatDuration(w.started_at, w.finished_at)}
                      </p>
                    )}
                  </div>
                </GlassPanel>
              ))}
            </div>
          ) : (
            <GlassPanel className="py-8 text-center">
              <p
                className="text-xs italic"
                style={{ color: "rgba(255,255,255,0.20)" }}
              >
                Sin sesiones registradas este día.
              </p>
            </GlassPanel>
          )}
        </div>
      )}
    </div>
  );
}
