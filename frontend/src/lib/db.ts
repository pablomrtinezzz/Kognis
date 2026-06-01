import Dexie, { type Table } from "dexie";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfflineMutation {
  id?: number;
  type: string;
  payload: unknown;
  createdAt: string;
}

export type SyncStatus = "pending" | "syncing" | "synced" | "error";

export type ExerciseBlock = "warmup" | "main" | "cooldown";

export interface TemplateExercise {
  name: string;
  sets: number;
  reps: number;
  block?: ExerciseBlock;
}

export interface LocalWorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  created_at: string;
  weekdays?: number[]; // 0=Mon … 6=Sun (ISO week)
}

export interface LocalFolder {
  id: string; // PK — client-generated UUID (sent as local_id to server)
  name: string;
  colorIndex: number;
  created_at: string;
  // Sync fields populated after the folder is pushed to the backend
  server_id?: string; // Supabase UUID assigned by the server
  user_id?: string;
  sync_status: SyncStatus;
}

export interface LocalFolderAssignment {
  doc_id: string; // PK — document server UUID
  folder_id: string; // FK → LocalFolder.id (client UUID)
}

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
  block?: ExerciseBlock;
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
  workout_templates!: Table<LocalWorkoutTemplate, string>;
  folders!: Table<LocalFolder, string>;
  folder_assignments!: Table<LocalFolderAssignment, string>;

  constructor() {
    super("KognisDB");

    // v1 — original schema
    this.version(1).stores({
      mutations: "++id, type, createdAt",
      goals: "id, category",
      workouts: "id, date",
    });

    // v2 — offline-first workout model
    this.version(2)
      .stores({
        mutations: "++id, type, createdAt",
        goals: "id, category",
        workouts: "local_id, server_id, sync_status, user_id",
        workout_exercises: "local_id, workout_local_id, sync_status",
        sets: "local_id, workout_exercise_local_id, sync_status",
      })
      .upgrade(async (tx) => {
        // v1 workouts had an incompatible PK ('id' vs 'local_id')
        await tx.table("workouts").clear();
      });

    // v3 — started_at index on workouts
    this.version(3).stores({
      mutations: "++id, type, createdAt",
      goals: "id, category",
      workouts: "local_id, server_id, sync_status, user_id, started_at",
      workout_exercises: "local_id, workout_local_id, sync_status",
      sets: "local_id, workout_exercise_local_id, sync_status",
    });

    // v4 — workout_templates table
    this.version(4).stores({
      mutations: "++id, type, createdAt",
      goals: "id, category",
      workouts: "local_id, server_id, sync_status, user_id, started_at",
      workout_exercises: "local_id, workout_local_id, sync_status",
      sets: "local_id, workout_exercise_local_id, sync_status",
      workout_templates: "id, name, created_at",
    });

    // v5 — folders and folder_assignments (Cognitive module organisation)
    this.version(5).stores({
      mutations: "++id, type, createdAt",
      goals: "id, category",
      workouts: "local_id, server_id, sync_status, user_id, started_at",
      workout_exercises: "local_id, workout_local_id, sync_status",
      sets: "local_id, workout_exercise_local_id, sync_status",
      workout_templates: "id, name, created_at",
      folders: "id, name, created_at",
      folder_assignments: "doc_id, folder_id",
    });

    // v6 — folders gains server_id + sync_status for offline-first backend sync
    this.version(6)
      .stores({
        mutations: "++id, type, createdAt",
        goals: "id, category",
        workouts: "local_id, server_id, sync_status, user_id, started_at",
        workout_exercises: "local_id, workout_local_id, sync_status",
        sets: "local_id, workout_exercise_local_id, sync_status",
        workout_templates: "id, name, created_at",
        folders: "id, server_id, sync_status, name, created_at",
        folder_assignments: "doc_id, folder_id",
      })
      .upgrade(async (tx) => {
        // Backfill sync_status for any folders created before v6
        await tx
          .table("folders")
          .toCollection()
          .modify((folder: LocalFolder) => {
            if (!folder.sync_status) {
              folder.sync_status = "pending";
            }
          });
      });
  }
}

export const db = new KognisDatabase();
