"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { getExerciseMuscle } from "@/lib/exercises";

export interface ProgressPoint {
  date: string; // YYYY-MM-DD
  oneRm: number; // max Epley 1RM for that day
  ewma: number; // EWMA(span=5) of oneRm
  reps: number; // reps of the best set
  weightKg: number; // weight of the best set
}

export interface ProgressionSuggestion {
  predicted1rm: number;
  optionA: { reps: number; weightKg: number }; // same reps, more weight
  optionB: { reps: number; weightKg: number }; // same weight, more reps
}

function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function roundNearest(value: number, nearest = 1.25): number {
  return Math.round(value / nearest) * nearest;
}

// adjust=False EWMA matching pandas ewm(span, adjust=False).mean()
function computeEWMA(values: number[], span = 5): number[] {
  if (values.length === 0) return [];
  const alpha = 2 / (span + 1);
  const result = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

export function useProgressData(exerciseName: string | null) {
  const [points, setPoints] = useState<ProgressPoint[]>([]);
  const [suggestion, setSuggestion] = useState<ProgressionSuggestion | null>(
    null,
  );
  const [exercises, setExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load distinct exercise names the user has trained
  useEffect(() => {
    (async () => {
      const all = await db.workout_exercises.toArray();
      const names = [...new Set(all.map((e) => e.exercise_name))].sort((a, b) =>
        a.localeCompare(b, "es"),
      );
      setExercises(names);
    })();
  }, []);

  // Compute history for selected exercise
  useEffect(() => {
    if (!exerciseName) {
      setPoints([]);
      setSuggestion(null);
      return;
    }

    setLoading(true);

    (async () => {
      // 1. Find all workout_exercises matching the name
      const exRows = await db.workout_exercises
        .filter(
          (e) => e.exercise_name.toLowerCase() === exerciseName.toLowerCase(),
        )
        .toArray();

      if (exRows.length === 0) {
        setPoints([]);
        setSuggestion(null);
        setLoading(false);
        return;
      }

      // 2. Load workout dates
      const workoutIds = [...new Set(exRows.map((e) => e.workout_local_id))];
      const workouts = await db.workouts
        .where("local_id")
        .anyOf(workoutIds)
        .toArray();
      const dateMap: Record<string, string> = {};
      for (const w of workouts) dateMap[w.local_id] = w.started_at.slice(0, 10);

      // 3. Load all sets for those exercises
      const exLocalIds = exRows.map((e) => e.local_id);
      const sets = await db.sets
        .where("workout_exercise_local_id")
        .anyOf(exLocalIds)
        .toArray();

      // 4. Group by date → best 1RM per day
      const dayBest: Record<
        string,
        { oneRm: number; reps: number; weightKg: number }
      > = {};
      for (const s of sets) {
        const exRow = exRows.find(
          (e) => e.local_id === s.workout_exercise_local_id,
        );
        if (!exRow || !s.reps || !s.weight_kg) continue;
        const date = dateMap[exRow.workout_local_id];
        if (!date) continue;
        const orm = epley(s.weight_kg, s.reps);
        if (!dayBest[date] || orm > dayBest[date].oneRm) {
          dayBest[date] = { oneRm: orm, reps: s.reps, weightKg: s.weight_kg };
        }
      }

      const sortedDates = Object.keys(dayBest).sort();
      if (sortedDates.length === 0) {
        setPoints([]);
        setSuggestion(null);
        setLoading(false);
        return;
      }

      // 5. EWMA
      const rawValues = sortedDates.map((d) => dayBest[d].oneRm);
      const ewmaValues = computeEWMA(rawValues);

      const result: ProgressPoint[] = sortedDates.map((date, i) => ({
        date,
        oneRm: Math.round(dayBest[date].oneRm * 10) / 10,
        ewma: Math.round(ewmaValues[i] * 10) / 10,
        reps: dayBest[date].reps,
        weightKg: dayBest[date].weightKg,
      }));

      setPoints(result);

      // 6. Progression suggestion (+2.5% on EWMA)
      const lastEwma = ewmaValues[ewmaValues.length - 1];
      const predicted = lastEwma * 1.025;
      const last = dayBest[sortedDates[sortedDates.length - 1]];

      const weightA = roundNearest(predicted / (1 + last.reps / 30));
      const repsB = Math.max(
        last.reps + 1,
        Math.round(30 * (predicted / last.weightKg - 1)),
      );

      setSuggestion({
        predicted1rm: Math.round(predicted * 10) / 10,
        optionA: { reps: last.reps, weightKg: weightA },
        optionB: { reps: repsB, weightKg: last.weightKg },
      });

      setLoading(false);
    })();
  }, [exerciseName]);

  return { points, suggestion, exercises, loading };
}

export function useWeeklyMuscleVolume() {
  const [volume, setVolume] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      since.setHours(0, 0, 0, 0);

      const recentWorkouts = await db.workouts
        .filter((w) => new Date(w.started_at) >= since)
        .toArray();

      if (recentWorkouts.length === 0) {
        setVolume({});
        setLoading(false);
        return;
      }

      const workoutLocalIds = recentWorkouts.map((w) => w.local_id);

      const exercises = await db.workout_exercises
        .where("workout_local_id")
        .anyOf(workoutLocalIds)
        .toArray();

      const exLocalIds = exercises.map((e) => e.local_id);

      const sets = await db.sets
        .where("workout_exercise_local_id")
        .anyOf(exLocalIds)
        .toArray();

      const exMap: Record<string, string> = {};
      for (const ex of exercises) exMap[ex.local_id] = ex.exercise_name;

      const counts: Record<string, number> = {};
      for (const s of sets) {
        if (!s.reps || s.reps <= 0) continue;
        const exerciseName = exMap[s.workout_exercise_local_id];
        if (!exerciseName) continue;
        const muscle = getExerciseMuscle(exerciseName);
        if (!muscle) continue;
        counts[muscle] = (counts[muscle] ?? 0) + 1;
      }

      setVolume(counts);
      setLoading(false);
    })();
  }, []);

  return { volume, loading };
}
