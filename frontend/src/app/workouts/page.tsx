"use client";

import Link from "next/link";
import { Plus, CloudUpload, Loader, AlertCircle, WifiOff } from "lucide-react";
import { useWorkouts } from "@/hooks/useWorkouts";
import type { LocalWorkout, SyncStatus } from "@/lib/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(started: string, finished?: string): string {
  if (!finished) return "En curso";
  const mins = Math.round(
    (new Date(finished).getTime() - new Date(started).getTime()) / 60000,
  );
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SyncStatusIcon({ status }: { status: SyncStatus }) {
  if (status === "pending")
    return (
      <span title="Pendiente de sincronizar">
        <CloudUpload size={14} className="text-yellow-400" />
      </span>
    );
  if (status === "syncing")
    return (
      <span title="Sincronizando…">
        <Loader size={14} className="text-yellow-400 animate-spin" />
      </span>
    );
  if (status === "error")
    return (
      <span title="Error al sincronizar — se reintentará">
        <AlertCircle size={14} className="text-red-400" />
      </span>
    );
  return null; // synced — no indicator needed
}

function WorkoutCard({ workout }: { workout: LocalWorkout }) {
  const time = new Date(workout.started_at).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-5 rounded-2xl bg-[#1C2331] border border-gray-800 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-foreground leading-tight">
          {workout.name || "Entreno sin nombre"}
        </p>
        <SyncStatusIcon status={workout.sync_status} />
      </div>
      <p className="text-xs text-foreground/50">
        {formatDate(workout.started_at)}, {time} ·{" "}
        {formatDuration(workout.started_at, workout.finished_at)}
      </p>
    </div>
  );
}

function WorkoutCardSkeleton() {
  return (
    <div className="h-20 rounded-2xl bg-[#1C2331] border border-gray-800 animate-pulse" />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const { workouts, loading, isOffline } = useWorkouts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Entrenos</h1>
        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full border border-yellow-400/20">
              <WifiOff size={12} />
              <span>Offline</span>
            </div>
          )}
          <Link
            href="/workouts/new"
            className="flex items-center gap-1.5 bg-primary text-[#0B0F17] text-sm font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            <Plus size={16} />
            Nuevo
          </Link>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <WorkoutCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && workouts.length === 0 && (
        <div className="p-8 rounded-2xl bg-[#1C2331] border border-gray-800 text-center space-y-4">
          <p className="text-foreground/60 text-sm">
            Aún no has registrado ningún entreno.
          </p>
          <Link
            href="/workouts/new"
            className="inline-flex items-center gap-2 bg-primary text-[#0B0F17] font-bold px-6 py-3 rounded-xl"
          >
            <Plus size={16} />
            Registrar primer entreno
          </Link>
        </div>
      )}

      {/* Workout list */}
      {!loading && workouts.length > 0 && (
        <div className="space-y-3">
          {workouts.map((w) => (
            <WorkoutCard key={w.local_id} workout={w} />
          ))}
        </div>
      )}
    </div>
  );
}
