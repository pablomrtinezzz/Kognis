"use client";

import { LogOut, User } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Usuario";

  const email = user?.email ?? "—";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      toast("No se pudo cerrar sesión. Inténtalo de nuevo.", "error");
      setLoggingOut(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-0.5">
          Cuenta
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white/90">
          Perfil
        </h1>
      </div>

      {/* Avatar + info card */}
      <GlassPanel glow className="p-6 flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold"
          style={{
            background:
              "linear-gradient(135deg, rgba(37,119,255,0.25) 0%, rgba(37,119,255,0.10) 100%)",
            border: "1px solid rgba(37,119,255,0.25)",
            color: "rgb(37,119,255)",
          }}
        >
          {initials || <User size={24} strokeWidth={1.75} />}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white/90 text-base truncate">
            {displayName}
          </p>
          <p className="text-sm text-white/35 truncate mt-0.5">{email}</p>
        </div>
      </GlassPanel>

      {/* Session section */}
      <GlassPanel className="divide-y divide-white/[0.05]">
        <div className="px-5 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
            Sesión
          </p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all duration-200 disabled:opacity-40 rounded-b-2xl"
          style={{ color: "rgb(248,113,113)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(239,68,68,0.05)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent")
          }
        >
          <LogOut size={16} strokeWidth={2} />
          <span className="text-sm font-semibold">
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </span>
        </button>
      </GlassPanel>
    </div>
  );
}
