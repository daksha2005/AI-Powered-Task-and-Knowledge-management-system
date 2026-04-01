from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.task import TaskStatus

# ── Auth ────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str

# ── Role ─────────────────────────────────────────────────────────────────────
class RoleOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

# ── User ─────────────────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: RoleOut
    created_at: datetime
    model_config = {"from_attributes": True}

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"   # "admin" | "user"

# ── Task ─────────────────────────────────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None

class TaskUpdate(BaseModel):
    status: TaskStatus

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    assigned_to: Optional[int]
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    model_config = {"from_attributes": True}

# ── Document ──────────────────────────────────────────────────────────────────
class DocumentOut(BaseModel):
    id: int
    title: str
    filename: str
    uploaded_by: int
    created_at: datetime
    model_config = {"from_attributes": True}

# ── Search ────────────────────────────────────────────────────────────────────
class SearchResult(BaseModel):
    document_id: int
    title: str
    snippet: str
    score: float

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]

# ── Analytics ─────────────────────────────────────────────────────────────────
class AnalyticsOut(BaseModel):
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    total_documents: int
    total_users: int
    top_searches: List[dict]
