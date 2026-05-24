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
  if (h < 6) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 19) return "Good afternoon";
  return "Good evening";
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
  const colorRgb = accent === "primary" ? "37,119,255" : "16,185,129";

  return (
    <GlassPanel glow className="h-full w-full flex flex-col p-5 gap-4">
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
        <p
          className="text-xs mt-0.5 font-medium"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {label}
        </p>
      </div>
    </GlassPanel>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const done = pct >= 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span
          className="text-[11px] tabular-nums"
          style={{ color: "rgba(255,255,255,0.30)" }}
        >
          {current} / {target}
        </span>
        <span
          className="text-[11px] font-bold tabular-nums"
          style={{ color: done ? "rgb(16,185,129)" : "rgba(255,255,255,0.35)" }}
        >
          {Math.round(pct)}%
        </span>
      </div>
      <div
        className="h-[3px] rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: done ? "rgb(16,185,129)" : "rgb(37,119,255)",
            ...(done ? { boxShadow: "0 0 8px rgba(16,185,129,0.5)" } : {}),
          }}
        />
      </div>
    </div>
  );
}

// ─── Goal row (compact list item) ─────────────────────────────────────────────

function GoalRow({ goal }: { goal: Goal }) {
  const done = goal.target_value > 0 && goal.current_value >= goal.target_value;

  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-xl"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-sm font-semibold capitalize truncate"
          style={{ color: "rgba(255,255,255,0.80)" }}
        >
          {goal.category}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {done && (
            <CheckCircle2 size={12} style={{ color: "rgb(16,185,129)" }} />
          )}
          <div
            className="flex items-center gap-1"
            style={{
              color:
                goal.streak > 0 ? "rgb(16,185,129)" : "rgba(255,255,255,0.15)",
            }}
          >
            <Flame size={11} strokeWidth={2.5} />
            <span className="text-xs font-bold tabular-nums">
              {goal.streak}
            </span>
          </div>
        </div>
      </div>
      <ProgressBar current={goal.current_value} target={goal.target_value} />
    </div>
  );
}

// ─── Weekly grid ──────────────────────────────────────────────────────────────

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

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
      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="h-[76px] rounded-2xl animate-pulse"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(({ index, date, template }) => {
        const isToday = index === todayIso;
        const isPast = index < todayIso;

        let cellBg: string;
        let cellBorder: string;
        if (isToday && template) {
          cellBg = "rgba(37,119,255,0.10)";
          cellBorder = "rgba(37,119,255,0.28)";
        } else if (isToday) {
          cellBg = "rgba(255,255,255,0.04)";
          cellBorder = "rgba(255,255,255,0.12)";
        } else if (template) {
          cellBg = "rgba(255,255,255,0.03)";
          cellBorder = "rgba(255,255,255,0.07)";
        } else {
          cellBg = "transparent";
          cellBorder = "rgba(255,255,255,0.04)";
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
            style={{ backgroundColor: cellBg, borderColor: cellBorder }}
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
                    ? "rgba(255,255,255,0.18)"
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
                    : "rgba(16,185,129,0.55)"
                  : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─── Today's workout bento card ───────────────────────────────────────────────

function TodayWorkoutCard() {
  const router = useRouter();
  const { templates, loading } = useWorkoutTemplates();

  if (loading) {
    return <GlassPanel className="h-full min-h-[140px] animate-pulse" />;
  }

  const todayTemplate = templates.find((t) =>
    t.weekdays?.includes(isoDay(new Date())),
  );

  if (!todayTemplate) {
    return (
      <GlassPanel className="h-full w-full flex flex-col p-5">
        <h3
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: "rgba(255,255,255,0.50)" }}
        >
          {"Today's Workout"}
        </h3>
        <div
          className="flex-1 flex items-center justify-center text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.20)" }}
        >
          Rest day — nothing scheduled
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      hover
      glow
      className="h-full w-full flex flex-col p-5 cursor-pointer"
      onClick={() => router.push(`/workouts/new?from=${todayTemplate.id}`)}
    >
      <h3
        className="text-xs font-bold uppercase tracking-widest mb-4"
        style={{ color: "rgba(255,255,255,0.50)" }}
      >
        {"Today's Workout"}
      </h3>
      <div className="flex-1 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
        >
          <Play
            size={16}
            style={{ color: "rgb(16,185,129)", marginLeft: 2 }}
            strokeWidth={0}
            fill="currentColor"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-base leading-tight"
            style={{ color: "rgba(255,255,255,0.90)" }}
          >
            {todayTemplate.name}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {todayTemplate.exercises.length} exercises
          </p>
        </div>
        <ChevronRight
          size={16}
          className="shrink-0"
          style={{ color: "rgba(255,255,255,0.20)" }}
        />
      </div>
    </GlassPanel>
  );
}

// ─── Goals bento card ─────────────────────────────────────────────────────────

function GoalsCard({
  goals,
  loading,
  goalsOnTrack,
}: {
  goals: Goal[];
  loading: boolean;
  goalsOnTrack: number;
}) {
  return (
    <GlassPanel glow className="h-full w-full flex flex-col p-5">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.50)" }}
        >
          Active Goals
        </h3>
        {!loading && goals.length > 0 && (
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: "rgb(16,185,129)" }}
          >
            {goalsOnTrack}/{goals.length} done
          </span>
        )}
      </div>

      {loading && (
        <div className="flex flex-col gap-2 flex-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[60px] rounded-xl animate-pulse"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      )}

      {!loading && goals.length === 0 && (
        <div
          className="flex-1 flex items-center justify-center text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.20)" }}
        >
          No active goals yet
        </div>
      )}

      {!loading && goals.length > 0 && (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {goals.map((goal) => (
            <GoalRow key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { goals, loading, isOffline } = useDashboardData();
  const { user } = useAuth();

  const firstName = getFirstName(user?.user_metadata?.full_name);
  const totalStreak = goals.reduce((sum, g) => sum + g.streak, 0);
  const goalsOnTrack = goals.filter(
    (g) => g.target_value > 0 && g.current_value >= g.target_value,
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-sm font-medium mb-0.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "rgba(255,255,255,0.90)" }}
          >
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

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* ─ Row 1: Weekly plan (8) + Muscular balance (4) ─ */}

        <div className="md:col-span-8 lg:col-span-8 flex flex-col">
          <GlassPanel glow className="h-full w-full flex flex-col p-5">
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-4 shrink-0"
              style={{ color: "rgba(255,255,255,0.50)" }}
            >
              Weekly Plan
            </h3>
            <WeeklyGrid />
          </GlassPanel>
        </div>

        <div className="md:col-span-4 lg:col-span-4 flex flex-col">
          <MuscularBalanceCard />
        </div>

        {/* ─ Row 2: Today's workout (6) + Goals (6) ─ */}

        <div className="md:col-span-6 lg:col-span-6 flex flex-col">
          <TodayWorkoutCard />
        </div>

        <div className="md:col-span-6 lg:col-span-6 flex flex-col">
          <GoalsCard
            goals={goals}
            loading={loading}
            goalsOnTrack={goalsOnTrack}
          />
        </div>

        {/* ─ Row 3: Stats (4 each) + Quick access (4) ─ */}

        <div className="md:col-span-4 flex flex-col">
          <StatCard
            label="Total streak"
            value={totalStreak}
            icon={Flame}
            accent="accent"
          />
        </div>

        <div className="md:col-span-4 flex flex-col">
          <StatCard
            label="Goals today"
            value={goals.length > 0 ? `${goalsOnTrack}/${goals.length}` : "—"}
            icon={CheckCircle2}
            accent="primary"
          />
        </div>

        <div className="md:col-span-4 flex flex-col">
          <Link href="/workouts" className="flex flex-col h-full">
            <GlassPanel
              hover
              glow
              className="h-full w-full flex flex-col p-5 gap-4"
            >
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(37,119,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Dumbbell
                  size={16}
                  style={{ color: "rgb(37,119,255)" }}
                  strokeWidth={2}
                />
              </div>
              <div>
                <p
                  className="text-lg font-bold tracking-tight"
                  style={{ color: "rgba(255,255,255,0.90)" }}
                >
                  Log workout
                </p>
                <p
                  className="text-xs mt-0.5 font-medium"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Pick a routine and start
                </p>
              </div>
              <ChevronRight
                size={14}
                className="mt-auto self-end"
                style={{ color: "rgba(255,255,255,0.20)" }}
              />
            </GlassPanel>
          </Link>
        </div>
      </div>
    </div>
  );
}
