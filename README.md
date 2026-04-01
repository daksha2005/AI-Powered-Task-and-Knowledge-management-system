# 🧠 KnowledgeAI — AI-Powered Task & Knowledge Management System

A full-stack MVP where admins build a knowledge base and users search it with AI, all within a task management workflow.

---

## 🗂️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11, FastAPI |
| **Database** | MySQL 8.0 (SQLAlchemy ORM) |
| **AI / Embeddings** | `sentence-transformers` — `all-MiniLM-L6-v2` (local, no API key) |
| **Vector DB** | FAISS (in-process, CPU) |
| **Auth** | JWT (`python-jose`) + bcrypt (`passlib`) |
| **Frontend** | React 18, React Router v6, Axios |
| **Containerisation** | Docker + Docker Compose |

---

## 🏗️ Project Structure

```
ai-task-system/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers (auth, tasks, documents, search, analytics, users)
│   │   ├── core/           # Config, JWT security, RBAC helpers
│   │   ├── db/             # SQLAlchemy engine, session, DB seeder
│   │   ├── models/         # ORM models (users, roles, tasks, documents, activity_logs)
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # EmbeddingService (FAISS), ActivityService
│   │   └── main.py         # FastAPI app, CORS, router registration
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/          # LoginPage, DashboardPage, TasksPage, DocumentsPage, SearchPage, AnalyticsPage
│   │   ├── components/     # Layout (sidebar)
│   │   ├── context/        # AuthContext (global auth state)
│   │   └── services/       # Axios API client
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

---

## ⚡ Setup — Local (Without Docker)

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0 running locally

### 1. Create the MySQL database

```sql
CREATE DATABASE ai_task_system;
```

### 2. Backend

```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env — DATABASE_URL is already set with your credentials:
#   DATABASE_URL=mysql+pymysql://root:Dakshu@2005@localhost:3306/ai_task_system

# Start server (auto-creates tables + seeds admin/user accounts on first run)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm start          # Opens http://localhost:3000
```

---

## 🐳 Setup — Docker Compose (Recommended)

```bash
# From the project root
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| User | user@example.com | user123 |

---

## 🗄️ Database Schema

```
roles          users           tasks              documents          activity_logs
─────────      ────────────    ───────────────    ───────────────    ──────────────────
id (PK)        id (PK)         id (PK)            id (PK)            id (PK)
name           name            title              title              user_id (FK→users)
               email           description        filename           action
               hashed_pw       status (enum)      file_path          detail (JSON)
               role_id (FK)    assigned_to (FK)   content (text)     created_at
               created_at      created_by (FK)    uploaded_by (FK)
                               created_at         created_at
                               updated_at
```

All foreign keys are enforced at the database level via SQLAlchemy relationships.

---

## 🤖 AI Implementation

The semantic search is **fully local** — no external API key is required.

### Pipeline

```
User query
    │
    ▼
SentenceTransformer('all-MiniLM-L6-v2')   ← runs locally on CPU
    │  384-dimensional embedding
    ▼
FAISS IndexFlatIP (cosine similarity)
    │  top-k nearest neighbours
    ▼
Metadata lookup → document chunks + scores
    │
    ▼
Ranked results returned to user
```

### Document Indexing

- On upload, documents are **chunked** (300 words, 50-word overlap)
- Each chunk is embedded and stored in the FAISS index
- Metadata (doc_id, title, chunk text) is persisted as JSON alongside the index
- On deletion, the index is rebuilt without the removed document

---

## 📡 API Reference

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/auth/login` | ✗ | Any | Login, returns JWT |
| POST | `/auth/register` | ✗ | Any | Register new user |
| GET | `/auth/me` | ✓ | Any | Current user info |
| GET | `/tasks` | ✓ | Any | List tasks (filterable: `?status=`, `?assigned_to=`) |
| POST | `/tasks` | ✓ | Admin | Create & assign task |
| PATCH | `/tasks/{id}/status` | ✓ | Any | Update task status |
| DELETE | `/tasks/{id}` | ✓ | Admin | Delete task |
| GET | `/documents` | ✓ | Any | List documents |
| POST | `/documents` | ✓ | Admin | Upload + index document |
| DELETE | `/documents/{id}` | ✓ | Admin | Delete + de-index document |
| GET | `/search?q=...` | ✓ | Any | Semantic search |
| GET | `/analytics` | ✓ | Admin | System metrics |
| GET | `/users` | ✓ | Admin | List all users |

---

## ✅ Requirements Checklist

- [x] JWT Authentication
- [x] RBAC (Admin / User roles enforced on every endpoint)
- [x] MySQL with proper PK/FK relationships (5 tables)
- [x] Document upload (.txt + .pdf)
- [x] Embedding-based semantic search (local, no LLM API)
- [x] FAISS vector store
- [x] Task management (create, assign, status update, delete)
- [x] Dynamic filtering API (`/tasks?status=&assigned_to=`)
- [x] Activity logging (login, task_update, document_upload, search)
- [x] Analytics endpoint (task stats, top searches)
- [x] React frontend with role-based UI
- [x] Swagger docs at `/docs`
- [x] Docker Compose for one-command setup

---

## 🖥️ Frontend Pages

| Page | Roles | Description |
|---|---|---|
| Login | All | JWT login with demo credentials hint |
| Dashboard | All | Stats overview + quick actions |
| Tasks | All | Full task list; admin can create/delete; users update status |
| Documents | All | Admin uploads; all users view indexed docs |
| AI Search | All | Natural language search with relevance scores |
| Analytics | Admin only | Task breakdown donut charts + top search bar chart |
