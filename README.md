# 💬 WhatsApp Clone

A real-time chat application inspired by WhatsApp, built with **Next.js 14** (frontend) and **FastAPI** (Python backend). Supports authentication, individual DMs, and a shared General group chat for all users.

---

## 📁 Project Structure

```
whatsapp-clone/
├── backend/               # Python FastAPI API + WebSocket server
│   ├── main.py            # App entry point, CORS, router registration
│   ├── requirements.txt   # Python dependencies
│   ├── .env.example       # Environment variable template
│   ├── core/
│   │   ├── config.py      # App settings (loaded from .env)
│   │   ├── security.py    # JWT creation/verification, bcrypt helpers
│   │   └── dependencies.py# FastAPI Depends() for auth guard
│   ├── routers/
│   │   ├── auth.py        # POST /api/auth/login, /register, /logout
│   │   ├── users.py       # GET /api/users/me, /api/users/
│   │   ├── messages.py    # GET/POST /api/messages/chats/...
│   │   └── websocket.py   # WS /ws/{chat_id} — real-time broadcasting
│   ├── schemas/
│   │   └── schemas.py     # Pydantic request/response models
│   └── models/            # 📂 Empty — add your ORM models here
│
└── frontend/              # Next.js 14 App Router + TypeScript + Tailwind
    ├── next.config.js
    ├── tailwind.config.js
    ├── package.json
    ├── .env.local.example
    └── src/
        ├── app/
        │   ├── layout.tsx       # Root HTML layout
        │   ├── page.tsx         # Redirects → /login or /chat
        │   ├── globals.css      # Tailwind base + global styles
        │   ├── login/
        │   │   └── page.tsx     # Login + Register form
        │   └── chat/
        │       └── page.tsx     # Main chat UI (sidebar + window)
        ├── components/
        │   └── chat/
        │       ├── ChatSidebar.tsx  # Left panel: chat list
        │       └── ChatWindow.tsx   # Right panel: messages + input
        ├── hooks/
        │   └── useChatSocket.ts # WebSocket hook (connect / send / receive)
        ├── lib/
        │   └── api.ts           # Axios client + auth/users/chats helpers
        └── types/
            └── index.ts         # Shared TypeScript interfaces
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm / yarn / pnpm | latest |

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/whatsapp-clone.git
cd whatsapp-clone
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and set a strong SECRET_KEY
```

**Start the backend:**

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

---

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# (values point to localhost:8000 by default — no changes needed for local dev)
```

**Start the frontend:**

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

---

## 🌐 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Get JWT token |
| POST | `/api/auth/logout` | Client-side token removal |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/me` | Get current user profile |
| GET | `/api/users/` | List all users |
| GET | `/api/users/{id}` | Get user by ID |

### Messages & Chats
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages/chats` | List current user's chats |
| GET | `/api/messages/chats/{chat_id}` | Get messages (paginated) |
| POST | `/api/messages/chats/{chat_id}` | Send a message |
| POST | `/api/messages/chats/dm/{user_id}` | Create/open a DM |

### WebSocket
```
ws://localhost:8000/ws/{chat_id}?token=<JWT>
```
- Send: `{ "content": "Hello!" }`
- Receive: `{ "type": "message"|"system", "sender": "...", "content": "...", "timestamp": "..." }`

The **General** chat has `chat_id = "general"` and is visible to all users.

---

## 🗄️ Database Integration (Your Part)

The routers contain `TODO` comments marking every place that needs database logic. The stubs are intentionally simple so you can plug in any DB.

### Recommended Stack Options

#### Option A — PostgreSQL + SQLAlchemy (SQL, relational)
Best for: structured data, ACID transactions, complex queries.

```bash
pip install sqlalchemy psycopg2-binary alembic
```

```
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp
```

Suggested schema:
- `users` — id, username, email, password_hash, display_name, avatar_url, created_at
- `chats` — id, name, is_group, created_at
- `chat_participants` — chat_id, user_id (many-to-many)
- `messages` — id, chat_id, sender_id, content, created_at

#### Option B — MongoDB + Motor (NoSQL, async)
Best for: flexible schemas, embedded documents, rapid iteration.

```bash
pip install motor
```

Collections: `users`, `chats`, `messages`

#### Option C — SQLite (development only)
Zero-config, already in `requirements.txt` comment. Perfect for quick local testing.

```
DATABASE_URL=sqlite:///./whatsapp.db
```

---

## ⚡ Concurrency & Real-Time (Your Part)

The WebSocket `ConnectionManager` in `backend/routers/websocket.py` handles in-memory broadcasting within a single server process. For production scale consider:

### Redis Pub/Sub (Recommended for multi-process)
When you run multiple Uvicorn workers, each process has its own `ConnectionManager`. Use Redis as a message bus:

```bash
pip install redis
```

Flow:
1. Worker A receives a message → publishes to Redis channel `chat:{chat_id}`
2. All workers subscribe → each broadcasts to their own local connections

### Celery (Background tasks)
For heavy work like sending email notifications, resizing avatars, or processing file uploads.

```bash
pip install celery redis
```

### Token Blacklist (Logout)
Store invalidated JWTs in Redis with TTL equal to the token expiry:

```python
redis_client.setex(f"blacklist:{token}", expire_seconds, "1")
```

---

## 🔒 Security Checklist (Before deploying)

- [ ] Change `SECRET_KEY` to a cryptographically random value (`openssl rand -hex 32`)
- [ ] Set `DATABASE_URL` to a real database (not SQLite)
- [ ] Add rate limiting (e.g. `slowapi`)
- [ ] Restrict CORS `allow_origins` to your actual frontend domain
- [ ] Store passwords with bcrypt (already done via `passlib`)
- [ ] Use HTTPS in production (reverse proxy: Nginx or Caddy)
- [ ] Validate and sanitize all inputs
- [ ] Implement refresh tokens for long-lived sessions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Real-time | WebSocket (native browser API) |
| Backend | Python 3.11, FastAPI |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Config | pydantic-settings |
| ASGI Server | Uvicorn |

---

## 📌 Next Steps

1. **Wire up the database** — replace all `# TODO` stubs in the routers with real ORM calls
2. **Add file/image messages** — store uploads in S3 or a local volume
3. **Online presence** — track connected users in Redis, broadcast status changes
4. **Message read receipts** — add `read_at` timestamp to messages
5. **Push notifications** — integrate Firebase Cloud Messaging (FCM)
6. **Dockerize** — add `Dockerfile` + `docker-compose.yml` for easy deployment

---

## 📄 License

MIT — free to use for academic and personal projects.
