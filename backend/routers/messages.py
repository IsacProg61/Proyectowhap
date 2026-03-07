from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid

from core.database import get_db
from models.models import User, Chat, chat_participants

router = APIRouter(
    prefix="/api/messages",
    tags=["Messages"]
)

@router.get("/chats")
def get_user_chats(db: Session = Depends(get_db)):
    """
    TODO: Por el momento, devuelvo todos los chats de la base de datos 
    hasta que implementemos el obtener usuario actual via JWT Depend.
    """
    chats = db.query(Chat).all()
    # Necesitamos formatear los participantes para el frontend
    result = []
    for chat in chats:
        parts = [{"id": str(p.id), "username": p.username} for p in chat.participants]
        result.append({
            "id": str(chat.id),
            "name": chat.name,
            "is_group": chat.is_group,
            "participants": parts
        })
    return result

@router.post("/chats/dm/{target_user_id}")
def create_or_get_dm(target_user_id: str, db: Session = Depends(get_db)):
    """
    TODO: De igual forma, por ahora hardcodeamos el creador hasta que el middleware de JWT esté listo.
    Simulamos que el usuario "creador" es el primer usuario en la BD temporalmente para pruebas.
    """
    current_user = db.query(User).first()
    target_user = db.query(User).filter(User.id == target_user_id).first()
    
    if not current_user or not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if current_user.id == target_user.id:
         raise HTTPException(status_code=400, detail="No puedes crear un chat contigo mismo.")

    # 1. Buscar si ya existe un chat uno a uno entre estos dos
    # Esto requiere una consulta SQL compleja o revisar los cruces
    # Simplificamos recorriendo los chats del usuario actual por ahora
    for chat in current_user.chats:
        if not chat.is_group and len(chat.participants) == 2:
            participant_ids = [p.id for p in chat.participants]
            if target_user.id in participant_ids:
                 # Ya existe un DM
                 return {"chat_id": str(chat.id), "message": "Ya existe el chat."}

    # 2. Si no existe, crearlo
    nuevo_chat = Chat(is_group=False)
    db.add(nuevo_chat)
    db.commit()
    db.refresh(nuevo_chat)

    # Añadir a los dos participantes
    nuevo_chat.participants.append(current_user)
    nuevo_chat.participants.append(target_user)
    db.commit()

    return {"chat_id": str(nuevo_chat.id), "message": "Chat creado exitosamente."}
