import uuid
from datetime import datetime, timezone

import fitz  # PyMuPDF
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from src.api.deps import get_current_user
from src.core.database import db
from src.models.document import (
    DocumentListItem,
    DocumentUploadResponse,
    ProcessResponse,
)
from src.services.gemini_service import analyze_chunk
from src.utils.text_processor import chunk_text

router = APIRouter(prefix="/documents", tags=["Cognitive Module"])

_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
_TEXT_PREVIEW_LENGTH = 500


# ── List ─────────────────────────────────────────────────────────────────────


@router.get("/", response_model=list[DocumentListItem])
async def list_documents(user_id: str = Depends(get_current_user)):
    """List all documents for the authenticated user with per-document flashcard counts."""
    try:
        docs_res = (
            db.table("documents")
            .select("id, file_name, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch documents: {str(e)}"
        ) from e

    if not docs_res.data:
        return []

    doc_ids = [d["id"] for d in docs_res.data]
    now = datetime.now(timezone.utc).isoformat()

    try:
        cards_res = (
            db.table("flashcards")
            .select("document_id, next_review_at")
            .in_("document_id", doc_ids)
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch flashcard counts: {str(e)}"
        ) from e

    total_by_doc: dict[str, int] = {}
    due_by_doc: dict[str, int] = {}
    for card in cards_res.data:
        doc_id = card["document_id"]
        total_by_doc[doc_id] = total_by_doc.get(doc_id, 0) + 1
        if card["next_review_at"] <= now:
            due_by_doc[doc_id] = due_by_doc.get(doc_id, 0) + 1

    return [
        DocumentListItem(
            id=d["id"],
            file_name=d["file_name"],
            created_at=d["created_at"],
            flashcard_count=total_by_doc.get(d["id"], 0),
            due_count=due_by_doc.get(d["id"], 0),
        )
        for d in docs_res.data
    ]


# ── Upload ────────────────────────────────────────────────────────────────────


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile,
    user_id: str = Depends(get_current_user),
):
    """Ingest a PDF: extract text in-memory, upload to Storage, persist metadata."""

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are accepted.",
        )

    contents = await file.read()

    if len(contents) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 20 MB limit.",
        )

    try:
        pdf_doc = fitz.open(stream=contents, filetype="pdf")
        raw_text = "".join(page.get_text() for page in pdf_doc)
        page_count = pdf_doc.page_count
        pdf_doc.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not parse PDF: {str(e)}",
        ) from e

    storage_filename = f"{user_id}/{uuid.uuid4()}.pdf"
    try:
        db.storage.from_("documents").upload(
            path=storage_filename,
            file=contents,
            file_options={"content-type": "application/pdf"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Storage upload failed: {str(e)}",
        ) from e

    record = {
        "user_id": user_id,
        "file_name": file.filename,
        "storage_path": storage_filename,
        "raw_text": raw_text,
    }
    try:
        res = db.table("documents").insert(record).execute()
        saved = res.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save document record: {str(e)}",
        ) from e

    return DocumentUploadResponse(
        id=saved["id"],
        user_id=saved["user_id"],
        file_name=saved["file_name"],
        storage_path=saved["storage_path"],
        text_preview=raw_text[:_TEXT_PREVIEW_LENGTH],
        page_count=page_count,
        created_at=saved["created_at"],
    )


# ── Process ───────────────────────────────────────────────────────────────────


@router.post(
    "/{document_id}/process",
    response_model=ProcessResponse,
    status_code=status.HTTP_200_OK,
)
async def process_document(
    document_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Chunk the document's raw text, run each chunk through Gemini,
    then persist the merged summary and flashcards.
    Calling this endpoint again replaces any previous results (idempotent).
    """

    # Fetch document and verify ownership
    try:
        doc_res = (
            db.table("documents")
            .select("id, user_id, raw_text")
            .eq("id", document_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        ) from e

    doc = doc_res.data
    if doc["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    raw_text: str = doc.get("raw_text") or ""
    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document has no extractable text to process.",
        )

    # Chunk and analyze
    chunks = chunk_text(raw_text)
    results = []
    for chunk in chunks:
        try:
            analysis = await analyze_chunk(chunk)
            results.append(analysis)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Gemini analysis failed on chunk {len(results) + 1}: {str(e)}",
            ) from e

    # Merge all chunk results into a single summary and flat flashcard list
    combined_summary = "\n\n".join(r.summary for r in results)
    combined_flashcards = [fc for r in results for fc in r.flashcards]

    # Replace previous processing results (idempotent re-run support)
    try:
        db.table("document_summaries").delete().eq("document_id", document_id).execute()
        db.table("flashcards").delete().eq("document_id", document_id).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear previous results: {str(e)}",
        ) from e

    # Persist summary
    try:
        db.table("document_summaries").insert(
            {
                "document_id": document_id,
                "user_id": user_id,
                "content": combined_summary,
            }
        ).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save summary: {str(e)}",
        ) from e

    # Persist flashcards
    if combined_flashcards:
        try:
            flashcard_rows = [
                {
                    "document_id": document_id,
                    "user_id": user_id,
                    "front": fc.front,
                    "back": fc.back,
                }
                for fc in combined_flashcards
            ]
            db.table("flashcards").insert(flashcard_rows).execute()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save flashcards: {str(e)}",
            ) from e

    return ProcessResponse(
        document_id=document_id,
        chunks_processed=len(chunks),
        flashcards_generated=len(combined_flashcards),
        summary_preview=combined_summary[:500],
    )
