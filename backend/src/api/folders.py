"""
Folder management endpoints for the Cognitive module.

Required Supabase migration (run once in SQL Editor):
    CREATE TABLE IF NOT EXISTS folders (
        id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        local_id  text UNIQUE NOT NULL,
        user_id   uuid NOT NULL,
        name      text NOT NULL,
        created_at timestamptz DEFAULT now()
    );
    ALTER TABLE documents
        ADD COLUMN IF NOT EXISTS folder_id uuid
        REFERENCES folders(id) ON DELETE SET NULL;
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_current_user
from src.core.database import db
from src.models.folder import FolderCreate, FolderRename, FolderResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/folders", tags=["Cognitive Module"])


@router.get("/", response_model=list[FolderResponse])
async def list_folders(user_id: str = Depends(get_current_user)):
    """Return all folders owned by the authenticated user, oldest first."""
    try:
        res = (
            db.table("folders")
            .select("id, local_id, user_id, name, created_at")
            .eq("user_id", user_id)
            .order("created_at")
            .execute()
        )
        return res.data
    except Exception as e:
        logger.error("Failed to list folders: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list folders: {str(e)}",
        ) from e


@router.post("/", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_in: FolderCreate,
    user_id: str = Depends(get_current_user),
):
    """
    Create or upsert a folder.  Idempotent: repeated calls with the same
    local_id are safe and return the existing row.
    """
    try:
        res = (
            db.table("folders")
            .upsert(
                {
                    "local_id": folder_in.local_id,
                    "user_id": user_id,
                    "name": folder_in.name.strip(),
                },
                on_conflict="local_id",
            )
            .execute()
        )
        return res.data[0]
    except Exception as e:
        logger.error("Failed to create folder: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create folder: {str(e)}",
        ) from e


@router.patch("/{folder_id}", response_model=FolderResponse)
async def rename_folder(
    folder_id: str,
    body: FolderRename,
    user_id: str = Depends(get_current_user),
):
    """Rename a folder. Verifies ownership before updating."""
    try:
        existing = (
            db.table("folders")
            .select("id, user_id")
            .eq("id", folder_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found."
        ) from e

    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    try:
        res = (
            db.table("folders")
            .update({"name": body.name.strip()})
            .eq("id", folder_id)
            .execute()
        )
        return res.data[0]
    except Exception as e:
        logger.error("Failed to rename folder: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rename folder: {str(e)}",
        ) from e


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Delete a folder. Documents whose folder_id matched are SET NULL
    (handled by the FK constraint), so no document data is lost.
    """
    try:
        existing = (
            db.table("folders")
            .select("id, user_id")
            .eq("id", folder_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found."
        ) from e

    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    try:
        db.table("folders").delete().eq("id", folder_id).execute()
    except Exception as e:
        logger.error("Failed to delete folder: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete folder: {str(e)}",
        ) from e
