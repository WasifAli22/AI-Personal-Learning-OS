"""
Document upload and management API routes.
"""

import os
import uuid
import aiofiles
from fastapi import APIRouter, HTTPException, UploadFile, File, Header, Form
from typing import Optional, List

from app.models.schemas import DocumentUploadResponse, DocumentListItem
from app.services.supabase_service import get_supabase_service
from app.rag.pipeline import get_rag_pipeline
from app.config import get_settings

router = APIRouter(prefix="/documents", tags=["Documents"])


async def _get_user_id(authorization: str) -> str:
    """Extract user ID from auth token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    svc = get_supabase_service()
    user = await svc.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user["id"]


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    """Upload and process a document (PDF, TXT, DOCX)."""
    user_id = await _get_user_id(authorization)
    settings = get_settings()

    # Validate file type
    allowed = {".pdf", ".txt", ".docx", ".md"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    # Save file
    doc_id = str(uuid.uuid4())
    upload_dir = os.path.join(settings.upload_dir, user_id)
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{doc_id}{ext}")

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    # Process with RAG pipeline
    rag = get_rag_pipeline()
    try:
        if ext == ".pdf":
            chunk_count = await rag.process_pdf(file_path, user_id, doc_id)
        else:
            text_content = content.decode("utf-8", errors="ignore")
            chunk_count = await rag.process_text(text_content, user_id, doc_id, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    # Save metadata to Supabase
    svc = get_supabase_service()
    doc_type = ext.replace(".", "")
    doc_data = {
        "filename": file.filename,
        "doc_type": doc_type if doc_type != "md" else "txt",
        "chunk_count": chunk_count,
        "file_size": len(content)
    }

    try:
        saved = await svc.save_document(user_id, doc_data)
        return DocumentUploadResponse(
            id=saved.get("id", doc_id),
            filename=file.filename or "unknown",
            doc_type=doc_type,
            chunk_count=chunk_count,
            status="processed",
            created_at=saved.get("created_at", "")
        )
    except Exception as e:
        print(f"DB Save Error: {e}")
        # Still return success if RAG worked but DB save failed
        return DocumentUploadResponse(
            id=doc_id,
            filename=file.filename or "unknown",
            doc_type=doc_type,
            chunk_count=chunk_count,
            status="processed",
            created_at=""
        )


@router.get("/", response_model=List[DocumentListItem])
async def list_documents(authorization: Optional[str] = Header(None)):
    """Get all documents for current user."""
    user_id = await _get_user_id(authorization)
    svc = get_supabase_service()
    docs = await svc.get_documents(user_id)
    return [
        DocumentListItem(
            id=d.get("id", ""),
            filename=d.get("filename", ""),
            doc_type=d.get("doc_type", ""),
            chunk_count=d.get("chunk_count", 0),
            created_at=d.get("created_at", "")
        )
        for d in docs
    ]


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, authorization: Optional[str] = Header(None)):
    """Delete a document and its embeddings."""
    user_id = await _get_user_id(authorization)
    rag = get_rag_pipeline()
    await rag.delete_document(user_id, doc_id)
    return {"status": "deleted"}
