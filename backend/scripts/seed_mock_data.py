#!/usr/bin/env python3
"""
Seed 12 weeks of 'Press banca' mock data for the dev user.
Run from the backend/ directory:
    python -m scripts.seed_mock_data

Requires USER_ID env var, or falls back to the dev stub user.
Deletes existing seeded workouts first (idempotent).
"""

import os
import sys
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from src.core.database import db  # noqa: E402  (after sys.path fix)

USER_ID = os.getenv("SEED_USER_ID", "dev-user-00000000-0000-0000-0000-000000000001")
EXERCISE_NAME = "Press banca"
SEED_MARKER = "[seed]"


def epley_1rm(weight: float, reps: int) -> float:
    return weight * (1 + reps / 30)


def build_sessions() -> list[dict]:
    """
    3 sessions / week for 12 weeks (Mon, Wed, Fri).
    Progressive overload: +2.5 kg every 2 weeks, slight rep variation.
    """
    today = datetime(2026, 5, 23)
    first_monday = today - timedelta(weeks=12)
    # Advance to the nearest Monday
    first_monday += timedelta(days=(7 - first_monday.weekday()) % 7)

    schedule = []
    for week in range(12):
        base_weight = 80.0 + (week // 2) * 2.5
        for day_offset in [0, 2, 4]:
            session_dt = first_monday + timedelta(weeks=week, days=day_offset)
            if session_dt.date() >= today.date():
                continue
            # Vary reps: week 0-7 → 5, week 8-9 → 4 (fatigue), week 10+ → 5
            if week < 8:
                base_reps = 5
            elif week < 10:
                base_reps = 4
            else:
                base_reps = 5
            schedule.append(
                {
                    "dt": session_dt,
                    "weight": base_weight,
                    "sets": [
                        (
                            base_reps
                            if i < 2
                            else max(3, base_reps - (1 if week > 5 else 0))
                        )
                        for i in range(3)
                    ],
                }
            )
    return schedule


def delete_existing_seed_data() -> None:
    print("Deleting existing seed workouts…")
    existing = (
        db.table("workouts")
        .select("id, local_id")
        .eq("user_id", USER_ID)
        .ilike("name", f"%{SEED_MARKER}%")
        .execute()
    )
    workout_ids = [w["id"] for w in existing.data]
    local_ids = [w["local_id"] for w in existing.data]

    if not workout_ids:
        print("  No existing seed data found.")
        return

    ex_res = (
        db.table("workout_exercises")
        .select("id")
        .in_("workout_id", workout_ids)
        .execute()
    )
    ex_ids = [e["id"] for e in ex_res.data]

    if ex_ids:
        db.table("sets").delete().in_("workout_exercise_id", ex_ids).execute()
        db.table("workout_exercises").delete().in_("workout_id", workout_ids).execute()

    for lid in local_ids:
        db.table("workouts").delete().eq("local_id", lid).execute()

    print(f"  Deleted {len(workout_ids)} seed workouts.")


def seed() -> None:
    delete_existing_seed_data()

    sessions = build_sessions()
    print(f"Inserting {len(sessions)} sessions for user {USER_ID}…")

    for session in sessions:
        workout_local_id = str(uuid.uuid4())
        started = session["dt"].isoformat()
        finished = (session["dt"] + timedelta(minutes=45)).isoformat()

        w_res = (
            db.table("workouts")
            .insert(
                {
                    "local_id": workout_local_id,
                    "user_id": USER_ID,
                    "name": f"{EXERCISE_NAME} {SEED_MARKER}",
                    "started_at": started,
                    "finished_at": finished,
                }
            )
            .execute()
        )
        workout_db_id = w_res.data[0]["id"]

        ex_local_id = str(uuid.uuid4())
        ex_res = (
            db.table("workout_exercises")
            .insert(
                {
                    "local_id": ex_local_id,
                    "workout_id": workout_db_id,
                    "exercise_name": EXERCISE_NAME,
                    "order_index": 0,
                }
            )
            .execute()
        )
        ex_db_id = ex_res.data[0]["id"]

        sets_data = [
            {
                "local_id": str(uuid.uuid4()),
                "workout_exercise_id": ex_db_id,
                "set_number": i + 1,
                "reps": reps,
                "weight_kg": session["weight"],
            }
            for i, reps in enumerate(session["sets"])
        ]
        db.table("sets").insert(sets_data).execute()

        date_str = session["dt"].strftime("%Y-%m-%d")
        max_1rm = max(epley_1rm(session["weight"], r) for r in session["sets"])
        w = session["weight"]
        s = session["sets"]
        print(f"  {date_str}  {w}kg × {s}  1RM≈{max_1rm:.1f}")

    print(f"\nDone. {len(sessions)} sessions seeded.")


if __name__ == "__main__":
    seed()
