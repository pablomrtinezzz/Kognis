import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_current_user
from src.core.database import db
from src.models.analytics import DailyOneRM, ProgressionOption, ProgressionResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _round_weight(kg: float, nearest: float = 1.25) -> float:
    return round(kg / nearest) * nearest


def _escape_ilike(value: str) -> str:
    """Escape backslash, percent, and underscore so user input is treated as a literal string in ilike."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/progression/{exercise_name}", response_model=ProgressionResponse)
async def get_progression(
    exercise_name: str,
    user_id: str = Depends(get_current_user),
):
    """
    Returns historical 1RM (Epley) + EWMA trend for a given exercise,
    plus two progressive-overload suggestions for the next session.

    Multi-query strategy: workouts → workout_exercises (ilike) → sets.
    Avoids complex PostgREST nested joins.
    """
    # 1. All workouts for this user
    workouts_res = (
        db.table("workouts").select("id, started_at").eq("user_id", user_id).execute()
    )
    if not workouts_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No workouts found"
        )

    workout_map: dict[str, str] = {w["id"]: w["started_at"] for w in workouts_res.data}
    workout_ids = list(workout_map.keys())

    # 2. Exercises matching the name (case-insensitive exact)
    ex_res = (
        db.table("workout_exercises")
        .select("id, workout_id")
        .in_("workout_id", workout_ids)
        .ilike("exercise_name", _escape_ilike(exercise_name))
        .execute()
    )
    if not ex_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No data found for exercise: {exercise_name}",
        )

    exercise_map: dict[str, str] = {e["id"]: e["workout_id"] for e in ex_res.data}
    exercise_ids = list(exercise_map.keys())

    # 3. All sets for those exercises
    sets_res = (
        db.table("sets")
        .select("workout_exercise_id, reps, weight_kg")
        .in_("workout_exercise_id", exercise_ids)
        .execute()
    )
    if not sets_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No sets found for exercise: {exercise_name}",
        )

    # 4. Build per-day max 1RM using Epley: 1RM = weight × (1 + reps/30)
    # daily_best[date] = {"one_rm": float, "reps": int, "weight_kg": float}
    daily_best: dict[str, dict] = {}
    for s in sets_res.data:
        reps = s.get("reps")
        weight = s.get("weight_kg")
        if not reps or not weight:
            continue
        workout_id = exercise_map[s["workout_exercise_id"]]
        date = workout_map[workout_id][:10]  # YYYY-MM-DD
        one_rm = weight * (1 + reps / 30)
        if date not in daily_best or daily_best[date]["one_rm"] < one_rm:
            daily_best[date] = {"one_rm": one_rm, "reps": reps, "weight_kg": weight}

    if not daily_best:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid sets (reps + weight) found for this exercise",
        )

    # 5. Sort chronologically and apply EWMA (span=5, adjust=False)
    sorted_dates = sorted(daily_best.keys())
    df = pd.DataFrame(
        [{"date": d, "one_rm": daily_best[d]["one_rm"]} for d in sorted_dates]
    )
    df["ewma"] = df["one_rm"].ewm(span=5, adjust=False).mean()

    history = [
        DailyOneRM(date=row["date"], one_rm=round(row["one_rm"], 2))
        for _, row in df.iterrows()
    ]

    # 6. Predict next session: last EWMA × 1.025 (2.5% progressive overload)
    last_ewma = float(df["ewma"].iloc[-1])
    predicted_1rm = last_ewma * 1.025

    last_date = sorted_dates[-1]
    last_reps = daily_best[last_date]["reps"]
    last_weight = daily_best[last_date]["weight_kg"]

    # Option A — same reps, more weight (inverse Epley, rounded to nearest 1.25 kg)
    weight_a = _round_weight(predicted_1rm / (1 + last_reps / 30))

    # Option B — same weight, more reps
    reps_b = round(30 * (predicted_1rm / last_weight - 1))
    reps_b = max(reps_b, last_reps + 1)

    options = [
        ProgressionOption(
            type="weight",
            reps=last_reps,
            weight_kg=weight_a,
            description=f"{weight_a} kg × {last_reps} reps",
        ),
        ProgressionOption(
            type="reps",
            reps=reps_b,
            weight_kg=last_weight,
            description=f"{last_weight} kg × {reps_b} reps",
        ),
    ]

    return ProgressionResponse(
        exercise_name=exercise_name,
        history=history,
        predicted_1rm=round(predicted_1rm, 2),
        options=options,
        last_reps=last_reps,
        last_weight_kg=last_weight,
    )
