"use client";

import { useState, useEffect, useRef } from "react";
import { messagesApi } from "@/lib/api";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ChatWindow({ chat, currentUsername }: { chat?: any; currentUsername?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Computación síncrona del ID propio basándonos en los props
  const currentUserData = chat?.participants?.find((p: any) => p.username === currentUsername);
  const myId = currentUserData?.id;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Manejar el ciclo de vida del WebSocket y de la API de historial
  useEffect(() => {
    if (!chat) return;

    let socket: WebSocket;
    let isMounted = true; // Prevenir duplicados en React StrictMode

    const fetchHistoryAndConnect = async () => {
      try {
        // 1. Obtener historial primero
        const res = await messagesApi.getHistory(chat.id);
        if (!isMounted) return; // Cleanup de StrictMode ocurrió mientras esperábamos la API HTTP

        setMessages(res.data);

        // 2. Conectar al WebSocket
        const token = localStorage.getItem("token");
        socket = new WebSocket(`ws://localhost:8000/api/ws/chat/${chat.id}?token=${token}`);

        socket.onopen = () => {
          console.log("WebSocket Conectado a Sala:", chat.id);
        };

        socket.onmessage = (event) => {
          const incomingMessage: Message = JSON.parse(event.data);
          // Usamos callback para evitar dependencias rancias de react
          // Y validamos que no duplique insertando el mismo ID
          setMessages((prev) => {
            if (prev.find(m => m.id === incomingMessage.id)) return prev;
            return [...prev, incomingMessage];
          });
        };

        socket.onerror = (err) => {
          console.error("Error en WebSocket", err);
        };

        setWs(socket);

      } catch (err) {
        console.error("Error al cargar historial o conectar WS:", err);
      }
    };

    fetchHistoryAndConnect();

    // 3. Limpieza: Desconectar WebSocket al cerrar el componente o cambiar de chat
    return () => {
      isMounted = false;
      if (socket) {
        socket.close();
      }
      setMessages([]);
      setWs(null);
    };
  }, [chat, currentUsername]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws) return;

    // Mandamos el string puro, el backend lo mete a Postgres y lo rebota
    ws.send(newMessage);
    setNewMessage("");
  };

  if (!chat) {
    return (
      <div className="flex-1 h-full bg-brand-bg flex flex-col items-center justify-center text-brand-muted">
        <div className="text-6xl mb-4 bg-brand-panel p-6 rounded-full shadow-lg">💬</div>
        <h2 className="text-xl font-semibold mb-2 text-brand-text">WhatsApp Clone Web</h2>
        <p className="max-w-xs text-center text-sm">
          Envía y recibe mensajes al instante. <br /> (Selecciona un chat a la izquierda)
        </p>
      </div>
    );
  }

  const chatName = chat.is_group
    ? chat.name
    : chat.participants?.find((p: any) => p.username !== currentUsername)?.username || 'Desconocido';

  return (
    <div className="flex-1 h-full bg-brand-panel flex flex-col relative">
      {/* Header del Chat */}
      <div className="h-16 bg-brand-sidebar border-b border-brand-border px-6 flex items-center shadow-sm z-10 sticky top-0">
        <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold mr-4">
          {chatName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-lg font-bold text-brand-text">
          {chat.is_group ? `Grupo: ${chatName}` : `@${chatName}`}
        </h2>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 bg-brand-bg p-6 overflow-y-auto w-full flex flex-col">
        {messages.length === 0 ? (
          <div className="text-center mt-10 p-4 bg-brand-muted/10 rounded-xl text-brand-muted max-w-sm mx-auto">
            <p>Aún no hay mensajes en este chat.</p>
            <p className="text-xs mt-2 text-brand-accent font-semibold">Inicia la conversación.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-3 w-full max-w-4xl mx-auto">
            {messages.map((msg) => {
              // Identificar si el mensaje es mío
              const isMine = myId ? msg.sender_id === myId : false;

              // Buscar quién lo envió (útil en grupos)
              const senderData = chat.participants?.find((p: any) => p.id === msg.sender_id);
              const senderName = isMine ? "Tú" : (senderData?.username || "Alguien");

              // Formatear hora
              const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMine ? 'self-end' : 'self-start'}`}>
                  {/* Nombre del remitente (solo visible en grupos si no es mío) */}
                  {chat.is_group && !isMine && (
                    <span className="text-xs text-brand-accent ml-2 mb-1">{senderName}</span>
                  )}

                  <div className={`p-3 rounded-2xl relative shadow-sm text-sm ${isMine
                    ? 'bg-brand-accent text-white rounded-tr-none'
                    : 'bg-brand-sidebar text-brand-text border border-brand-border rounded-tl-none'
                    }`}>
                    <p className="break-words">{msg.content}</p>
                    <span className={`text-[10px] mt-1 block text-right opacity-70`}>
                      {time}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input de Mensajes */}
      <form onSubmit={handleSendMessage} className="h-20 bg-brand-sidebar border-t border-brand-border px-6 flex items-center sticky bottom-0">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje aquí..."
          className="flex-1 bg-brand-bg text-brand-text border border-brand-border rounded-lg p-3 focus:outline-none focus:border-brand-accent transition-colors"
          disabled={!ws}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !ws}
          className="ml-4 bg-brand-accent hover:bg-brand-accent_hover transition-colors text-white px-5 py-3 rounded-lg font-bold disabled:opacity-50 flex-shrink-0"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}