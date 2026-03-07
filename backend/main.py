from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
import models.models # Para que SQLAlchemy registre tablas

from routers import auth, messages, users

app = FastAPI(title="WhatsApp Clone API")

# Configuración de CORS para permitir al frontend conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrando las rutas nuevas
app.include_router(auth.router)
app.include_router(messages.router)
app.include_router(users.router)

@app.on_event("startup")
async def startup_event():
    try:
        # Crea tablas si no existen
        Base.metadata.create_all(bind=engine)
        with engine.connect():
            print("🟢 ¡CONECTADO A POSTGRESQL Y TABLAS CREADAS/VERIFICADAS CON ÉXITO! 🟢")
    except Exception as e:
        print(f"🔴 ERROR AL CONECTAR A POSTGRESQL: {str(e)} 🔴")