"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/AuthContext";
import { useSyncManager } from "@/hooks/useSyncManager";
import {
  Home,
  TrendingUp,
  Dumbbell,
  User,
  FlaskConical,
  Brain,
} from "lucide-react";
import Image from "next/image";

const IS_DEV = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

const NAV_ITEMS = [
  { name: "Inicio", href: "/dashboard", icon: Home },
  { name: "Progreso", href: "/progress", icon: TrendingUp },
  { name: "Entrenos", href: "/workouts", icon: Dumbbell },
  { name: "Estudio", href: "/study", icon: Brain },
  { name: "Perfil", href: "/profile", icon: User },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  useSyncManager();

  const showNav = !loading && !!user && pathname !== "/login";

  return (
    <div className="min-h-screen" style={{ color: "rgb(242, 244, 248)" }}>
      {/* Ambient background — orbs that backdrop-blur interacts with */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
          background: [
            "radial-gradient(ellipse 80% 55% at 10% -5%, rgba(37,119,255,0.14) 0%, transparent 58%)",
            "radial-gradient(ellipse 65% 45% at 92% 108%, rgba(16,185,129,0.10) 0%, transparent 52%)",
            "radial-gradient(ellipse 55% 38% at 55% 58%, rgba(37,119,255,0.05) 0%, transparent 68%)",
            "rgb(9, 9, 14)",
          ].join(", "),
        }}
      />
      {/* ── Dev badge ── */}
      {IS_DEV && (
        <div className="fixed top-3 right-3 z-[200] flex items-center gap-1.5 text-[10px] font-bold text-amber-400/90 bg-amber-500/[0.08] border border-amber-500/[0.15] px-3 py-1.5 rounded-full pointer-events-none select-none backdrop-blur-xl">
          <FlaskConical size={10} strokeWidth={2.5} />
          Dev Mode
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      {showNav && (
        <aside
          className="hidden md:flex fixed left-0 top-0 h-screen w-[72px] flex-col items-center py-6 z-50 border-r border-white/[0.04] backdrop-blur-2xl"
          style={{ backgroundColor: "rgba(9,9,14,0.95)" }}
        >
          <div className="w-8 h-8 mb-8 shrink-0">
            <Image
              src="/assets/icon.png"
              alt="Kognis"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <nav className="flex flex-col items-center gap-1 w-full px-2.5">
            {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={name}
                  className={`relative w-full h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ease-out
                    ${
                      isActive
                        ? "bg-white/[0.07] text-white"
                        : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
                    }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full shadow-primary-glow" />
                  )}
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className="text-[9px] font-semibold tracking-wide opacity-70">
                    {name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* ── Main content ── */}
      <main className={showNav ? "md:pl-[72px] min-h-screen" : "min-h-screen"}>
        <div
          className={
            showNav
              ? "max-w-xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-12"
              : ""
          }
        >
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      {showNav && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-50 backdrop-blur-2xl border-t border-white/[0.05]"
          style={{ backgroundColor: "rgba(9,9,14,0.80)" }}
        >
          <ul className="flex h-16 items-stretch px-1">
            {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <li key={href} className="flex-1 relative">
                  <Link
                    href={href}
                    className={`flex flex-col items-center justify-center h-full gap-1 transition-all duration-300 ease-out active:scale-[0.92]
                      ${isActive ? "text-white" : "text-white/30 hover:text-white/55"}`}
                  >
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-primary rounded-b-full shadow-primary-glow" />
                    )}
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                    <span
                      className={`text-[10px] font-semibold tracking-tight transition-opacity ${isActive ? "opacity-100" : "opacity-50"}`}
                    >
                      {name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
