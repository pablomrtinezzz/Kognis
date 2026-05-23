import { db, type SyncStatus } from "./db";

const DEV_USER_ID = "dev-user-00000000-0000-0000-0000-000000000001";
const SYNCED: SyncStatus = "synced";

// 12 weeks of progressive overload: 60 kg × 10 reps → 80 kg × 7 reps
const WEEKS: { weight: number; sets: number[] }[] = [
  { weight: 60, sets: [10, 10, 9] },
  { weight: 62.5, sets: [10, 10, 9] },
  { weight: 65, sets: [9, 9, 8] },
  { weight: 65, sets: [10, 9, 9] },
  { weight: 67.5, sets: [9, 9, 8] },
  { weight: 70, sets: [8, 8, 8] },
  { weight: 70, sets: [9, 9, 8] },
  { weight: 72.5, sets: [8, 8, 7] },
  { weight: 75, sets: [8, 8, 7] },
  { weight: 75, sets: [8, 8, 8] },
  { weight: 77.5, sets: [8, 7, 7] },
  { weight: 80, sets: [7, 7, 6] },
];

function buildSessions(): Array<{
  date: Date;
  weight: number;
  sets: number[];
}> {
  const today = new Date();
  // Anchor 12 weeks back, advanced to the nearest Monday
  const anchor = new Date(today);
  anchor.setDate(today.getDate() - 84);
  anchor.setDate(anchor.getDate() + ((8 - anchor.getDay()) % 7));

  return WEEKS.flatMap(({ weight, sets }, week) =>
    [0, 3].flatMap((dayOffset) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + week * 7 + dayOffset);
      return d < today ? [{ date: d, weight, sets }] : [];
    }),
  );
}

/**
 * Populates Dexie with 12 weeks of "Press banca" mock data for the dev user.
 * Idempotent: does nothing if data already exists.
 */
export async function seedDevDataIfEmpty(): Promise<void> {
  const existing = await db.workouts.count();
  if (existing > 0) return;

  const sessions = buildSessions();

  for (const { date, weight, sets } of sessions) {
    const workoutLocalId = crypto.randomUUID();
    const startedAt = new Date(date);
    startedAt.setHours(10, 0, 0, 0);
    const finishedAt = new Date(startedAt);
    finishedAt.setMinutes(startedAt.getMinutes() + 50);

    await db.workouts.put({
      local_id: workoutLocalId,
      server_id: crypto.randomUUID(),
      user_id: DEV_USER_ID,
      name: "Press banca",
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      sync_status: SYNCED,
    });

    const exLocalId = crypto.randomUUID();
    await db.workout_exercises.put({
      local_id: exLocalId,
      server_id: crypto.randomUUID(),
      workout_local_id: workoutLocalId,
      exercise_name: "Press banca",
      order_index: 0,
      sync_status: SYNCED,
    });

    for (let i = 0; i < sets.length; i++) {
      await db.sets.put({
        local_id: crypto.randomUUID(),
        server_id: crypto.randomUUID(),
        workout_exercise_local_id: exLocalId,
        set_number: i + 1,
        reps: sets[i],
        weight_kg: weight,
        sync_status: SYNCED,
      });
    }
  }
}
