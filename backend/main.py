from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict
from jose import jwt, JWTError
import concurrent.futures
import multiprocessing
import os
from datetime import datetime, timezone
import asyncio

from core.database import engine, Base, get_db
from models.models import User, Chat, chat_participants, Message
from schemas.schemas import UserCreate, UserResponse, UserLogin, Token, GroupChatCreate, MessageResponse
from core.security import get_password_hash, verify_password, create_access_token, ALGORITHM
from core.config import settings

# Constante para el chat protegido
GLOBAL_CHAT_NAME = "Chat Global"

# ==========================================
# CONFIGURACIÓN DE POOLS NATIVOS
# ==========================================
# Pool de Hilos para operaciones de I/O o aquellas que liberan el GIL (ej. Bcrypt hashing)
thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=10)
# Pool de Procesos para tareas CPU-bound estrictas (sortea el GIL)
process_pool = concurrent.futures.ProcessPoolExecutor(max_workers=max(1, multiprocessing.cpu_count() - 1))

app = FastAPI(title="WhatsApp Clone API (Monolítico + Concurrencia Nativa)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Verifica y extrae el usuario actual basado en el JWT de la solicitud."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_user_ws(token: str, db: Session):
    """Dependencia manual para extraer el usuario desde los query parameters en un WebSocket."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    return db.query(User).filter(User.id == user_id).first()

# ==========================================
# GESTOR DE CONEXIONES WEBSOCKET
# ==========================================
class ConnectionManager:
    def __init__(self):
        # Mapea un chat_id a una lista de WebSockets activos
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, ws: WebSocket, chat_id: str):
        await ws.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = []
        self.active_connections[chat_id].append(ws)

    def disconnect(self, ws: WebSocket, chat_id: str):
        if chat_id in self.active_connections:
            self.active_connections[chat_id].remove(ws)
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]

    async def broadcast_to_chat(self, chat_id: str, message_data: dict):
        if chat_id in self.active_connections:
            for connection in self.active_connections[chat_id]:
                # Enviamos el JSON armado nativo y rápido al cliente
                await connection.send_json(message_data)

manager = ConnectionManager()

@app.on_event("startup")
def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
        with next(get_db()) as db:
            print("🟢 ¡CONECTADO A POSTGRESQL Y TABLAS CREADAS/VERIFICADAS CON ÉXITO! 🟢")
            
            # --- CHAT GLOBAL LOGIC ---
            # Crear "Chat Global" si no existe
            chat_global = db.query(Chat).filter(Chat.name == GLOBAL_CHAT_NAME).first()
            if not chat_global:
                chat_global = Chat(name=GLOBAL_CHAT_NAME, is_group=True)
                db.add(chat_global)
                db.commit()
                db.refresh(chat_global)
                print("🌍 Chat Global inicializado con éxito.")
                
            # Agregar a todos los usuarios existentes al chat global
            usuarios = db.query(User).all()
            nuevos_integrantes = 0
            # Solo añadir a los que no están
            integrantes_actuales = [str(p.id) for p in chat_global.participants]
            for usuario in usuarios:
                if str(usuario.id) not in integrantes_actuales:
                    chat_global.participants.append(usuario)
                    nuevos_integrantes += 1
            if nuevos_integrantes > 0:
                db.commit()
                print(f"🌍 {nuevos_integrantes} usuarios añadidos al Chat Global automáticamente.")
                
    except Exception as e:
        print(f"🔴 ERROR AL CONECTAR A POSTGRESQL: {str(e)} 🔴")

@app.on_event("shutdown")
def shutdown_event():
    # Limpieza de recursos de hilos y procesos al apagar
    thread_pool.shutdown(wait=True)
    process_pool.shutdown(wait=True)

# ==========================================
# ENDPOINTS DE AUTENTICACIÓN
# ==========================================

@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Crea una nueva cuenta de usuario validando que el email o el username no existan."""
    if db.query(User).filter(or_(User.email == user_in.email, User.username == user_in.username)).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email o usuario ya está registrado.")
    
    # Offload de la tarea de hashing (que es bloqueante) a un hilo del pool nativo
    future = thread_pool.submit(get_password_hash, user_in.password)
    hashed_password = future.result()
    
    nuevo_usuario = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        display_name=user_in.display_name,
        avatar_url=user_in.avatar_url
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    # Auto-añadir al Chat Global al registarse
    chat_global = db.query(Chat).filter(Chat.name == GLOBAL_CHAT_NAME).first()
    if chat_global:
        chat_global.participants.append(nuevo_usuario)
        db.commit()
        
    return nuevo_usuario

@app.post("/api/auth/login", response_model=Token, tags=["Auth"])
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Inicia sesión comparando credenciales y devuelve el JWT"""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
        
    # Verificamos hash en un hilo separado
    future = thread_pool.submit(verify_password, login_data.password, user.password_hash)
    if not future.result():
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
        
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

# ==========================================
# ENDPOINTS DE MENSAJES Y CHATS
# ==========================================

@app.get("/api/messages/chats", tags=["Messages"])
def get_user_chats(current_user: User = Depends(get_current_user)):
    """Obtiene los chats del usuario autenticado."""
    result = []
    for chat in current_user.chats:
        parts = [{"id": str(p.id), "username": p.username} for p in chat.participants]
        result.append({
            "id": str(chat.id),
            "name": chat.name,
            "is_group": chat.is_group,
            "participants": parts
        })
    return result

@app.post("/api/messages/chats/dm/{target_user_id}", tags=["Messages"])
def create_or_get_dm(target_user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Devuelve un DM existente o crea uno nuevo de manera sincrónica y thread-safe por defecto en la BD."""
    target_user = db.query(User).filter(User.id == target_user_id).first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if current_user.id == target_user.id:
         raise HTTPException(status_code=400, detail="No puedes crear un chat contigo mismo.")

    for chat in current_user.chats:
        if not chat.is_group and len(chat.participants) == 2:
            participant_ids = [str(p.id) for p in chat.participants]
            if str(target_user.id) in participant_ids:
                 return {"chat_id": str(chat.id), "message": "Ya existe el chat."}

    nuevo_chat = Chat(is_group=False)
    db.add(nuevo_chat)
    db.commit()
    db.refresh(nuevo_chat)

    nuevo_chat.participants.append(current_user)
    nuevo_chat.participants.append(target_user)
    db.commit()
    return {"chat_id": str(nuevo_chat.id), "message": "Chat creado exitosamente."}

def _create_group_chat_db_task(current_user_id: str, group_data: GroupChatCreate):
    """Lógica síncrona y transaccional de DB para ser ejectuada por el ThreadPoolExecutor."""
    # Obtenemos una nueva sesión independiente para este hilo local
    with next(get_db()) as db:
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            return {"error": "Usuario actual no encontrado."}

        # Buscamos y validamos a los usuarios provistos en el request
        participantes = db.query(User).filter(User.id.in_(group_data.participant_ids)).all()
        
        # Filtramos por si acaso se autoingresó en la lista accidentalmente para no agregarlo doble
        participantes = [p for p in participantes if str(p.id) != str(current_user_id)]
        
        if not participantes:
             return {"error": "Debe haber al menos un participante distinto al creador."}
        
        # Generar Chat
        nuevo_grupo = Chat(is_group=True, name=group_data.name)
        db.add(nuevo_grupo)
        db.commit()
        db.refresh(nuevo_grupo)

        # Agregar usuarios a tabla pivote
        nuevo_grupo.participants.append(current_user) # creador
        for p in participantes: # invitados
            nuevo_grupo.participants.append(p)
            
        db.commit()
        return {"chat_id": str(nuevo_grupo.id), "message": "Grupo creado exitosamente.", "name": nuevo_grupo.name}

@app.post("/api/messages/chats/group", tags=["Messages"])
def create_group_chat(group_data: GroupChatCreate, current_user: User = Depends(get_current_user)):
    """Crea un grupo de chat con múltiples usuarios de manera concurrente con hilos nativos."""
    # Delegamos la lógica bloqueante para crear e iterar participantes de SQL Alchemy a un hilo del pool nativo
    future = thread_pool.submit(_create_group_chat_db_task, str(current_user.id), group_data)
    resultado = future.result()
    
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=resultado["error"])
        
    return resultado

@app.delete("/api/messages/chats/{chat_id}", tags=["Messages"])
def delete_chat(chat_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Elimina un chat (y sus mensajes por cascada) siempre que el usuario sea parte del mismo y no sea el Global."""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
         raise HTTPException(status_code=404, detail="Chat no encontrado.")
         
    if chat.name == GLOBAL_CHAT_NAME:
         raise HTTPException(status_code=403, detail="El Chat Global no puede ser eliminado.")
         
    # Revisar si el usuario pertenece al chat o si fue quien lo creó
    participant_ids = [str(p.id) for p in chat.participants]
    if str(current_user.id) not in participant_ids:
         raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este chat.")
         
    db.delete(chat)
    db.commit()
    return {"message": "Chat eliminado correctamente."}

@app.get("/api/messages/history/{chat_id}", response_model=List[MessageResponse], tags=["Messages"])
def get_message_history(chat_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Obtiene todo el historial de mensajes de un chat específico al que el usuario pertenece."""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat no encontrado.")
    
    # Validar que el usuario sea partiicpante, a menos de que sea el Global
    participant_ids = [str(p.id) for p in chat.participants]
    if str(current_user.id) not in participant_ids and chat.name != GLOBAL_CHAT_NAME:
        raise HTTPException(status_code=403, detail="No perteneces a este chat.")
        
    mensajes = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.asc()).all()
    return mensajes

def _save_message_db_task(chat_id: str, sender_id: str, content: str):
    """Tarea síncrona enviada al thread_pool para no bloquear el WebSocket event loop mientras inserta."""
    with next(get_db()) as db:
        ahora = datetime.now(timezone.utc)
        nuevo_msg = Message(
            chat_id=chat_id,
            sender_id=sender_id,
            content=content,
            created_at=ahora
        )
        db.add(nuevo_msg)
        db.commit()
        db.refresh(nuevo_msg)
        # Devolvemos un Diccionario preparador para inyectar directo por sockets al frontend
        # Fallback al 'ahora' si es que SQLAlchemy no lo trajo bien
        fecha = nuevo_msg.created_at.isoformat() if nuevo_msg.created_at else ahora.isoformat()
        return {
            "id": str(nuevo_msg.id),
            "chat_id": str(nuevo_msg.chat_id),
            "sender_id": str(nuevo_msg.sender_id),
            "content": nuevo_msg.content,
            "created_at": fecha
        }

@app.websocket("/api/ws/chat/{chat_id}")
async def websocket_chat_endpoint(chat_id: str, websocket: WebSocket, token: str = Query(None)):
    """Abre el túnel de sockets y transmite mensajes bidireccionalmente en tiempo real preservando el GIL local."""
    # Obtenemos un DB session directo para validación de socket
    db_gen = get_db()
    db = next(db_gen)
    
    # Validamos vía Query string porque el navegador no manda Headers Authorization para WebSockets puristas
    user = await get_current_user_ws(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    # Verificar acceso salvo el Global
    participant_ids = [str(p.id) for p in chat.participants]
    if str(user.id) not in participant_ids and chat.name != GLOBAL_CHAT_NAME:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Aceptar conexión y registrar en Manager
    await manager.connect(websocket, chat_id)
    
    try:
        while True:
            # Escucha asíncronamente nuevos textos del Frontend
            data = await websocket.receive_text()
            
            # 1. Guardar a Postgres de forma asíncrona usando pool de hilos
            # Usando "run_in_executor" de asyncio para ligarlo al context asíncrono desde el síncrono
            loop = asyncio.get_running_loop()
            msg_data = await loop.run_in_executor(
               thread_pool, 
               _save_message_db_task, 
               chat_id, 
               str(user.id), 
               data
            )
            
            # 2. Rebotar el objeto finalizado (con fecha y todo de DB) a TODOS los usuarios en la misma ventana
            await manager.broadcast_to_chat(chat_id, msg_data)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, chat_id)

# ==========================================
# ENDPOINTS DE USUARIOS
# ==========================================

@app.get("/api/users/", response_model=List[UserResponse], tags=["Users"])
def get_all_users(db: Session = Depends(get_db)):
    """Lista todos los usuarios (sin contraseñas) para que el frontend pueda buscar con quién chatear."""
    return db.query(User).all()

@app.get("/api/users/me", tags=["Users"])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Devuelve el perfil del usuario activo validado por su token JWT."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

# ==========================================
# DEMO: PROCESOS NATIVOS PARA TAREAS PESADAS
# ==========================================

def cpu_bound_task(iters: int):
    """Función pesada de ejemplo (ideal para que la ejecute otro proceso para evadir el GIL)."""
    val = sum(i * i for i in range(iters))
    return {"result": val, "process_id": os.getpid()}

@app.get("/api/system/heavy-computation", tags=["System"])
def test_native_multiprocessing():
    """Ejecuta una carga CPU intensiva en un subproceso nativo independiente."""
    # Despacha la tarea al ProcessPoolExecutor
    future = process_pool.submit(cpu_bound_task, 10**7)
    # Bloquea solo este hilo, no el Event Loop global
    result = future.result()
    return {
        "message": "Cálculo intensivo externalizado exitosamente a proceso nativo.",
        "worker_pid": result["process_id"],
        "main_pid": os.getpid(),
        "computation_result": result["result"]
    }