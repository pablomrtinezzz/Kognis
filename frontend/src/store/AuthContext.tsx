"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { seedDevDataIfEmpty } from "@/lib/devSeed";
import { useRouter, usePathname } from "next/navigation";

// ─── Dev bypass ───────────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_BYPASS_AUTH=true in .env.local to skip Supabase and use a
// fake session. Lets you test the full UI without a real Supabase project.

const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "dev@kognis.local",
  app_metadata: { provider: "dev-bypass", providers: ["dev-bypass"] },
  user_metadata: { full_name: "Dev User" },
  // ID must be a valid UUID — matches _DEV_USER_ID in backend/src/api/deps.py
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as unknown as User;

const DEV_SESSION = {
  access_token:
    process.env.NEXT_PUBLIC_DEV_BYPASS_TOKEN ?? "dev-local-secret-2026",
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
  activateBypass: (() => void) | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  activateBypass: null,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const signOut = useCallback(async () => {
    if (BYPASS_AUTH) {
      setUser(null);
      setSession(null);
      router.push("/login");
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push("/login");
  }, [router]);

  // Kept for manual invocation from LoginPage (also auto-called on mount in bypass mode)
  const activateBypass = useCallback(async () => {
    await seedDevDataIfEmpty();
    setUser(DEV_USER);
    setSession(DEV_SESSION);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Dev bypass: auto-activate dev session on every mount so page reloads
    // don't require re-clicking the bypass button.
    if (BYPASS_AUTH) {
      activateBypass();
      return;
    }

    // Production: check active session on mount
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch {
        // Supabase unreachable — stay unauthenticated but unblock the UI
      } finally {
        setLoading(false);
      }
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Route protection logic
  useEffect(() => {
    if (loading) return;
    const isAuthRoute = pathname === "/login";

    if (BYPASS_AUTH) {
      if (pathname === "/") {
        router.push(user ? "/dashboard" : "/login");
      } else if (user && isAuthRoute) {
        router.push("/dashboard");
      }
      return;
    }

    if (!user && !isAuthRoute) {
      router.push("/login");
    } else if (user && (isAuthRoute || pathname === "/")) {
      router.push("/dashboard");
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        activateBypass: BYPASS_AUTH ? activateBypass : null,
        signOut,
      }}
    >
      {loading ? (
        <div
          style={{
            height: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgb(9, 9, 14)",
            color: "rgb(37, 119, 255)",
          }}
        >
          <div className="animate-pulse text-2xl font-bold">Kognis</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
