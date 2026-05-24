"use client";

import { useRouter } from "next/navigation";
import {
  Flame,
  WifiOff,
  CheckCircle2,
  Dumbbell,
  Play,
  ChevronRight,
} from "lucide-react";
import { useDashboardData, type Goal } from "@/hooks/useDashboardData";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { useAuth } from "@/store/AuthContext";
import { MuscularBalanceCard } from "@/components/MuscularBalance";
import { GlassPanel } from "@/components/ui/GlassPanel";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getFirstName(fullName?: string) {
  if (!fullName) return null;
  return fullName.split(" ")[0];
}

function isoDay(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function startOfWeek(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - isoDay(d));
  return d;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: "primary" | "accent";
}) {
  const isPrimary = accent === "primary";
  const colorRgb = isPrimary ? "37,119,255" : "16,185,129";

  return (
    <GlassPanel glow className="p-5 flex flex-col gap-4">
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center"
        style={{
          backgroundColor: `rgba(${colorRgb},0.08)`,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Icon size={16} style={{ color: `rgb(${colorRgb})` }} strokeWidth={2} />
      </div>
      <div>
        <p
          className="text-3xl font-bold tracking-tight"
          style={{ color: `rgb(${colorRgb})` }}
        >
          {value}
        </p>
        <p className="text-xs text-white/35 mt-0.5 font-medium">{label}</p>
      </div>
    </GlassPanel>
  );
}

// ─── Goal card ────────────────────────────────────────────────────────────────

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const done = pct >= 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-white/35 tabular-nums">
          {current} / {target}
        </span>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: done ? "rgb(16,185,129)" : "rgba(255,255,255,0.40)" }}
        >
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: done ? "rgb(16,185,129)" : "rgb(37,119,255)",
            ...(done ? { boxShadow: "0 0 12px rgba(16,185,129,0.45)" } : {}),
          }}
        />
      </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const pct =
    goal.target_value > 0
      ? Math.min((goal.current_value / goal.target_value) * 100, 100)
      : 0;
  const done = pct >= 100;

  return (
    <GlassPanel hover glow className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white/90 capitalize text-sm">
            {goal.category}
          </p>
          {goal.deadline && (
            <p className="text-[11px] text-white/25 mt-0.5">
              Límite:{" "}
              {new Date(goal.deadline + "T00:00:00").toLocaleDateString(
                "es-ES",
                { day: "numeric", month: "short" },
              )}
            </p>
          )}
        </div>
        <div
          className="flex items-center gap-1 shrink-0"
          style={{
            color:
              goal.streak > 0 ? "rgb(16,185,129)" : "rgba(255,255,255,0.15)",
          }}
        >
          <Flame size={13} strokeWidth={2.5} />
          <span className="text-xs font-bold tabular-nums">{goal.streak}</span>
        </div>
      </div>

      <ProgressBar current={goal.current_value} target={goal.target_value} />

      {done && (
        <div
          className="flex items-center gap-1.5 text-xs font-bold"
          style={{ color: "rgb(16,185,129)" }}
        >
          <CheckCircle2 size={13} strokeWidth={2.5} />
          Completado hoy
        </div>
      )}
    </GlassPanel>
  );
}

function GoalCardSkeleton() {
  return <GlassPanel className="h-[120px] animate-pulse" />;
}

// ─── Weekly grid ──────────────────────────────────────────────────────────────

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function WeeklyGrid() {
  const router = useRouter();
  const { templates, loading } = useWorkoutTemplates();

  const today = new Date();
  const todayIso = isoDay(today);
  const monday = startOfWeek(today);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const template = templates.find((t) => t.weekdays?.includes(i));
    return { index: i, date, template };
  });

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1.5">
        {[...Array(7)].map((_, i) => (
          <GlassPanel key={i} className="h-[72px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map(({ index, date, template }) => {
        const isToday = index === todayIso;
        const isPast = index < todayIso;

        // Compute inline styles per cell state to avoid any bg-card dependency
        let cellStyle: React.CSSProperties = {};
        let borderStyle: React.CSSProperties = {};
        if (isToday && template) {
          cellStyle = { backgroundColor: "rgba(37,119,255,0.10)" };
          borderStyle = { borderColor: "rgba(37,119,255,0.25)" };
        } else if (isToday) {
          cellStyle = { backgroundColor: "rgba(255,255,255,0.04)" };
          borderStyle = { borderColor: "rgba(255,255,255,0.10)" };
        } else if (template) {
          cellStyle = { backgroundColor: "rgba(17,17,24,0.6)" };
          borderStyle = { borderColor: "rgba(255,255,255,0.07)" };
        } else {
          cellStyle = { backgroundColor: "rgba(17,17,24,0.4)" };
          borderStyle = { borderColor: "rgba(255,255,255,0.04)" };
        }

        return (
          <button
            key={index}
            type="button"
            disabled={!template}
            onClick={() =>
              template && router.push(`/workouts/new?from=${template.id}`)
            }
            className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl border transition-all duration-300 ease-out"
            style={{ ...cellStyle, ...borderStyle }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{
                color: isToday ? "rgb(37,119,255)" : "rgba(255,255,255,0.25)",
              }}
            >
              {DAY_LABELS[index]}
            </span>
            <span
              className="text-sm font-bold tabular-nums leading-none"
              style={{
                color: isToday
                  ? "rgb(37,119,255)"
                  : isPast
                    ? "rgba(255,255,255,0.20)"
                    : "rgba(255,255,255,0.55)",
              }}
            >
              {date.getDate()}
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: template
                  ? isToday
                    ? "rgb(37,119,255)"
                    : "rgba(16,185,129,0.50)"
                  : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function TodayWorkout() {
  const router = useRouter();
  const { templates, loading } = useWorkoutTemplates();

  if (loading) return null;

  const todayTemplate = templates.find((t) =>
    t.weekdays?.includes(isoDay(new Date())),
  );
  if (!todayTemplate) return null;

  return (
    <button
      onClick={() => router.push(`/workouts/new?from=${todayTemplate.id}`)}
      className="w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 ease-out group active:scale-[0.99]"
      style={{
        backgroundColor: "rgba(16,185,129,0.07)",
        border: "1px solid rgba(16,185,129,0.15)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          "rgba(16,185,129,0.11)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(16,185,129,0.30)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          "rgba(16,185,129,0.07)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(16,185,129,0.15)";
      }}
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
        style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
      >
        <Play
          size={15}
          style={{ color: "rgb(16,185,129)", marginLeft: 2 }}
          strokeWidth={0}
          fill="currentColor"
        />
      </div>
      <div className="flex-1 text-left">
        <p className="font-bold text-sm text-white/90">{todayTemplate.name}</p>
        <p className="text-xs text-white/35 mt-0.5">
          Entreno de hoy · {todayTemplate.exercises.length} ejercicios
        </p>
      </div>
      <ChevronRight
        size={15}
        className="text-white/15 group-hover:text-white/35 transition-all duration-300 shrink-0"
      />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { goals, loading, isOffline } = useDashboardData();
  const { user } = useAuth();
  const router = useRouter();

  const firstName = getFirstName(user?.user_metadata?.full_name);
  const totalStreak = goals.reduce((sum, g) => sum + g.streak, 0);
  const goalsOnTrack = goals.filter(
    (g) => g.target_value > 0 && g.current_value >= g.target_value,
  ).length;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/35 font-medium mb-0.5">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">
            Dashboard
          </h1>
        </div>
        {isOffline && (
          <div
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold mt-1"
            style={{
              color: "rgb(251,191,36)",
              backgroundColor: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.15)",
            }}
          >
            <WifiOff size={10} />
            Offline
          </div>
        )}
      </div>

      {/* ── Weekly plan ── */}
      <GlassPanel glow className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-3">
          Plan semanal
        </p>
        <WeeklyGrid />
      </GlassPanel>

      {/* ── Today's workout ── */}
      <TodayWorkout />

      {/* ── Muscular balance ── */}
      <MuscularBalanceCard />

      {/* ── Stats ── */}
      {!loading && goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Racha total"
            value={totalStreak}
            icon={Flame}
            accent="accent"
          />
          <StatCard
            label="Objetivos hoy"
            value={`${goalsOnTrack}/${goals.length}`}
            icon={CheckCircle2}
            accent="primary"
          />
        </div>
      )}

      {/* ── Goals ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-4">
          Objetivos activos
        </p>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <GoalCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && goals.length === 0 && (
          <GlassPanel glow className="p-8 text-center space-y-1.5">
            <p className="text-white/35 text-sm font-medium">
              No hay objetivos activos.
            </p>
            <p className="text-white/20 text-xs">
              Crea uno para empezar a hacer seguimiento.
            </p>
          </GlassPanel>
        )}

        {!loading && goals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick action ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-4">
          Acceso rápido
        </p>
        <Link
          href="/workouts"
          className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ease-out group active:scale-[0.99]"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 40px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{ backgroundColor: "rgba(37,119,255,0.10)" }}
          >
            <Dumbbell
              size={16}
              style={{ color: "rgb(37,119,255)" }}
              strokeWidth={2}
            />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-white/90">Registrar entreno</p>
            <p className="text-xs text-white/30 mt-0.5">
              Elige una rutina e inicia la sesión
            </p>
          </div>
          <ChevronRight
            size={15}
            className="text-white/15 group-hover:text-white/35 transition-all duration-300 shrink-0"
          />
        </Link>
      </div>
    </div>
  );
}
