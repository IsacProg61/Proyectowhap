from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from core.database import Base

# Tabla intermedia para la relación muchos a muchos entre Chats y Users
chat_participants = Table(
    "chat_participants",
    Base.metadata,
    Column("chat_id", UUID(as_uuid=True), ForeignKey("chats.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    chats = relationship("Chat", secondary=chat_participants, back_populates="participants")
    messages = relationship("Message", back_populates="sender")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=True)
    is_group = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    participants = relationship("User", secondary=chat_participants, back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", back_populates="messages")
