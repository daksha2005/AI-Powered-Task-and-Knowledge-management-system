from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.schemas import TaskCreate, TaskOut, TaskUpdate
from app.core.security import get_current_user, require_role
from app.services.activity_service import log_activity

router = APIRouter(prefix="/tasks", tags=["Tasks"])

# ── Admin: create task ────────────────────────────────────────────────────────
@router.post("", response_model=TaskOut, status_code=201)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    task = Task(**payload.model_dump(), created_by=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    log_activity(db, current_user.id, "task_create", {"task_id": task.id, "title": task.title})
    return task

# ── List tasks with dynamic filters ──────────────────────────────────────────
@router.get("", response_model=List[TaskOut])
def list_tasks(
    status: Optional[TaskStatus] = Query(None),
    assigned_to: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Task)
    # Non-admins see only their own tasks
    if current_user.role.name != "admin":
        q = q.filter(Task.assigned_to == current_user.id)
    if status:
        q = q.filter(Task.status == status)
    if assigned_to:
        q = q.filter(Task.assigned_to == assigned_to)
    return q.order_by(Task.created_at.desc()).all()

# ── Get single task ───────────────────────────────────────────────────────────
@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role.name != "admin" and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return task

# ── User: update task status ──────────────────────────────────────────────────
@router.patch("/{task_id}/status", response_model=TaskOut)
def update_task_status(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role.name != "admin" and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not your task")
    task.status = payload.status
    db.commit()
    db.refresh(task)
    log_activity(db, current_user.id, "task_update", {"task_id": task_id, "new_status": payload.status})
    return task

# ── Admin: delete task ────────────────────────────────────────────────────────
@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
