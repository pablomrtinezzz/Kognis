"use client";

import { useState } from "react";
import {
  TrendingUp,
  ChevronDown,
  Dumbbell,
  Zap,
  ListOrdered,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useProgressData } from "@/hooks/useProgressData";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { GlassPanel } from "@/components/ui/GlassPanel";

// ─── Generic dropdown ─────────────────────────────────────────────────────────

function Dropdown<T extends string>({
  value,
  placeholder,
  options,
  icon: Icon,
  onSelect,
}: {
  value: T | null;
  placeholder: string;
  options: { value: T; label: string }[];
  icon: React.ElementType;
  onSelect: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  if (options.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-white/60 hover:text-white/90 transition-all duration-300 ease-out w-full active:scale-[0.99]"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Icon size={14} className="text-primary/60 shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left truncate">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={13}
          className={`text-white/25 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl max-h-64 overflow-y-auto"
          style={{
            backgroundColor: "rgba(11,11,20,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.04) inset",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-all duration-200
                ${
                  opt.value === value
                    ? "text-primary font-bold bg-primary/[0.07]"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white/90"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-2xl px-3.5 py-3 text-xs"
      style={{
        backgroundColor: "rgba(11,11,20,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
      }}
    >
      <p className="text-white/35 mb-2 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name === "ewma" ? "Tendencia" : "1RM estimado"}: {p.value} kg
        </p>
      ))}
    </div>
  );
}

// ─── Suggestion card ──────────────────────────────────────────────────────────

function SuggestionCard({
  predicted1rm,
  optionA,
  optionB,
}: {
  predicted1rm: number;
  optionA: { reps: number; weightKg: number };
  optionB: { reps: number; weightKg: number };
}) {
  return (
    <GlassPanel glow className="overflow-hidden">
      <div className="px-5 pt-4 pb-3.5 border-b border-white/[0.05] flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-accent/[0.10] flex items-center justify-center">
          <Zap size={15} className="text-accent" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">Sugerencia para hoy</p>
          <p className="text-xs text-white/30">
            1RM predicho: {predicted1rm} kg
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
        <div className="px-5 py-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
            Más peso
          </p>
          <p className="text-2xl font-bold text-white/90 tracking-tight">
            {optionA.weightKg}
            <span className="text-sm text-white/35 font-semibold ml-1">kg</span>
          </p>
          <p className="text-xs text-white/30 mt-1">× {optionA.reps} reps</p>
        </div>
        <div className="px-5 py-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
            Más reps
          </p>
          <p className="text-2xl font-bold text-white/90 tracking-tight">
            {optionB.weightKg}
            <span className="text-sm text-white/35 font-semibold ml-1">kg</span>
          </p>
          <p className="text-xs text-white/30 mt-1">× {optionB.reps} reps</p>
        </div>
      </div>
    </GlassPanel>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <GlassPanel className="py-14 flex flex-col items-center text-center px-6 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/[0.07] flex items-center justify-center">
        <TrendingUp size={22} className="text-primary/40" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-white/40 text-sm">{message}</p>
        <p className="text-white/20 text-xs max-w-[220px]">
          Registra sesiones para empezar a ver tu progreso.
        </p>
      </div>
    </GlassPanel>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { templates, loading: templatesLoading } = useWorkoutTemplates();
  const {
    points,
    suggestion,
    loading: dataLoading,
  } = useProgressData(selectedExercise);

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) ?? null;

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.name,
  }));
  const exerciseOptions = (selectedTemplate?.exercises ?? []).map((e) => ({
    value: e.name,
    label: e.name,
  }));

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    setSelectedExercise(null);
  };

  const hasData = points.length >= 2;
  const loading = templatesLoading || dataLoading;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white/90">
          Progreso
        </h1>
        <p className="text-xs text-white/30 mt-0.5">
          Evolución de tus ejercicios
        </p>
      </div>

      {!templatesLoading && templates.length === 0 && (
        <GlassPanel className="py-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-white/40">
            Aún no tienes rutinas creadas.
          </p>
          <a
            href="/workouts/templates/new"
            className="text-xs font-bold text-primary/70 hover:text-primary transition-colors"
          >
            Crear primera rutina →
          </a>
        </GlassPanel>
      )}

      {!templatesLoading && templates.length > 0 && (
        <Dropdown
          value={selectedTemplateId}
          placeholder="Selecciona una rutina"
          options={templateOptions}
          icon={ListOrdered}
          onSelect={handleSelectTemplate}
        />
      )}

      {selectedTemplate && (
        <Dropdown
          value={selectedExercise}
          placeholder="Selecciona un ejercicio"
          options={exerciseOptions}
          icon={Dumbbell}
          onSelect={setSelectedExercise}
        />
      )}

      {loading && <GlassPanel className="h-52 animate-pulse" />}

      {!loading && !selectedTemplateId && (
        <EmptyState message="Elige una rutina para empezar" />
      )}

      {!loading && selectedTemplateId && !selectedExercise && (
        <GlassPanel className="py-10 text-center">
          <p className="text-sm text-white/35">
            Selecciona un ejercicio de{" "}
            <span className="text-white/60 font-semibold">
              {selectedTemplate?.name}
            </span>
          </p>
        </GlassPanel>
      )}

      {!loading && selectedExercise && !hasData && (
        <GlassPanel className="py-10 text-center space-y-1">
          <p className="text-sm text-white/40">
            Sin datos para{" "}
            <span className="text-white/65 font-semibold">
              {selectedExercise}
            </span>
            .
          </p>
          <p className="text-xs text-white/20">
            Necesitas al menos 2 sesiones registradas.
          </p>
        </GlassPanel>
      )}

      {!loading && hasData && (
        <>
          <GlassPanel glow className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-5">
              1RM estimado (Epley) · kg
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={points}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.03)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "rgba(242,244,248,0.25)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    });
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(242,244,248,0.25)" }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="oneRm"
                  name="oneRm"
                  stroke="rgba(37,119,255,0.45)"
                  strokeWidth={1.5}
                  dot={{ fill: "#2577FF", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#2577FF" }}
                />
                <Line
                  type="monotone"
                  dataKey="ewma"
                  name="ewma"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#10B981" }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-5 mt-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-px bg-primary/45 rounded-full inline-block" />
                <span className="text-[10px] text-white/25">1RM sesión</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-px bg-accent rounded-full inline-block" />
                <span className="text-[10px] text-white/25">
                  Tendencia (EWMA)
                </span>
              </div>
            </div>
          </GlassPanel>

          {suggestion && (
            <SuggestionCard
              predicted1rm={suggestion.predicted1rm}
              optionA={suggestion.optionA}
              optionB={suggestion.optionB}
            />
          )}
        </>
      )}
    </div>
  );
}
