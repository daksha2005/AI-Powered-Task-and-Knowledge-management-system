import os
import aiofiles
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.schemas import DocumentOut
from app.core.security import get_current_user, require_role
from app.core.config import settings
from app.services.embedding_service import embedding_service
from app.services.activity_service import log_activity

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_TYPES = {"text/plain", "application/pdf"}

@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only .txt and .pdf files are supported")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)

    # Save file
    async with aiofiles.open(file_path, "wb") as out_file:
        content_bytes = await file.read()
        await out_file.write(content_bytes)

    # Extract text
    if file.content_type == "text/plain":
        content_text = content_bytes.decode("utf-8", errors="ignore")
    else:
        # Basic PDF text extraction (no extra dependency required for txt-focused MVP)
        content_text = content_bytes.decode("latin-1", errors="ignore")

    doc = Document(
        title=title,
        filename=file.filename,
        file_path=file_path,
        content=content_text,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Index into FAISS
    embedding_service.add_document(doc.id, doc.title, content_text)

    log_activity(db, current_user.id, "document_upload", {"doc_id": doc.id, "title": title})
    return doc

@router.get("", response_model=List[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Document).order_by(Document.created_at.desc()).all()

@router.get("/{doc_id}", response_model=DocumentOut)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    embedding_service.remove_document(doc.id)
    db.delete(doc)
    db.commit()
