from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    storage_path: str
    text_preview: str
    page_count: int
    created_at: datetime
    folder_id: Optional[str] = None


class ProcessResponse(BaseModel):
    document_id: str
    chunks_processed: int
    flashcards_generated: int
    summary_preview: str


class DocumentListItem(BaseModel):
    id: str
    file_name: str
    created_at: datetime
    flashcard_count: int
    due_count: int
    folder_id: Optional[str] = None


class DocumentSummary(BaseModel):
    document_id: str
    content: str
    created_at: datetime


class AbcTestItem(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_index: int
