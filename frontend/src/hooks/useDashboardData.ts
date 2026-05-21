"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/db";

export interface Goal {
  id: string;
  user_id: string;
  category: string;
  target_value: number;
  current_value: number;
  streak: number;
  deadline: string | null;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useDashboardData() {
  const { session } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  // Track real-time network transitions
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      setLoading(true);

      // Fast path: already known offline → go straight to cache
      if (!navigator.onLine) {
        const cached = await db.goals.toArray();
        setGoals(cached as Goal[]);
        setIsOffline(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/v1/goals/`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: Goal[] = await res.json();

        // Write-through cache: keep IndexedDB in sync for offline use
        await db.goals.clear();
        await db.goals.bulkPut(data);

        setGoals(data);
        setIsOffline(false);
      } catch {
        // Network failed — fall back to IndexedDB
        const cached = await db.goals.toArray();
        setGoals(cached as Goal[]);
        setIsOffline(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session]);

  return { goals, loading, isOffline };
}
