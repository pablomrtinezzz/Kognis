"use client";

import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useWeeklyMuscleVolume } from "@/hooks/useProgressData";
import { GlassPanel } from "@/components/ui/GlassPanel";

// ─── Radar Chart ──────────────────────────────────────────────────────────────

const RADAR_MUSCLES = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Core",
  "Pierna",
];

function MuscleRadar({ volume }: { volume: Record<string, number> }) {
  const max = Math.max(...Object.values(volume), 1);

  const data = RADAR_MUSCLES.map((muscle) => ({
    muscle,
    value: ((volume[muscle] ?? 0) / max) * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart
        data={data}
        margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
      >
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis
          dataKey="muscle"
          tick={{
            fill: "rgba(255,255,255,0.30)",
            fontSize: 9,
            fontWeight: 600,
          }}
        />
        <Radar
          dataKey="value"
          stroke="rgb(37,119,255)"
          strokeWidth={1.5}
          fill="rgb(37,119,255)"
          fillOpacity={0.15}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── SVG Body Heatmap ─────────────────────────────────────────────────────────

function muscleOpacity(v: number, max: number): number {
  if (max === 0) return 0.06;
  return 0.06 + (v / max) * 0.85;
}

function muscleGlow(v: number, max: number): string {
  if (max === 0) return "none";
  const intensity = (v / max) * 8;
  return `drop-shadow(0 0 ${intensity}px rgba(37,119,255,0.6))`;
}

function FrontBody({ volume }: { volume: Record<string, number> }) {
  const max = Math.max(...Object.values(volume), 1);
  const fill = (m: string) =>
    `rgba(37,119,255,${muscleOpacity(volume[m] ?? 0, max)})`;
  const filter = (m: string) => muscleGlow(volume[m] ?? 0, max);

  return (
    <svg
      viewBox="0 0 80 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path
        d="M40 4 C32 4 28 10 28 16 C28 22 32 26 40 26 C48 26 52 22 52 16 C52 10 48 4 40 4Z"
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.5"
      />
      <path
        d="M26 26 L20 50 L18 80 L22 110 L30 118 L50 118 L58 110 L62 80 L60 50 L54 26Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <path
        d="M20 28 L12 30 L8 60 L10 75 L14 78 L18 72 L20 52Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <path
        d="M60 28 L68 30 L72 60 L70 75 L66 78 L62 72 L60 52Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <path
        d="M22 118 L18 170 L20 195 L32 196 L34 170 L36 118Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <path
        d="M58 118 L62 170 L60 195 L48 196 L46 170 L44 118Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <ellipse
        cx="22"
        cy="34"
        rx="7"
        ry="5"
        transform="rotate(-15 22 34)"
        fill={fill("Hombros")}
        style={{ filter: filter("Hombros") }}
      />
      <ellipse
        cx="58"
        cy="34"
        rx="7"
        ry="5"
        transform="rotate(15 58 34)"
        fill={fill("Hombros")}
        style={{ filter: filter("Hombros") }}
      />
      <path
        d="M27 28 L27 50 L40 54 L53 50 L53 28Z"
        fill={fill("Pecho")}
        style={{ filter: filter("Pecho") }}
      />
      <rect
        x="13"
        y="40"
        width="6"
        height="22"
        rx="3"
        fill={fill("Bíceps")}
        style={{ filter: filter("Bíceps") }}
      />
      <rect
        x="61"
        y="40"
        width="6"
        height="22"
        rx="3"
        fill={fill("Bíceps")}
        style={{ filter: filter("Bíceps") }}
      />
      <path
        d="M29 54 L29 110 L40 114 L51 110 L51 54 L40 58Z"
        fill={fill("Core")}
        style={{ filter: filter("Core") }}
      />
      <rect
        x="23"
        y="120"
        width="12"
        height="44"
        rx="4"
        fill={fill("Pierna")}
        style={{ filter: filter("Pierna") }}
      />
      <rect
        x="45"
        y="120"
        width="12"
        height="44"
        rx="4"
        fill={fill("Pierna")}
        style={{ filter: filter("Pierna") }}
      />
      <rect
        x="24"
        y="168"
        width="9"
        height="24"
        rx="3"
        fill={fill("Pierna")}
        style={{ filter: filter("Pierna") }}
        opacity="0.7"
      />
      <rect
        x="47"
        y="168"
        width="9"
        height="24"
        rx="3"
        fill={fill("Pierna")}
        style={{ filter: filter("Pierna") }}
        opacity="0.7"
      />
    </svg>
  );
}

function BackBody({ volume }: { volume: Record<string, number> }) {
  const max = Math.max(...Object.values(volume), 1);
  const fill = (m: string) =>
    `rgba(37,119,255,${muscleOpacity(volume[m] ?? 0, max)})`;
  const filter = (m: string) => muscleGlow(volume[m] ?? 0, max);

  return (
    <svg
      viewBox="0 0 80 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path
        d="M40 4 C32 4 28 10 28 16 C28 22 32 26 40 26 C48 26 52 22 52 16 C52 10 48 4 40 4Z"
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.5"
      />
      <path
        d="M26 26 L20 50 L18 80 L22 110 L30 118 L50 118 L58 110 L62 80 L60 50 L54 26Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <path
        d="M20 28 L12 30 L8 60 L10 75 L14 78 L18 72 L20 52Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <path
        d="M60 28 L68 30 L72 60 L70 75 L66 78 L62 72 L60 52Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <path
        d="M22 118 L18 170 L20 195 L32 196 L34 170 L36 118Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <path
        d="M58 118 L62 170 L60 195 L48 196 L46 170 L44 118Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      <ellipse
        cx="22"
        cy="34"
        rx="7"
        ry="5"
        transform="rotate(-15 22 34)"
        fill={fill("Hombros")}
        style={{ filter: filter("Hombros") }}
      />
      <ellipse
        cx="58"
        cy="34"
        rx="7"
        ry="5"
        transform="rotate(15 58 34)"
        fill={fill("Hombros")}
        style={{ filter: filter("Hombros") }}
      />
      <path
        d="M27 28 L21 52 L26 82 L40 86 L54 82 L59 52 L53 28Z"
        fill={fill("Espalda")}
        style={{ filter: filter("Espalda") }}
      />
      <rect
        x="13"
        y="40"
        width="6"
        height="22"
        rx="3"
        fill={fill("Tríceps")}
        style={{ filter: filter("Tríceps") }}
      />
      <rect
        x="61"
        y="40"
        width="6"
        height="22"
        rx="3"
        fill={fill("Tríceps")}
        style={{ filter: filter("Tríceps") }}
      />
      <path
        d="M28 86 L28 118 L40 122 L52 118 L52 86 L40 90Z"
        fill={fill("Core")}
        style={{ filter: filter("Core") }}
        opacity="0.7"
      />
      <rect
        x="23"
        y="120"
        width="12"
        height="44"
        rx="4"
        fill={fill("Pierna")}
        style={{ filter: filter("Pierna") }}
      />
      <rect
        x="45"
        y="120"
        width="12"
        height="44"
        rx="4"
        fill={fill("Pierna")}
        style={{ filter: filter("Pierna") }}
      />
      <rect
        x="24"
        y="168"
        width="9"
        height="24"
        rx="3"
        fill={fill("Pierna")}
        style={{ filter: filter("Pierna") }}
        opacity="0.7"
      />
      <rect
        x="47"
        y="168"
        width="9"
        height="24"
        rx="3"
        fill={fill("Pierna")}
        style={{ filter: filter("Pierna") }}
        opacity="0.7"
      />
    </svg>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function MuscularBalanceCard() {
  const { volume, loading } = useWeeklyMuscleVolume();
  const [side, setSide] = useState<"front" | "back">("front");

  if (loading) {
    return <GlassPanel className="h-full min-h-[280px] animate-pulse" />;
  }

  const hasData = Object.values(volume).some((v) => v > 0);

  return (
    <GlassPanel glow className="h-full w-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.50)" }}
        >
          Muscle Balance
        </h3>
        <div
          className="flex gap-1 p-0.5 rounded-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {(["front", "back"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 ease-out"
              style={
                side === s
                  ? {
                      backgroundColor: "rgb(37,119,255)",
                      color: "rgb(255,255,255)",
                      boxShadow: "0 0 12px rgba(37,119,255,0.45)",
                    }
                  : { color: "rgba(255,255,255,0.30)" }
              }
            >
              {s === "front" ? "Front" : "Back"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {!hasData ? (
        <div
          className="flex-1 flex items-center justify-center text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.20)" }}
        >
          Log workouts to see balance
        </div>
      ) : (
        <div className="flex gap-3 items-center flex-1 min-h-0">
          {/* SVG body — fixed narrow column */}
          <div className="w-[56px] shrink-0 self-stretch">
            {side === "front" ? (
              <FrontBody volume={volume} />
            ) : (
              <BackBody volume={volume} />
            )}
          </div>
          {/* Radar — fills remaining space */}
          <div className="flex-1 min-w-0">
            <MuscleRadar volume={volume} />
          </div>
        </div>
      )}

      {/* Volume badges */}
      {hasData && (
        <div className="mt-3 flex flex-wrap gap-1 shrink-0">
          {RADAR_MUSCLES.filter((m) => (volume[m] ?? 0) > 0).map((muscle) => (
            <span
              key={muscle}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(37,119,255,0.10)",
                color: "rgba(37,119,255,0.80)",
                border: "1px solid rgba(37,119,255,0.15)",
              }}
            >
              {muscle} · {volume[muscle]}
            </span>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
