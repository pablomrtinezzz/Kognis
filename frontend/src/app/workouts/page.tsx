"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Play, Plus, Trash2 } from "lucide-react";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import type { LocalWorkoutTemplate } from "@/lib/db";
import { GlassPanel } from "@/components/ui/GlassPanel";

// ─── Day chips ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function DayChips({
  templateId,
  weekdays,
  allTemplates,
  onToggle,
}: {
  templateId: string;
  weekdays: number[];
  allTemplates: LocalWorkoutTemplate[];
  onToggle: (day: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {DAY_LABELS.map((label, day) => {
        const active = weekdays.includes(day);
        const takenBy = allTemplates.find(
          (t) => t.id !== templateId && t.weekdays?.includes(day),
        );
        return (
          <button
            key={day}
            type="button"
            title={takenBy ? `Asignado a "${takenBy.name}"` : undefined}
            onClick={() => onToggle(day)}
            className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300 ease-out active:scale-90
              ${
                active
                  ? "bg-primary text-white"
                  : takenBy
                    ? "bg-white/[0.03] text-white/15 cursor-default"
                    : "bg-white/[0.05] text-white/30 hover:bg-white/[0.10] hover:text-white/60"
              }`}
            style={active ? { boxShadow: "0 0 12px rgba(37,119,255,0.5)" } : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  allTemplates,
  onDelete,
  onToggleDay,
}: {
  template: LocalWorkoutTemplate;
  allTemplates: LocalWorkoutTemplate[];
  onDelete: (id: string) => void;
  onToggleDay: (templateId: string, day: number) => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const weekdays = template.weekdays ?? [];
  const preview = template.exercises
    .slice(0, 2)
    .map((e) => e.name)
    .join(" · ");
  const remaining = template.exercises.length - 2;

  return (
    <GlassPanel hover glow className="group flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Dumbbell size={15} className="text-primary/80" strokeWidth={2} />
        </div>

        {confirming ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              onClick={() => onDelete(template.id)}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 px-2.5 py-1 rounded-full hover:bg-red-400/[0.08] transition-all duration-300"
            >
              Eliminar
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-[11px] text-white/30 hover:text-white/60 px-2.5 py-1 rounded-full hover:bg-white/[0.05] transition-all duration-300"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all duration-300 p-1.5 rounded-xl hover:bg-red-400/[0.07] active:scale-90"
            aria-label="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Name + preview */}
      <div className="min-w-0 -mt-1">
        <p className="font-bold text-sm text-white/90 leading-snug truncate">
          {template.name}
        </p>
        <p className="text-[11px] text-white/30 mt-0.5 truncate leading-relaxed">
          {preview}
          {remaining > 0 && (
            <span className="text-white/15"> +{remaining}</span>
          )}
        </p>
        <p className="text-[10px] text-white/20 mt-1 font-medium">
          {template.exercises.length} ejercicio
          {template.exercises.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Day chips */}
      <DayChips
        templateId={template.id}
        weekdays={weekdays}
        allTemplates={allTemplates}
        onToggle={(day) => onToggleDay(template.id, day)}
      />

      {/* CTA */}
      <button
        onClick={() => router.push(`/workouts/new?from=${template.id}`)}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold uppercase tracking-wide transition-all duration-300 ease-out active:scale-[0.97]"
      >
        <Play size={11} strokeWidth={0} fill="currentColor" />
        Iniciar
      </button>
    </GlassPanel>
  );
}

function TemplateCardSkeleton() {
  return (
    <GlassPanel className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-2xl bg-white/[0.04]" />
      <div className="space-y-2">
        <div className="h-3 bg-white/[0.04] rounded-full w-3/4" />
        <div className="h-2 bg-white/[0.03] rounded-full w-full" />
      </div>
      <div className="flex gap-1">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-white/[0.03]" />
        ))}
      </div>
      <div className="h-9 bg-white/[0.03] rounded-full" />
    </GlassPanel>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const { templates, loading, deleteTemplate, patchTemplate } =
    useWorkoutTemplates();

  const handleToggleDay = async (templateId: string, day: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const current = template.weekdays ?? [];

    if (current.includes(day)) {
      await patchTemplate(templateId, {
        weekdays: current.filter((d) => d !== day),
      });
    } else {
      const owner = templates.find(
        (t) => t.id !== templateId && t.weekdays?.includes(day),
      );
      if (owner) {
        await patchTemplate(owner.id, {
          weekdays: (owner.weekdays ?? []).filter((d) => d !== day),
        });
      }
      await patchTemplate(templateId, { weekdays: [...current, day] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">
            Rutinas
          </h1>
          <p className="text-xs text-white/30 mt-0.5">
            {!loading && templates.length > 0
              ? `${templates.length} plantilla${templates.length !== 1 ? "s" : ""}`
              : "Elige o crea una rutina"}
          </p>
        </div>

        <Link
          href="/workouts/templates/new"
          className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-300 ease-out"
          style={{ boxShadow: "0 8px 32px -4px rgba(37,119,255,0.45)" }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Nueva
        </Link>
      </div>

      {!loading && templates.length > 0 && (
        <p className="text-[11px] text-white/20">
          Toca los días para planificar tu semana.
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && templates.length === 0 && (
        <GlassPanel glow className="py-16 flex flex-col items-center text-center px-6 gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/[0.08] flex items-center justify-center">
            <Dumbbell size={24} className="text-primary/50" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white/50 text-sm">Sin rutinas todavía</p>
            <p className="text-white/20 text-xs max-w-[200px]">
              Crea tu primera rutina para empezar a entrenar.
            </p>
          </div>
          <Link
            href="/workouts/templates/new"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-300 text-sm"
            style={{ boxShadow: "0 8px 32px -4px rgba(37,119,255,0.45)" }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Crear rutina
          </Link>
        </GlassPanel>
      )}

      {!loading && templates.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              allTemplates={templates}
              onDelete={deleteTemplate}
              onToggleDay={handleToggleDay}
            />
          ))}
        </div>
      )}
    </div>
  );
}
