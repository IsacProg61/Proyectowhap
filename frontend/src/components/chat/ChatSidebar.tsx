"use client";

// src/components/chat/ChatSidebar.tsx
import { useState, useEffect } from "react";
import { usersApi, chatsApi } from "@/lib/api";

export default function ChatSidebar({
  chats = [],
  onSelect,
  currentUsername,
  onLogout,
  onChatCreated
}: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load users when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setLoading(true);
      usersApi.list().then(res => {
        setUsers(res.data);
      }).catch(err => {
        console.error("Error fetching users:", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isModalOpen]);

  // Handle creating a new chat
  const handleCreateChat = async (userId: string) => {
    try {
      await chatsApi.createDm(userId);
      setIsModalOpen(false);
      if (onChatCreated) onChatCreated(); // Refresh chat list
    } catch (err) {
      console.error("Failed to create chat:", err);
      alert("Error al crear el chat. (Asegúrate de no chatear contigo mismo)");
    }
  };

  return (
    <div className="w-full h-full bg-brand-sidebar text-brand-text p-4 border-r border-brand-border flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-brand-border">
        <div className="flex flex-col">
          <span className="text-xs text-brand-muted">Conectado como</span>
          <span className="font-bold text-brand-accent">@{currentUsername}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-white text-xs bg-brand-accent hover:bg-brand-accent_hover px-3 py-1.5 rounded-md font-semibold transition"
          >
            + Nuevo
          </button>
          <button
            onClick={onLogout}
            className="text-red-400 text-xs hover:text-white hover:bg-red-500/80 px-2 py-1.5 rounded-md transition"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <p className="text-xs text-brand-muted uppercase tracking-wider mb-2 font-semibold">Tus Chats</p>
        {chats.length === 0 ? (
          <p className="text-sm text-brand-muted italic text-center mt-10">No tienes chats aún.</p>
        ) : (
          chats.map((chat: any) => (
            <div
              key={chat.id}
              onClick={() => onSelect(chat)}
              className="p-3 bg-brand-bg hover:bg-brand-panel cursor-pointer rounded-lg transition-colors border-l-4 border-transparent hover:border-brand-accent group"
            >
              <span className="font-medium text-brand-text group-hover:text-brand-accent transition">
                {chat.is_group ? `Grupo: ${chat.name}` : `Chat con ${chat.participants?.find((p: any) => p.username !== currentUsername)?.username || 'Desconocido'}`}
              </span>
            </div>
          ))
        )}
      </div>

      {/* New Chat Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-brand-panel p-6 rounded-xl w-96 max-h-[80vh] flex flex-col shadow-2xl border border-brand-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-brand-text">Iniciar Nuevo Chat</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-brand-muted hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="text-brand-muted text-center py-4">Cargando usuarios...</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user: any) => (
                    currentUsername !== user.username && (
                      <div
                        key={user.id}
                        className="flex justify-between items-center p-3 bg-brand-bg rounded-lg hover:bg-brand-border"
                      >
                        <span className="font-medium text-brand-text">{user.username}</span>
                        <button
                          onClick={() => handleCreateChat(user.id)}
                          className="text-xs bg-brand-accent hover:bg-brand-accent_hover text-white px-3 py-1 rounded"
                        >
                          Escribir
                        </button>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}