from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from models.models import User
from schemas.schemas import UserResponse

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Lista todos los usuarios (sin contraseñas) para que el frontend pueda buscar con quién chatear."""
    usuarios = db.query(User).all()
    return usuarios

@router.get("/me")
def get_current_user_profile(db: Session = Depends(get_db)):
    """
    TODO: Extraer al usuario desde su token JWT.
    Temporalmente, devolvemos el primer usuario de la base como salvavidas MVP.
    """
    first_user = db.query(User).first()
    if not first_user:
        return {"error": "Sin usuarios en la BD"}
    
    return {
        "id": first_user.id,
        "username": first_user.username,
        "email": first_user.email
    }
