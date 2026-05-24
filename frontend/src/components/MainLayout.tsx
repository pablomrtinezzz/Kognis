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
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Progress", href: "/progress", icon: TrendingUp },
  { name: "Workouts", href: "/workouts", icon: Dumbbell },
  { name: "Study", href: "/study", icon: Brain },
  { name: "Profile", href: "/profile", icon: User },
];

const ACTIVE_DOT: React.CSSProperties = {
  backgroundColor: "rgb(37,119,255)",
  boxShadow: "0 0 14px rgba(37,119,255,0.7)",
};

const ACTIVE_ICON_FILTER = "drop-shadow(0 0 8px rgba(37,119,255,0.75))";

const SIDEBAR_STYLE: React.CSSProperties = {
  position: "sticky",
  top: 0,
  height: "100dvh",
  overflowY: "auto",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  zIndex: 50,
};

const BOTTOM_NAV_STYLE: React.CSSProperties = {
  background:
    "linear-gradient(0deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",
  borderTop: "1px solid rgba(255,255,255,0.08)",
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
    <div
      className="relative min-h-screen w-full max-w-none md:grid"
      style={{
        gridTemplateColumns: showNav ? "80px 1fr" : "1fr",
        color: "rgb(242,244,248)",
      }}
    >
      {/* Dev mode badge */}
      {IS_DEV && (
        <div
          className="fixed top-3 right-3 z-[200] flex items-center gap-1.5 text-[10px] font-bold pointer-events-none select-none"
          style={{
            color: "rgba(245,158,11,0.9)",
            backgroundColor: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.15)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "9999px",
            padding: "6px 12px",
          }}
        >
          <FlaskConical size={10} strokeWidth={2.5} />
          Hola Pablo
        </div>
      )}

      {/* Desktop sidebar */}
      {showNav && (
        <aside
          className="hidden md:flex flex-col items-center py-6"
          style={SIDEBAR_STYLE}
        >
          <div className="w-9 h-9 mb-8 shrink-0">
            <Image
              src="/assets/icon.png"
              alt="Kognis"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <nav className="flex flex-col items-center gap-1 w-full px-3">
            {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  title={name}
                  className="group relative w-full h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(37,119,255,0.08)"
                      : "transparent",
                    color: isActive
                      ? "rgb(255,255,255)"
                      : "rgba(255,255,255,0.30)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (
                        e.currentTarget as HTMLAnchorElement
                      ).style.backgroundColor = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        "rgba(255,255,255,0.60)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (
                        e.currentTarget as HTMLAnchorElement
                      ).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        "rgba(255,255,255,0.30)";
                    }
                  }}
                >
                  {/* Left active indicator */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                      style={ACTIVE_DOT}
                    />
                  )}
                  {/* Icon — scales up on hover, glows when active */}
                  <span
                    className="transition-transform duration-300 ease-out group-hover:scale-[1.18]"
                    style={
                      isActive ? { filter: ACTIVE_ICON_FILTER } : undefined
                    }
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
                  </span>
                  <span className="text-[9px] font-semibold tracking-wide opacity-70">
                    {name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main content — full remaining width, no max-w cap */}
      <main className="w-full max-w-none flex-1 min-h-screen overflow-y-auto">
        <div
          className={
            showNav
              ? "w-full max-w-none px-4 md:px-10 py-6 pb-28 md:pb-10"
              : "w-full max-w-none"
          }
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      {showNav && (
        <nav
          className="md:hidden fixed bottom-0 w-full z-50"
          style={BOTTOM_NAV_STYLE}
        >
          <ul className="flex h-16 items-stretch px-1">
            {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href} className="flex-1 relative">
                  <Link
                    href={href}
                    className="flex flex-col items-center justify-center h-full gap-1 transition-all duration-300 ease-out active:scale-[0.92]"
                    style={{
                      color: isActive
                        ? "rgb(255,255,255)"
                        : "rgba(255,255,255,0.30)",
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-full"
                        style={ACTIVE_DOT}
                      />
                    )}
                    <span
                      style={
                        isActive ? { filter: ACTIVE_ICON_FILTER } : undefined
                      }
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                    </span>
                    <span
                      className="text-[10px] font-semibold tracking-tight"
                      style={{ opacity: isActive ? 1 : 0.5 }}
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
