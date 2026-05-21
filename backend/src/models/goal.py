from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class GoalCreate(BaseModel):
    """Schema for creating a new goal."""

    category: str = Field(
        ..., description="Category of the goal (e.g., 'workouts', 'study')"
    )
    target_value: float = Field(..., gt=0, description="The target number to reach")
    deadline: Optional[date] = Field(
        None, description="Optional deadline in YYYY-MM-DD format"
    )

    @field_validator("deadline", mode="before")
    @classmethod
    def deadline_must_be_future(cls, v: object) -> object:
        if v is None:
            return v
        parsed = date.fromisoformat(str(v)) if not isinstance(v, date) else v
        if parsed < date.today():
            raise ValueError("deadline must be today or a future date")
        return parsed


class GoalUpdate(BaseModel):
    """Schema for updating progress on an existing goal."""

    current_value: float = Field(..., description="The current progress value")


class GoalResponse(BaseModel):
    """Schema for the outgoing goal data."""

    id: str
    user_id: str
    category: str
    target_value: float
    current_value: float
    streak: int
    deadline: Optional[date]
    created_at: str
