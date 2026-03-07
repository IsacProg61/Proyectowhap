from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import bcrypt # Using bcrypt directly to bypass passlib bug in latest python
from .config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60 # 30 días para el MVP

def get_password_hash(password: str) -> str:
    """Devuelve el hash seguro de una contraseña en texto plano."""
    # Bcrypt requiere bytes, así que codificamos la contraseña
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    # Devolvemos string para guardarlo en la base de datos
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con su hash."""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """Crea un token JWT con la información del usuario (subject)."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt
