import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

import fitz  # PyMuPDF
from fastapi import APIRouter, Depends, Form, HTTPException, Query, UploadFile, status

from src.api.deps import get_current_user
from src.core.database import db
from src.models.document import (
    AbcTestItem,
    DocumentListItem,
    DocumentSummary,
    DocumentUploadResponse,
    ProcessResponse,
)
from src.services.gemini_service import analyze_chunk, embed_text
from src.utils.text_processor import chunk_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Cognitive Module"])

_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
_TEXT_PREVIEW_LENGTH = 500


# ── List ─────────────────────────────────────────────────────────────────────


@router.get("/", response_model=list[DocumentListItem])
async def list_documents(
    user_id: str = Depends(get_current_user),
    folder_id: Optional[str] = Query(
        default=None,
        description="Filter by server-side folder UUID. Omit to return all documents.",
    ),
):
    """List documents for the current user with per-document flashcard counts."""
    try:
        query = (
            db.table("documents")
            .select("id, file_name, created_at, folder_id")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
        )
        if folder_id is not None:
            query = query.eq("folder_id", folder_id)
        docs_res = query.execute()
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
            folder_id=d.get("folder_id"),
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
    folder_id: Optional[str] = Form(
        default=None,
        description="Server folder UUID to assign the document to on upload.",
    ),
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

    record: dict = {
        "user_id": user_id,
        "file_name": file.filename,
        "storage_path": storage_filename,
        "raw_text": raw_text,
    }
    if folder_id is not None:
        record["folder_id"] = folder_id

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
        folder_id=saved.get("folder_id"),
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
    Full AI pipeline for a document:
      1. Semantic chunking of raw text.
      2. Concurrent embedding of all chunks via text-embedding-004.
      3. Insert chunks + embeddings into document_chunks.
      4. Concurrent LLM analysis (summary, flashcards, ABC tests) per chunk.
      5. Persist merged summary, flashcards, and ABC tests.

    Idempotent: existing document_chunks, abc_tests, flashcards, and
    document_summaries are replaced atomically (snapshot-then-delete).
    """
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

    # ── 1. Chunk ──────────────────────────────────────────────────────────────

    chunks = chunk_text(raw_text)

    # ── Snapshot old IDs for idempotent cleanup ───────────────────────────────

    old_chunk_ids = [
        r["id"]
        for r in db.table("document_chunks")
        .select("id")
        .eq("document_id", document_id)
        .execute()
        .data
    ]
    old_abc_ids = [
        r["id"]
        for r in db.table("abc_tests")
        .select("id")
        .eq("document_id", document_id)
        .execute()
        .data
    ]
    old_flashcard_ids = [
        r["id"]
        for r in db.table("flashcards")
        .select("id")
        .eq("document_id", document_id)
        .execute()
        .data
    ]
    old_summary_ids = [
        r["id"]
        for r in db.table("document_summaries")
        .select("id")
        .eq("document_id", document_id)
        .execute()
        .data
    ]

    # ── 2. Concurrent embeddings ──────────────────────────────────────────────

    raw_embeddings = await asyncio.gather(
        *[embed_text(chunk) for chunk in chunks],
        return_exceptions=True,
    )

    embeddings: list[list[float]] = []
    for i, result in enumerate(raw_embeddings):
        if isinstance(result, Exception):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Embedding failed on chunk {i + 1}: {str(result)}",
            )
        embeddings.append(result)

    # ── 3. Insert document_chunks ─────────────────────────────────────────────

    chunk_rows = [
        {
            "document_id": document_id,
            "user_id": user_id,
            "chunk_index": i,
            "content": chunk,
            # PostgREST cannot cast a JSON array to vector automatically;
            # send it as the text literal that pgvector's input parser expects.
            "embedding": "[" + ",".join(str(v) for v in embedding) + "]",
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings, strict=True))
    ]

    try:
        db.table("document_chunks").insert(chunk_rows).execute()
    except Exception as e:
        logger.error("document_chunks insert failed — %r", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save document chunks: {repr(e)}",
        ) from e

    # ── 4. Concurrent LLM analysis ────────────────────────────────────────────

    raw_analyses = await asyncio.gather(
        *[analyze_chunk(chunk) for chunk in chunks],
        return_exceptions=True,
    )

    analyses = []
    for i, result in enumerate(raw_analyses):
        if isinstance(result, Exception):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Gemini analysis failed on chunk {i + 1}: {str(result)}",
            )
        analyses.append(result)

    # ── 5. Persist merged results ─────────────────────────────────────────────

    combined_summary = "\n\n".join(r.summary for r in analyses)
    combined_flashcards = [fc for r in analyses for fc in r.flashcards]
    combined_abc_tests = [t for r in analyses for t in r.abc_tests]

    logger.info(
        "document %s — chunks=%d flashcards=%d abc_tests=%d",
        document_id,
        len(analyses),
        len(combined_flashcards),
        len(combined_abc_tests),
    )

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

    if combined_flashcards:
        flashcard_rows = [
            {
                "document_id": document_id,
                "user_id": user_id,
                "front": fc.front,
                "back": fc.back,
            }
            for fc in combined_flashcards
        ]
        try:
            db.table("flashcards").insert(flashcard_rows).execute()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save flashcards: {str(e)}",
            ) from e

    if combined_abc_tests:
        abc_rows = [
            {
                "document_id": document_id,
                "user_id": user_id,
                "question": t.question,
                "options": t.options,
                "correct_index": t.correct_index,
            }
            for t in combined_abc_tests
        ]
        try:
            db.table("abc_tests").insert(abc_rows).execute()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save ABC tests: {str(e)}",
            ) from e

    # ── Delete superseded records ─────────────────────────────────────────────

    if old_chunk_ids:
        db.table("document_chunks").delete().in_("id", old_chunk_ids).execute()
    if old_abc_ids:
        db.table("abc_tests").delete().in_("id", old_abc_ids).execute()
    if old_flashcard_ids:
        db.table("flashcards").delete().in_("id", old_flashcard_ids).execute()
    if old_summary_ids:
        db.table("document_summaries").delete().in_("id", old_summary_ids).execute()

    return ProcessResponse(
        document_id=document_id,
        chunks_processed=len(chunks),
        flashcards_generated=len(combined_flashcards),
        summary_preview=combined_summary[:_TEXT_PREVIEW_LENGTH],
    )


# ── Summary ───────────────────────────────────────────────────────────────────


@router.get("/{document_id}/summary", response_model=DocumentSummary)
async def get_document_summary(
    document_id: str,
    user_id: str = Depends(get_current_user),
):
    """Return the AI-generated summary for a document."""
    try:
        doc_res = (
            db.table("documents")
            .select("id, user_id")
            .eq("id", document_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
        ) from e

    if doc_res.data["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    try:
        res = (
            db.table("document_summaries")
            .select("document_id, content, created_at")
            .eq("document_id", document_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No summary found for this document.",
        )

    return res.data[0]


# ── Delete ────────────────────────────────────────────────────────────────────


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    user_id: str = Depends(get_current_user),
):
    """Cascade-delete a document and all associated data from storage."""
    try:
        doc_res = (
            db.table("documents")
            .select("id, user_id, storage_path")
            .eq("id", document_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
        ) from e

    doc = doc_res.data
    if doc["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    try:
        db.table("document_chunks").delete().eq("document_id", document_id).execute()
        db.table("abc_tests").delete().eq("document_id", document_id).execute()
        db.table("flashcards").delete().eq("document_id", document_id).execute()
        db.table("document_summaries").delete().eq("document_id", document_id).execute()
        db.table("documents").delete().eq("id", document_id).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}",
        ) from e

    if doc.get("storage_path"):
        try:
            db.storage.from_("documents").remove([doc["storage_path"]])
        except Exception:
            pass


# ── ABC Tests ─────────────────────────────────────────────────────────────────


@router.get(
    "/{document_id}/abc-tests",
    response_model=list[AbcTestItem],
    status_code=status.HTTP_200_OK,
)
async def get_abc_tests(
    document_id: str,
    user_id: str = Depends(get_current_user),
):
    """Return AI-generated multiple-choice tests for a document."""
    try:
        doc_res = (
            db.table("documents")
            .select("id, user_id")
            .eq("id", document_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
        ) from e

    if doc_res.data["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    try:
        res = (
            db.table("abc_tests")
            .select("id, question, options, correct_index")
            .eq("document_id", document_id)
            .order("created_at")
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e

    return res.data
