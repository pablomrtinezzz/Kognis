from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# ─── Request schemas (Client → API) ──────────────────────────────────────────


class SetCreate(BaseModel):
    local_id: str
    set_number: int = Field(..., ge=1)
    reps: Optional[int] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    rpe: Optional[float] = Field(None, ge=1, le=10)


class WorkoutExerciseCreate(BaseModel):
    local_id: str
    exercise_name: str = Field(..., min_length=1, max_length=100)
    order_index: int = Field(..., ge=0)
    sets: list[SetCreate] = Field(..., min_length=1)


class WorkoutCreate(BaseModel):
    local_id: str
    name: Optional[str] = Field(None, max_length=100)
    started_at: datetime
    finished_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)
    exercises: list[WorkoutExerciseCreate] = Field(..., min_length=1)


class WorkoutUpdate(BaseModel):
    """Same payload as WorkoutCreate but without local_id (taken from the URL path)."""

    name: Optional[str] = Field(None, max_length=100)
    started_at: datetime
    finished_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)
    exercises: list[WorkoutExerciseCreate] = Field(..., min_length=1)


# ─── Response schemas (API → Client) ─────────────────────────────────────────


class SetResponse(BaseModel):
    id: str
    local_id: str
    workout_exercise_id: str
    set_number: int
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    duration_seconds: Optional[int] = None
    rpe: Optional[float] = None


class WorkoutExerciseResponse(BaseModel):
    id: str
    local_id: str
    workout_id: str
    exercise_name: str
    order_index: int
    sets: list[SetResponse]


class WorkoutResponse(BaseModel):
    """Full nested response — returned after POST (create/sync)."""

    id: str
    local_id: str
    user_id: str
    name: Optional[str] = None
    started_at: str
    finished_at: Optional[str] = None
    notes: Optional[str] = None
    exercises: list[WorkoutExerciseResponse]
    created_at: str


class WorkoutSummary(BaseModel):
    """Flat response — returned in GET list (no nested exercises)."""

    id: str
    local_id: str
    user_id: str
    name: Optional[str] = None
    started_at: str
    finished_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
