"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

// ─── Dev bypass ───────────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_BYPASS_AUTH=true in .env.local to skip Supabase and use a
// fake session. Lets you test the full UI without a real Supabase project.

const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

const DEV_USER = {
  id: "dev-user-00000000-0000-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "dev@kognis.local",
  app_metadata: { provider: "dev-bypass", providers: ["dev-bypass"] },
  user_metadata: { full_name: "Dev User" },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as unknown as User;

const DEV_SESSION = {
  access_token: "dev-bypass-token",
  refresh_token: "dev-bypass-refresh",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: DEV_USER,
} as unknown as Session;

// ─────────────────────────────────────────────────────────────────────────────

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Dev bypass: inject a fake session immediately, skip Supabase entirely
    if (BYPASS_AUTH) {
      setUser(DEV_USER);
      setSession(DEV_SESSION);
      setLoading(false);
      return;
    }

    // Production: check active session on mount
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Route protection logic
  useEffect(() => {
    if (!loading) {
      const isAuthRoute = pathname === "/login";
      if (!user && !isAuthRoute) {
        // Kick out unauthenticated users
        router.push("/login");
      } else if (user && (isAuthRoute || pathname === "/")) {
        // Redirect logged-in users away from login/root to the dashboard
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {/* Loading screen to prevent flash of unauthenticated content */}
      {loading ? (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-primary">
          <div className="animate-pulse text-2xl font-bold">Kognis</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
