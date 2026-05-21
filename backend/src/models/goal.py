from typing import Optional

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    """Schema for creating a new goal."""

    category: str = Field(
        ..., description="Category of the goal (e.g., 'workouts', 'study')"
    )
    target_value: float = Field(..., gt=0, description="The target number to reach")
    deadline: Optional[str] = Field(
        None, description="Optional deadline in YYYY-MM-DD format"
    )


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
    deadline: Optional[str]
    created_at: str
