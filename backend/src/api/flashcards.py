from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import get_current_user
from src.core.database import db
from src.models.flashcard import FlashcardDue, ReviewRequest, ReviewResponse

router = APIRouter(prefix="/flashcards", tags=["Cognitive Module"])

# Leitner box → review interval in days
_INTERVALS: dict[int, int] = {1: 1, 2: 2, 3: 4, 4: 7, 5: 14}
_MAX_BOX = 5


def _next_review(box: int, correct: bool) -> tuple[int, datetime]:
    new_box = min(box + 1, _MAX_BOX) if correct else 1
    next_at = datetime.now(timezone.utc) + timedelta(days=_INTERVALS[new_box])
    return new_box, next_at


@router.get("/due", response_model=list[FlashcardDue])
async def get_due_flashcards(
    user_id: str = Depends(get_current_user),
    document_id: str | None = Query(default=None),
):
    """Return flashcards due for review. Optionally filter by document_id."""
    now = datetime.now(timezone.utc).isoformat()
    try:
        query = (
            db.table("flashcards")
            .select("id, document_id, front, back, box, next_review_at")
            .eq("user_id", user_id)
            .lte("next_review_at", now)
            .order("next_review_at")
        )
        if document_id:
            query = query.eq("document_id", document_id)
        res = query.execute()
        return res.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch due flashcards: {str(e)}",
        ) from e


@router.post("/{flashcard_id}/review", response_model=ReviewResponse)
async def review_flashcard(
    flashcard_id: str,
    body: ReviewRequest,
    user_id: str = Depends(get_current_user),
):
    """Apply a Leitner review: advance box on correct, reset to box 1 on incorrect."""
    try:
        existing = (
            db.table("flashcards")
            .select("id, user_id, box")
            .eq("id", flashcard_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found."
        ) from e

    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    current_box: int = existing.data["box"]
    new_box, next_at = _next_review(current_box, body.correct)

    try:
        res = (
            db.table("flashcards")
            .update(
                {
                    "box": new_box,
                    "next_review_at": next_at.isoformat(),
                    "last_reviewed_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("id", flashcard_id)
            .execute()
        )
        updated = res.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update flashcard: {str(e)}",
        ) from e

    return ReviewResponse(
        id=updated["id"],
        box=updated["box"],
        next_review_at=updated["next_review_at"],
    )
