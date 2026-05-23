"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { db, type LocalWorkout, type SyncStatus } from "@/lib/db";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useWorkouts() {
  const { session } = useAuth();
  const [workouts, setWorkouts] = useState<LocalWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

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

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);

    // Step 1 — Local-first: show Dexie data instantly
    const local = await db.workouts.orderBy("started_at").reverse().toArray();
    setWorkouts(local);

    if (!navigator.onLine) {
      setIsOffline(true);
      setLoading(false);
      return;
    }

    // Step 2 — Pull from server to catch workouts from other devices/sessions
    try {
      const res = await fetch(`${API_URL}/api/v1/workouts/`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const serverWorkouts: Array<{
        id: string;
        local_id: string;
        user_id: string;
        name?: string;
        started_at: string;
        finished_at?: string;
        notes?: string;
        created_at: string;
      }> = await res.json();

      // Write-through: add server workouts not yet in Dexie
      for (const w of serverWorkouts) {
        const exists = await db.workouts.get(w.local_id);
        if (!exists) {
          await db.workouts.put({
            local_id: w.local_id,
            server_id: w.id,
            user_id: w.user_id,
            name: w.name,
            started_at: w.started_at,
            finished_at: w.finished_at,
            notes: w.notes,
            sync_status: "synced" as SyncStatus,
          });
        }
      }

      // Re-read — Dexie is now the complete source of truth
      const merged = await db.workouts
        .orderBy("started_at")
        .reverse()
        .toArray();
      setWorkouts(merged);
      setIsOffline(false);
    } catch {
      // Network failed — Dexie data already shown from step 1
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteWorkout = useCallback(
    async (localId: string) => {
      // 1. Get exercise local_ids to cascade-delete their sets
      const exercises = await db.workout_exercises
        .where("workout_local_id")
        .equals(localId)
        .toArray();

      const exerciseLocalIds = exercises.map((e) => e.local_id);

      if (exerciseLocalIds.length > 0) {
        await db.sets
          .where("workout_exercise_local_id")
          .anyOf(exerciseLocalIds)
          .delete();
      }
      await db.workout_exercises
        .where("workout_local_id")
        .equals(localId)
        .delete();

      // Capture server_id before removing the row
      const workout = await db.workouts.get(localId);
      const hasBeenSynced = !!workout?.server_id;

      await db.workouts.delete(localId);

      // Optimistic UI update
      setWorkouts((prev) => prev.filter((w) => w.local_id !== localId));

      // 2. Propagate to server
      if (!hasBeenSynced) return; // Never reached the server — nothing to do

      if (navigator.onLine && session) {
        try {
          const res = await fetch(`${API_URL}/api/v1/workouts/${localId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          // 404 means already gone — treat as success
          if (!res.ok && res.status !== 404)
            throw new Error(`HTTP ${res.status}`);
        } catch {
          // Offline delete failed — queue for next sync
          await db.mutations.add({
            type: "DELETE_WORKOUT",
            payload: { local_id: localId },
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // Offline — queue the delete for when connection returns
        await db.mutations.add({
          type: "DELETE_WORKOUT",
          payload: { local_id: localId },
          createdAt: new Date().toISOString(),
        });
      }
    },
    [session],
  );

  return { workouts, loading, isOffline, refresh: load, deleteWorkout };
}
