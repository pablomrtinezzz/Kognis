from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_current_user
from src.core.database import db
from src.models.workout import WorkoutCreate, WorkoutResponse, WorkoutSummary

router = APIRouter(prefix="/workouts", tags=["Physical Module"])


@router.post("/", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
async def create_workout(
    workout_in: WorkoutCreate,
    user_id: str = Depends(get_current_user),
):
    """
    Saves a complete workout session (exercises + sets) as a single atomic payload.

    Idempotent by design: repeated calls with the same local_id are safe.
    Requires UNIQUE constraints on local_id in the workouts, workout_exercises,
    and sets tables in Supabase.
    """
    # 1. Upsert the workout row
    workout_data = workout_in.model_dump(mode="json", exclude={"exercises"})
    workout_data["user_id"] = user_id

    try:
        workout_res = (
            db.table("workouts").upsert(workout_data, on_conflict="local_id").execute()
        )
        workout = workout_res.data[0]

        # 2. Upsert exercises and their sets
        exercises_out = []
        for ex_in in workout_in.exercises:
            ex_data = ex_in.model_dump(mode="json", exclude={"sets"})
            ex_data["workout_id"] = workout["id"]

            ex_res = (
                db.table("workout_exercises")
                .upsert(ex_data, on_conflict="local_id")
                .execute()
            )
            ex = ex_res.data[0]

            # Batch upsert all sets for this exercise in a single round-trip
            sets_data = [
                {**s.model_dump(mode="json"), "workout_exercise_id": ex["id"]}
                for s in ex_in.sets
            ]
            sets_res = (
                db.table("sets").upsert(sets_data, on_conflict="local_id").execute()
            )

            exercises_out.append({**ex, "sets": sets_res.data})

        return {**workout, "exercises": exercises_out}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save workout: {str(e)}",
        ) from e


@router.get("/", response_model=list[WorkoutSummary])
async def get_workouts(user_id: str = Depends(get_current_user)):
    """Returns all workout sessions for the authenticated user, newest first."""
    try:
        res = (
            db.table("workouts")
            .select("*")
            .eq("user_id", user_id)
            .order("started_at", desc=True)
            .execute()
        )
        return res.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch workouts: {str(e)}",
        ) from e
