"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/store/AuthContext";
import { db, type LocalWorkout, type OfflineMutation } from "@/lib/db";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

// ─── Sync a single workout (POST for new, PUT for edited) ─────────────────────

async function syncWorkout(
  workout: LocalWorkout,
  token: string,
): Promise<void> {
  await db.workouts.update(workout.local_id, { sync_status: "syncing" });

  try {
    const exercises = await db.workout_exercises
      .where("workout_local_id")
      .equals(workout.local_id)
      .sortBy("order_index");

    const exercisesPayload = await Promise.all(
      exercises.map(async (ex) => {
        const sets = await db.sets
          .where("workout_exercise_local_id")
          .equals(ex.local_id)
          .sortBy("set_number");

        return {
          local_id: ex.local_id,
          exercise_name: ex.exercise_name,
          order_index: ex.order_index,
          sets: sets.map((s) => ({
            local_id: s.local_id,
            set_number: s.set_number,
            reps: s.reps,
            weight_kg: s.weight_kg,
            duration_seconds: s.duration_seconds,
            rpe: s.rpe,
          })),
        };
      }),
    );

    const body = JSON.stringify({
      local_id: workout.local_id,
      name: workout.name,
      started_at: workout.started_at,
      finished_at: workout.finished_at,
      notes: workout.notes,
      exercises: exercisesPayload,
    });

    // First sync → POST to create. Re-sync after edit → PUT to replace.
    const isUpdate = !!workout.server_id;
    const url = isUpdate
      ? `${API_URL}/api/v1/workouts/${workout.local_id}`
      : `${API_URL}/api/v1/workouts/`;

    const res = await fetch(url, {
      method: isUpdate ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    await db.workouts.update(workout.local_id, {
      server_id: data.id,
      sync_status: "synced",
    });

    for (const ex of data.exercises) {
      await db.workout_exercises.update(ex.local_id, {
        server_id: ex.id,
        sync_status: "synced",
      });
      for (const s of ex.sets) {
        await db.sets.update(s.local_id, {
          server_id: s.id,
          sync_status: "synced",
        });
      }
    }
  } catch {
    await db.workouts.update(workout.local_id, { sync_status: "error" });
  }
}

// ─── Drain the DELETE_WORKOUT mutation queue ──────────────────────────────────

async function syncDeleteMutations(token: string): Promise<void> {
  const pending = await db.mutations
    .where("type")
    .equals("DELETE_WORKOUT")
    .toArray();

  for (const mutation of pending) {
    const { local_id } = mutation.payload as { local_id: string };
    try {
      const res = await fetch(`${API_URL}/api/v1/workouts/${local_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // 404 means it was already deleted on the server — still a success
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);

      if (mutation.id != null) await db.mutations.delete(mutation.id);
    } catch {
      // Leave the mutation in the queue; retry on the next online event
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSyncManager(): void {
  const { session } = useAuth();
  const isSyncing = useRef(false);

  const runSync = useCallback(async (token: string) => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      // Crash recovery: records stuck in 'syncing' from a previous session
      await db.workouts
        .where("sync_status")
        .equals("syncing")
        .modify({ sync_status: "pending" });

      // Also retry 'error' records on each new online event
      await db.workouts
        .where("sync_status")
        .equals("error")
        .modify({ sync_status: "pending" });

      const pending = await db.workouts
        .where("sync_status")
        .equals("pending")
        .toArray();

      for (const workout of pending) {
        await syncWorkout(workout, token);
      }

      // Process queued offline deletes
      await syncDeleteMutations(token);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  useEffect(() => {
    if (!session || BYPASS_AUTH) return;

    if (navigator.onLine) {
      runSync(session.access_token);
    }

    const handleOnline = () => runSync(session.access_token);
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [session, runSync]);
}
