"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

// ─── Single toast ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    color: "rgb(52,211,153)",
    bg: "rgba(16,185,129,0.09)",
    border: "rgba(16,185,129,0.22)",
  },
  error: {
    icon: XCircle,
    color: "rgb(248,113,113)",
    bg: "rgba(239,68,68,0.09)",
    border: "rgba(239,68,68,0.22)",
  },
  info: {
    icon: Info,
    color: "rgb(37,119,255)",
    bg: "rgba(37,119,255,0.09)",
    border: "rgba(37,119,255,0.22)",
  },
};

function SingleToast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[260px] max-w-[360px] animate-toast-in"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
      }}
    >
      <Icon
        size={15}
        strokeWidth={2}
        style={{ color: cfg.color, flexShrink: 0 }}
      />
      <p className="flex-1 text-sm font-semibold text-white/85 leading-snug">
        {item.message}
      </p>
      <button
        onClick={onDismiss}
        className="text-white/25 hover:text-white/60 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Stack at bottom-right; bottom-20 on mobile to clear bottom nav */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <SingleToast item={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  return useContext(ToastContext).toast;
}
