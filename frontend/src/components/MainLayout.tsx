"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/AuthContext";
import { Home, Target, Dumbbell, User } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Hide navigation bar if loading or on the login page
  if (loading || !user || pathname === "/login") {
    return <>{children}</>;
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Objetivos", href: "/goals", icon: Target },
    { name: "Entrenos", href: "/workouts", icon: Dumbbell },
    { name: "Perfil", href: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 md:pl-20">
      {/* Main Content Area */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</main>

      {/* Bottom Navigation (Mobile) & Side Navigation (Desktop) */}
      <nav className="fixed bottom-0 w-full border-t border-gray-800 bg-[#0B0F17] md:w-20 md:h-screen md:border-t-0 md:border-r md:left-0 md:top-0 z-50">
        <ul className="flex md:flex-col justify-around items-center h-16 md:h-full md:justify-center md:gap-12">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.name} className="w-full">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center h-full gap-1 p-2 transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] md:text-xs font-medium">
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
