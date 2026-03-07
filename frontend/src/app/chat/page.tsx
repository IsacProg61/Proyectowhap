"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { chatsApi, authApi } from '@/lib/api';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [currentUsername, setCurrentUsername] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);

  const fetchChats = async () => {
    try {
      const res = await chatsApi.list();
      setChats(res.data);
    } catch (err) {
      console.error("Error fetching chats:", err);
      // Si falla por 401 el token expiró, los mandamos a login
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    // Verificamos si hay sesión
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('chat_user');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    setCurrentUsername(user);
    fetchChats();
  }, [router]);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-brand-bg font-sans">
      <div className="flex w-full h-full overflow-hidden shadow-2xl">

        {/* Panel Izquierdo */}
        <aside className="w-1/3 min-w-[300px] max-w-[450px]">
          <ChatSidebar
            chats={chats}
            onSelect={setSelectedChat}
            currentUsername={currentUsername}
            onLogout={handleLogout}
            onChatCreated={fetchChats}
          />
        </aside>

        {/* Panel Derecho */}
        <main className="flex-1 flex flex-col bg-brand-bg relative">
          {selectedChat ? (
            <ChatWindow chat={selectedChat} currentUsername={currentUsername} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-brand-muted">
              <div className="w-24 h-24 mb-4 rounded-full bg-brand-panel flex items-center justify-center">
                <span className="text-4xl text-brand-accent">💬</span>
              </div>
              <h2 className="text-2xl font-bold text-brand-text mb-2">WhatsApp Clone Web</h2>
              <p>Envía y recibe mensajes sin conectar tu teléfono.</p>
              <p className="mt-1">Usa la nueva paleta de colores vibrantes.</p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}