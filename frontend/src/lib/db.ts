import Dexie, { type Table } from "dexie";

// Interface for actions performed while offline
export interface OfflineMutation {
  id?: number;
  type: string; // e.g., 'CREATE_WORKOUT', 'UPDATE_GOAL'
  payload: any; // The JSON data to send to the backend
  createdAt: string;
}

export class KognisDatabase extends Dexie {
  // Declare local tables
  mutations!: Table<OfflineMutation, number>;
  goals!: Table<any, string>;
  workouts!: Table<any, string>;

  constructor() {
    super("KognisDB");

    // Define the database schema for Dexie
    // ++id means auto-increment, other strings are indexed columns
    this.version(1).stores({
      mutations: "++id, type, createdAt",
      goals: "id, category",
      workouts: "id, date",
    });
  }
}

// Export a singleton instance of the local database
export const db = new KognisDatabase();
