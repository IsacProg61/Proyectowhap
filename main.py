from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, messages, users, websocket

app = FastAPI(
    title="WhatsApp Clone API",
    description="Backend for WhatsApp-like chat application",
    version="1.0.0"
)

# CORS - allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,      prefix="/api/auth",     tags=["auth"])
app.include_router(users.router,     prefix="/api/users",    tags=["users"])
app.include_router(messages.router,  prefix="/api/messages", tags=["messages"])
app.include_router(websocket.router, prefix="/ws",           tags=["websocket"])


@app.get("/")
def root():
    return {"message": "WhatsApp Clone API is running 🚀"}
