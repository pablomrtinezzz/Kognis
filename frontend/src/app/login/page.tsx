"use client";

import { FlaskConical } from "lucide-react";
import { useAuth } from "@/store/AuthContext";

export default function LoginPage() {
  const { activateBypass } = useAuth();

  return (
    <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,119,255,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-primary-glow">
          <span className="text-white font-bold text-3xl leading-none select-none">
            K
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-1.5">
          Kognis
        </h1>
        <p className="text-foreground/45 text-base text-center mb-10 leading-snug">
          Optimiza tu rendimiento,
          <br />
          día a día.
        </p>

        {/* Actions */}
        <div className="w-full space-y-3">
          {activateBypass ? (
            <button
              onClick={activateBypass}
              className="w-full py-3.5 flex items-center justify-center gap-2.5 rounded-2xl font-semibold text-sm text-yellow-400 border border-yellow-500/25 bg-yellow-500/8 hover:bg-yellow-500/14 active:scale-[0.98] transition-all duration-150"
            >
              <FlaskConical size={16} strokeWidth={2} />
              Entrar como Usuario de Pruebas
            </button>
          ) : (
            <>
              <button className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm shadow-primary-glow hover:bg-primary/90 active:scale-[0.98] transition-all duration-150">
                Continuar con Google
              </button>
              <button className="w-full py-3.5 rounded-2xl font-semibold text-sm text-foreground/70 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-150">
                Continuar con Apple
              </button>
            </>
          )}
        </div>

        <p className="mt-8 text-[11px] text-foreground/25 text-center leading-relaxed max-w-[260px]">
          Al continuar, aceptas los Términos de servicio y la Política de
          privacidad de Kognis.
        </p>
      </div>
    </div>
  );
}
