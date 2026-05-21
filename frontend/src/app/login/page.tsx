"use client";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
      <h1 className="text-4xl font-bold text-primary mb-2">Kognis</h1>
      <p className="text-foreground/80 mb-8">
        Inicia sesión para optimizar tu vida
      </p>
      <button className="bg-primary text-[#0B0F17] px-6 py-3 rounded-lg font-bold w-full max-w-sm transition-transform active:scale-95">
        Entrar (Próximamente)
      </button>
    </div>
  );
}
