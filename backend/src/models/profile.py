from typing import Optional

from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    """Schema for incoming profile data when creating or updating."""

    height: Optional[float] = Field(None, description="User's height in cm")
    weight: Optional[float] = Field(None, description="User's weight in kg")


class ProfileResponse(BaseModel):
    """Schema for outgoing profile data."""

    id: str
    height: Optional[float]
    weight: Optional[float]
    created_at: str
