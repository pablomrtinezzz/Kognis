"use client";

import { Flame, WifiOff } from "lucide-react";
import { useDashboardData, type Goal } from "@/hooks/useDashboardData";

// ─── Sub-components ──────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  return (
    <div
      className={`flex items-center gap-1 ${
        streak > 0 ? "text-accent" : "text-foreground/30"
      }`}
    >
      <Flame size={16} strokeWidth={2.5} />
      <span className="text-sm font-bold">{streak}</span>
    </div>
  );
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const done = pct >= 100;

  return (
    <div>
      <div className="flex justify-between text-xs text-foreground/50 mb-1.5">
        <span>
          {current} / {target}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            done ? "bg-accent" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  return (
    <div className="p-5 rounded-2xl bg-[#1C2331] border border-gray-800 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold capitalize tracking-wide">
          {goal.category}
        </span>
        <StreakBadge streak={goal.streak} />
      </div>

      <ProgressBar current={goal.current_value} target={goal.target_value} />

      {goal.deadline && (
        <p className="text-xs text-foreground/40">
          Fecha límite:{" "}
          {new Date(goal.deadline + "T00:00:00").toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

function GoalCardSkeleton() {
  return (
    <div className="h-32 rounded-2xl bg-[#1C2331] border border-gray-800 animate-pulse" />
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { goals, loading, isOffline } = useDashboardData();

  const totalStreak = goals.reduce((sum, g) => sum + g.streak, 0);
  const goalsOnTrack = goals.filter(
    (g) => g.target_value > 0 && g.current_value / g.target_value >= 1,
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {isOffline && (
          <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full border border-yellow-400/20">
            <WifiOff size={12} />
            <span>Offline</span>
          </div>
        )}
      </div>

      {/* ── Summary strip ── */}
      {!loading && goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#1C2331] border border-gray-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-accent mb-1">
              <Flame size={18} />
              <span className="text-2xl font-bold">{totalStreak}</span>
            </div>
            <p className="text-xs text-foreground/50">Racha total</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#1C2331] border border-gray-800 text-center">
            <p className="text-2xl font-bold text-primary mb-1">
              {goalsOnTrack}/{goals.length}
            </p>
            <p className="text-xs text-foreground/50">
              Objetivos cumplidos hoy
            </p>
          </div>
        </div>
      )}

      {/* ── Goals section ── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-widest mb-3">
          Objetivos activos
        </h2>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <GoalCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && goals.length === 0 && (
          <div className="p-6 rounded-2xl bg-[#1C2331] border border-gray-800 text-center">
            <p className="text-foreground/60 text-sm">
              No tienes objetivos activos. ¡Crea uno para empezar!
            </p>
          </div>
        )}

        {/* Goal cards */}
        {!loading && goals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
