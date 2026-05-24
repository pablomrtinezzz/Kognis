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

// Active-indicator style shared between sidebar and bottom nav
const INDICATOR_STYLE = {
  backgroundColor: "rgb(37,119,255)",
  boxShadow: "0 0 14px rgba(37,119,255,0.55)",
};

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
    /*
     * CSS-Grid shell — desktop: [72px sidebar | 1fr main], mobile: single col.
     * The `gridTemplateColumns` inline style is only meaningful when
     * `md:grid` applies (≥768 px); below that the div is display:block.
     */
    <div
      className="min-h-screen md:grid"
      style={{
        gridTemplateColumns: showNav ? "72px 1fr" : "1fr",
        color: "rgb(242, 244, 248)",
      }}
    >
      {/* ── Fixed ambient-orb background — gives backdrop-blur something to blur ── */}
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
        <div
          className="fixed top-3 right-3 z-[200] flex items-center gap-1.5 text-[10px] font-bold text-amber-400/90 px-3 py-1.5 rounded-full pointer-events-none select-none"
          style={{
            backgroundColor: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.15)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <FlaskConical size={10} strokeWidth={2.5} />
          Dev Mode
        </div>
      )}

      {/* ── Desktop sidebar — grid column 1, sticky so it stays in viewport ── */}
      {showNav && (
        <aside
          className="hidden md:flex flex-col items-center py-6"
          style={{
            position: "sticky",
            top: 0,
            height: "100dvh",
            overflowY: "auto",
            backgroundColor: "rgba(9,9,14,0.95)",
            borderRight: "1px solid rgba(255,255,255,0.04)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            zIndex: 50,
          }}
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
                  className={`relative w-full h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ease-out ${
                    isActive
                      ? "bg-white/[0.07] text-white"
                      : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                      style={INDICATOR_STYLE}
                    />
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

      {/* ── Main content — grid column 2 (or full width when no nav) ── */}
      <main className="min-h-screen w-full">
        <div
          className={
            showNav
              ? "max-w-xl mx-auto px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-12"
              : ""
          }
        >
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav — outside grid flow via position:fixed ── */}
      {showNav && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-50"
          style={{
            backgroundColor: "rgba(9,9,14,0.82)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <ul className="flex h-16 items-stretch px-1">
            {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <li key={href} className="flex-1 relative">
                  <Link
                    href={href}
                    className={`flex flex-col items-center justify-center h-full gap-1 transition-all duration-300 ease-out active:scale-[0.92] ${
                      isActive
                        ? "text-white"
                        : "text-white/30 hover:text-white/55"
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-full"
                        style={INDICATOR_STYLE}
                      />
                    )}
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                    <span
                      className={`text-[10px] font-semibold tracking-tight transition-opacity ${
                        isActive ? "opacity-100" : "opacity-50"
                      }`}
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
