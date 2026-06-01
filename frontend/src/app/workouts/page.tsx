"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Layers, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import type { LocalWorkoutTemplate } from "@/lib/db";
import { GlassPanel } from "@/components/ui/GlassPanel";

// ─── Predefined template catalog (never saved to Dexie) ──────────────────────

const TEMPLATE_CATALOG: {
  name: string;
  exercises: { name: string; sets: number; reps: number }[];
}[] = [
  {
    name: "Push — Empuje",
    exercises: [
      { name: "Press banca", sets: 4, reps: 8 },
      { name: "Press banca inclinado", sets: 3, reps: 10 },
      { name: "Press militar con mancuernas", sets: 3, reps: 12 },
      { name: "Elevaciones laterales", sets: 3, reps: 15 },
      { name: "Extensión en polea alta (cuerda)", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Pull — Tirón",
    exercises: [
      { name: "Dominadas (prono)", sets: 4, reps: 8 },
      { name: "Remo con barra", sets: 4, reps: 8 },
      { name: "Jalón al pecho", sets: 3, reps: 10 },
      { name: "Curl con barra EZ", sets: 3, reps: 12 },
      { name: "Curl martillo", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Legs — Pierna",
    exercises: [
      { name: "Sentadilla libre", sets: 4, reps: 8 },
      { name: "Prensa de piernas", sets: 3, reps: 10 },
      { name: "Peso muerto rumano", sets: 3, reps: 10 },
      { name: "Curl de femoral tumbado", sets: 3, reps: 12 },
      { name: "Pantorrillas de pie", sets: 4, reps: 15 },
    ],
  },
  {
    name: "Full Body",
    exercises: [
      { name: "Sentadilla libre", sets: 3, reps: 8 },
      { name: "Press banca", sets: 3, reps: 8 },
      { name: "Peso muerto convencional", sets: 3, reps: 6 },
      { name: "Press militar con barra", sets: 3, reps: 10 },
      { name: "Remo con barra", sets: 3, reps: 8 },
    ],
  },
  {
    name: "Arnold — Pecho & Espalda",
    exercises: [
      { name: "Press banca", sets: 4, reps: 8 },
      { name: "Aperturas con mancuernas", sets: 3, reps: 12 },
      { name: "Dominadas (prono)", sets: 4, reps: 8 },
      { name: "Remo con barra", sets: 4, reps: 8 },
      { name: "Jalón al pecho", sets: 3, reps: 10 },
    ],
  },
  {
    name: "Arnold — Hombros & Brazos",
    exercises: [
      { name: "Press Arnold", sets: 4, reps: 10 },
      { name: "Elevaciones laterales", sets: 3, reps: 15 },
      { name: "Face pull", sets: 3, reps: 15 },
      { name: "Curl con barra EZ", sets: 3, reps: 12 },
      { name: "Extensión en polea alta (cuerda)", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Arnold — Pierna",
    exercises: [
      { name: "Sentadilla libre", sets: 4, reps: 8 },
      { name: "Prensa de piernas", sets: 3, reps: 12 },
      { name: "Peso muerto rumano", sets: 3, reps: 10 },
      { name: "Curl de femoral tumbado", sets: 3, reps: 12 },
      { name: "Pantorrillas de pie", sets: 4, reps: 15 },
    ],
  },
];

// ─── Day chips ────────────────────────────────────────────────────────────────

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
            style={
              active
                ? { boxShadow: "0 0 12px rgba(37,119,255,0.5)" }
                : undefined
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

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
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={() =>
                router.push(`/workouts/templates/edit/${template.id}`)
              }
              className="p-1.5 rounded-xl text-white/20 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-300"
              aria-label="Editar rutina"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-xl text-white/15 hover:text-red-400 hover:bg-red-400/[0.07] active:scale-90 transition-all duration-300"
              aria-label="Eliminar"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

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

      <DayChips
        templateId={template.id}
        weekdays={weekdays}
        allTemplates={allTemplates}
        onToggle={(day) => onToggleDay(template.id, day)}
      />

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

// ─── Template picker row (shared by user templates + catalog) ─────────────────

function TemplatePickerRow({
  name,
  exerciseCount,
  accent,
  onClick,
}: {
  name: string;
  exerciseCount: number;
  accent: "primary" | "default";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 active:scale-[0.98]"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={
          accent === "primary"
            ? {
                backgroundColor: "rgba(37,119,255,0.10)",
                border: "1px solid rgba(37,119,255,0.18)",
              }
            : {
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }
        }
      >
        <Dumbbell
          size={13}
          strokeWidth={2}
          style={{
            color:
              accent === "primary"
                ? "rgba(37,119,255,0.70)"
                : "rgba(255,255,255,0.35)",
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-white/80 truncate">{name}</p>
        <p className="text-[11px] text-white/30">
          {exerciseCount} ejercicio{exerciseCount !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

// ─── New routine modal ────────────────────────────────────────────────────────

function NewRoutineModal({
  templates,
  onClose,
}: {
  templates: LocalWorkoutTemplate[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-6 space-y-4 pb-10"
        style={{
          background: "rgba(11,11,19,0.98)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-bold text-white/80 text-base">
            {showPicker ? "Elige una plantilla" : "Crear rutina"}
          </p>
          <button
            onClick={onClose}
            className="text-white/25 hover:text-white/60 transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        {!showPicker ? (
          <div className="space-y-3">
            {/* Desde cero */}
            <button
              onClick={() => {
                onClose();
                router.push("/workouts/templates/new");
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] group"
              style={{
                backgroundColor: "rgba(37,119,255,0.07)",
                border: "1px solid rgba(37,119,255,0.16)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(37,119,255,0.14)",
                  border: "1px solid rgba(37,119,255,0.20)",
                }}
              >
                <Plus
                  size={16}
                  style={{ color: "rgb(37,119,255)" }}
                  strokeWidth={2.5}
                />
              </div>
              <div>
                <p className="font-bold text-sm text-white/85">
                  Empezar desde cero
                </p>
                <p className="text-xs text-white/35 mt-0.5">
                  Crea una rutina completamente nueva
                </p>
              </div>
            </button>

            {/* En base a plantilla */}
            <button
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <Layers
                  size={15}
                  className="text-white/40"
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <p className="font-bold text-sm text-white/70">
                  En base a una plantilla
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  Elige una de tus rutinas o del catálogo
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[28rem] overflow-y-auto overscroll-contain">
            {/* User's own templates */}
            {templates.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
                  Tus rutinas
                </p>
                <div className="space-y-1.5">
                  {templates.map((t) => (
                    <TemplatePickerRow
                      key={t.id}
                      name={t.name}
                      exerciseCount={t.exercises.length}
                      accent="primary"
                      onClick={() => {
                        onClose();
                        router.push(`/workouts/templates/new?clone=${t.id}`);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Predefined catalog */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
                Catálogo
              </p>
              <div className="space-y-1.5">
                {TEMPLATE_CATALOG.map((t) => (
                  <TemplatePickerRow
                    key={t.name}
                    name={t.name}
                    exerciseCount={t.exercises.length}
                    accent="default"
                    onClick={() => {
                      onClose();
                      // Encode the catalog template as a URL param for the new page
                      const params = new URLSearchParams({
                        catalog: JSON.stringify({
                          name: t.name,
                          exercises: t.exercises,
                        }),
                      });
                      router.push(
                        `/workouts/templates/new?${params.toString()}`,
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const { templates, loading, deleteTemplate, patchTemplate } =
    useWorkoutTemplates();
  const [showNewModal, setShowNewModal] = useState(false);

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
    <div className="space-y-5">
      {showNewModal && (
        <NewRoutineModal
          templates={templates}
          onClose={() => setShowNewModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">
            Workouts
          </h1>
          <p className="text-xs text-white/30 mt-0.5">
            Tus rutinas de entrenamiento
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-300 ease-out"
          style={{ boxShadow: "0 8px 32px -4px rgba(37,119,255,0.45)" }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Nueva
        </button>
      </div>

      <p className="text-[11px] text-white/20">
        Toca los días para planificar tu semana.
      </p>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <GlassPanel
          glow
          className="py-16 flex flex-col items-center text-center px-6 gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/[0.08] flex items-center justify-center">
            <Dumbbell
              size={24}
              className="text-primary/50"
              strokeWidth={1.75}
            />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white/50 text-sm">
              Sin rutinas todavía
            </p>
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
      ) : (
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
