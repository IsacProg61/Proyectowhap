from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

from core.database import get_db
from models.models import User
from schemas.schemas import UserCreate, UserResponse, UserLogin, Token
from core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"]
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Crea una nueva cuenta de usuario validando que el email o el username no existan."""
    
    # 1. Checa si el usuario o email ya existe en BD
    user_by_email = db.query(User).filter(User.email == user_in.email).first()
    if user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email ya está registrado.",
        )
        
    user_by_username = db.query(User).filter(User.username == user_in.username).first()
    if user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuario ya existe, prueba con uno diferente.",
        )
    
    # 2. Craea el nuevo usuario con la contraseña blindada
    hashed_password = get_password_hash(user_in.password)
    
    nuevo_usuario = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        display_name=user_in.display_name,
        avatar_url=user_in.avatar_url
    )
    
    # 3. Lo graba en postgres
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    return nuevo_usuario


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Inicia sesión comparando credenciales y devuelve el JWT"""
    
    # Busca al usuario usando el email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
        
    # Verifica si la contraseña es la correcta
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
        
    # Crea el Gafete (Token)
    access_token = create_access_token(subject=user.id)
    
    return {"access_token": access_token, "token_type": "bearer"}
