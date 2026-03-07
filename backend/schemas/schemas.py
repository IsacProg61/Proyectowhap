from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

# --- Schemas de Usuario ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True # Permite leer data directamente de SQLAlchemy (orm_mode)

# --- Schemas de Autenticación / JWT ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
