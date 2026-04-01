from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.schemas import SearchResponse, SearchResult
from app.core.security import get_current_user
from app.services.embedding_service import embedding_service
from app.services.activity_service import log_activity

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=SearchResponse)
def semantic_search(
    q: str = Query(..., min_length=1, description="Search query"),
    top_k: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hits = embedding_service.search(q, top_k=top_k)

    results = []
    seen_docs = set()
    for meta, score in hits:
        doc_id = meta["doc_id"]
        # Deduplicate — show best chunk per document
        if doc_id in seen_docs:
            continue
        seen_docs.add(doc_id)
        snippet = meta["chunk"][:300] + ("…" if len(meta["chunk"]) > 300 else "")
        results.append(SearchResult(
            document_id=doc_id,
            title=meta["title"],
            snippet=snippet,
            score=round(score, 4),
        ))

    log_activity(db, current_user.id, "search", {"query": q, "results_count": len(results)})
    return SearchResponse(query=q, results=results)
