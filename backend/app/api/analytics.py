import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.task import Task, TaskStatus
from app.models.document import Document
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.schemas import AnalyticsOut
from app.core.security import require_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    total_tasks = db.query(func.count(Task.id)).scalar()
    pending = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.pending).scalar()
    in_progress = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.in_progress).scalar()
    completed = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.completed).scalar()
    total_docs = db.query(func.count(Document.id)).scalar()
    total_users = db.query(func.count(User.id)).scalar()

    # Top searched queries from activity logs
    search_logs = (
        db.query(ActivityLog.detail)
        .filter(ActivityLog.action == "search")
        .order_by(ActivityLog.created_at.desc())
        .limit(200)
        .all()
    )
    query_counts: dict = {}
    for (detail,) in search_logs:
        try:
            data = json.loads(detail or "{}")
            q = data.get("query", "").strip().lower()
            if q:
                query_counts[q] = query_counts.get(q, 0) + 1
        except Exception:
            pass

    top_searches = [
        {"query": k, "count": v}
        for k, v in sorted(query_counts.items(), key=lambda x: -x[1])[:10]
    ]

    return AnalyticsOut(
        total_tasks=total_tasks,
        pending_tasks=pending,
        in_progress_tasks=in_progress,
        completed_tasks=completed,
        total_documents=total_docs,
        total_users=total_users,
        top_searches=top_searches,
    )
