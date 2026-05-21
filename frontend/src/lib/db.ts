import Dexie, { type Table } from "dexie";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfflineMutation {
  id?: number;
  type: string;
  payload: unknown;
  createdAt: string;
}

export type SyncStatus = "pending" | "syncing" | "synced" | "error";

export interface LocalWorkout {
  local_id: string; // PK — client-generated UUID
  server_id?: string; // Populated after backend sync
  user_id: string;
  name?: string;
  started_at: string;
  finished_at?: string;
  notes?: string;
  sync_status: SyncStatus;
}

export interface LocalWorkoutExercise {
  local_id: string;
  server_id?: string;
  workout_local_id: string; // FK → workouts.local_id
  exercise_name: string;
  order_index: number;
  sync_status: SyncStatus;
}

export interface LocalSet {
  local_id: string;
  server_id?: string;
  workout_exercise_local_id: string; // FK → workout_exercises.local_id
  set_number: number;
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
  rpe?: number;
  sync_status: SyncStatus;
}

// ─── Database class ───────────────────────────────────────────────────────────

export class KognisDatabase extends Dexie {
  mutations!: Table<OfflineMutation, number>;
  goals!: Table<unknown, string>;
  workouts!: Table<LocalWorkout, string>;
  workout_exercises!: Table<LocalWorkoutExercise, string>;
  sets!: Table<LocalSet, string>;

  constructor() {
    super("KognisDB");

    // v1 — original schema (must be declared for Dexie migrations to work)
    this.version(1).stores({
      mutations: "++id, type, createdAt",
      goals: "id, category",
      workouts: "id, date",
    });

    // v2 — offline-first workout model + new tables
    this.version(2)
      .stores({
        mutations: "++id, type, createdAt",
        goals: "id, category",
        workouts: "local_id, server_id, sync_status, user_id",
        workout_exercises: "local_id, workout_local_id, sync_status",
        sets: "local_id, workout_exercise_local_id, sync_status",
      })
      .upgrade(async (tx) => {
        // v1 workouts used an incompatible schema (PK was 'id', not 'local_id')
        await tx.table("workouts").clear();
      });
  }
}

export const db = new KognisDatabase();
