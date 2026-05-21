from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_current_user
from src.core.database import db
from src.models.goal import GoalCreate, GoalResponse, GoalUpdate

router = APIRouter(prefix="/goals", tags=["Gamification & Goals"])


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(goal_in: GoalCreate, user_id: str = Depends(get_current_user)):
    """Creates a new goal for the authenticated user."""
    # mode='json' serializes date → ISO string for Supabase compatibility
    data = goal_in.model_dump(mode="json")
    data["user_id"] = user_id
    data["streak"] = 0  # Initial streak is always 0

    try:
        response = db.table("goals").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create goal: {str(e)}",
        ) from e


@router.get("/", response_model=list[GoalResponse])
async def get_user_goals(user_id: str = Depends(get_current_user)):
    """Retrieves all goals for the authenticated user."""
    try:
        response = db.table("goals").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch goals: {str(e)}",
        ) from e


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal_progress(
    goal_id: str, goal_update: GoalUpdate, user_id: str = Depends(get_current_user)
):
    """Updates the progress (current_value) of a specific goal."""
    try:
        response = (
            db.table("goals")
            .update({"current_value": goal_update.current_value})
            .eq("id", goal_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Goal not found")
        return response.data[0]
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update goal: {str(e)}",
        ) from e


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(goal_id: str, user_id: str = Depends(get_current_user)):
    """Deletes a specific goal owned by the authenticated user."""
    try:
        response = (
            db.table("goals")
            .delete()
            .eq("id", goal_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Goal not found")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete goal: {str(e)}",
        ) from e
