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
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Group states
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Load users when either modal opens
  useEffect(() => {
    if (isModalOpen || isGroupModalOpen) {
      setLoading(true);
      usersApi.list().then(res => {
        setUsers(res.data);
      }).catch(err => {
        console.error("Error fetching users:", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isModalOpen, isGroupModalOpen]);

  // Reset group form when closing
  useEffect(() => {
    if (!isGroupModalOpen) {
      setGroupName("");
      setSelectedUsers([]);
    }
  }, [isGroupModalOpen]);

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

  const handleToggleGroupUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return alert("Por favor ingresa un nombre para el grupo.");
    if (selectedUsers.length < 1) return alert("Selecciona al menos 1 participante extra.");

    try {
      await chatsApi.createGroup({
        name: groupName,
        participant_ids: selectedUsers
      });
      setIsGroupModalOpen(false);
      if (onChatCreated) onChatCreated();
    } catch (err) {
      console.error("Failed to create group:", err);
      alert("Error al crear el grupo.");
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string, chatName: string) => {
    e.stopPropagation(); // Avoid selecting the chat if clicking delete
    if (!confirm(`¿Estás seguro de que quieres eliminar "${chatName}" permanentemente?`)) return;

    try {
      await chatsApi.deleteChat(chatId);
      if (onChatCreated) onChatCreated(); // Refresh chat list
    } catch (err: any) {
      console.error("Failed to delete chat:", err);
      alert(err.response?.data?.detail || "Error al eliminar el chat.");
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
            onClick={() => setIsGroupModalOpen(true)}
            className="text-white text-xs bg-brand-panel hover:bg-brand-border px-3 py-1.5 rounded-md font-semibold transition border border-brand-border"
          >
            + Grupo
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-white text-xs bg-brand-accent hover:bg-brand-accent_hover px-3 py-1.5 rounded-md font-semibold transition"
          >
            + Chat
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
          chats.map((chat: any) => {
            const chatName = chat.is_group
              ? chat.name
              : chat.participants?.find((p: any) => p.username !== currentUsername)?.username || 'Desconocido';

            return (
              <div
                key={chat.id}
                onClick={() => onSelect(chat)}
                className="p-3 bg-brand-bg hover:bg-brand-panel cursor-pointer rounded-lg transition-colors border-l-4 border-transparent hover:border-brand-accent group flex justify-between items-center"
              >
                <span className="font-medium text-brand-text group-hover:text-brand-accent transition truncate pr-2">
                  {chat.is_group ? `Grupo: ${chatName}` : `Chat con ${chatName}`}
                </span>

                {chat.name !== "Chat Global" && (
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id, chatName)}
                    title="Eliminar Chat"
                    className="text-brand-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-brand-border"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })
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

      {/* New Group Chat Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-brand-panel p-6 rounded-xl w-96 max-h-[80vh] flex flex-col shadow-2xl border border-brand-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-brand-text">Crear Grupo</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-brand-muted hover:text-white">✕</button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Nombre del grupo..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-brand-bg text-brand-text px-3 py-2 rounded-lg border border-brand-border outline-none focus:border-brand-accent"
              />
            </div>

            <span className="text-xs text-brand-muted uppercase tracking-wider mb-2 font-semibold">Participantes</span>

            <div className="flex-1 overflow-y-auto border border-brand-border rounded-lg bg-brand-bg relative min-h-[150px]">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-brand-muted text-sm">Cargando...</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {users.map((user: any) => (
                    currentUsername !== user.username && (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-2 bg-brand-sidebar hover:bg-brand-panel cursor-pointer rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-brand-accent bg-brand-bg border-brand-border rounded focus:ring-brand-accent focus:ring-2"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleToggleGroupUser(user.id)}
                        />
                        <span className="font-medium text-sm text-brand-text">{user.username}</span>
                      </label>
                    )
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCreateGroup}
                disabled={loading || !groupName.trim() || selectedUsers.length === 0}
                className="bg-brand-accent hover:bg-brand-accent_hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}