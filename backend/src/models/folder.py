from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    """Payload for creating or upserting a folder."""

    local_id: str = Field(
        ...,
        description="Client-generated UUID used as idempotency key.",
    )
    name: str = Field(..., min_length=1, max_length=100)


class FolderRename(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class FolderResponse(BaseModel):
    id: str
    local_id: str
    user_id: str
    name: str
    created_at: str
