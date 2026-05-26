from datetime import datetime

from pydantic import BaseModel


class FlashcardDue(BaseModel):
    id: str
    document_id: str
    front: str
    back: str
    box: int
    next_review_at: datetime


class FlashcardUpdate(BaseModel):
    front: str | None = None
    back: str | None = None


class ReviewRequest(BaseModel):
    correct: bool


class ReviewResponse(BaseModel):
    id: str
    box: int
    next_review_at: datetime
