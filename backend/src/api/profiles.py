from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from src.api.deps import get_current_user
from src.core.database import db
from src.models.profile import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.put("/me", response_model=ProfileResponse)
async def upsert_profile(
    profile_data: ProfileUpdate,
    user_id: str = Depends(get_current_user),
):
    """
    Creates or updates the current user's profile information.
    The user_id is securely extracted from the JWT token.
    """
    data = profile_data.model_dump(exclude_unset=True)
    data["id"] = user_id  # Force the ID to match the authenticated user

    try:
        # Upsert: Insert if not exists, update if exists
        response = db.table("profiles").upsert(data).execute()
        if not response.data:
            raise ValueError("Failed to upsert profile in database")
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}",
        ) from e


@router.get("/export")
async def export_user_data(user_id: str = Depends(get_current_user)):
    """
    Exports all core user data (profiles, workouts, goals) in JSON format.
    Provides users with complete ownership of their data.
    """
    try:
        # Fetch data concurrently from multiple tables for this specific user
        profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
        workouts_res = db.table("workouts").select("*").eq("user_id", user_id).execute()
        goals_res = db.table("goals").select("*").eq("user_id", user_id).execute()

        export_data = {
            "profile": profile_res.data[0] if profile_res.data else {},
            "workouts": workouts_res.data,
            "goals": goals_res.data,
        }

        return JSONResponse(content=export_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data export failed: {str(e)}",
        ) from e
