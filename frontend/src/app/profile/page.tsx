"use client";

import Link from "next/link";
import { Construction, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5">
        <Construction size={26} className="text-amber-400" strokeWidth={1.75} />
      </div>

      <h1 className="text-xl font-bold tracking-tight text-foreground mb-1.5">
        Perfil
      </h1>
      <p className="text-sm text-foreground/40 max-w-[240px] leading-relaxed mb-1">
        Esta sección está en desarrollo.
      </p>
      <p className="text-xs text-foreground/25 font-medium mb-8">Sprint 4</p>

      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-sm text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Volver al inicio
      </Link>
    </div>
  );
}
