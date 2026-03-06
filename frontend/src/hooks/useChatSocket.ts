// src/hooks/useChatSocket.ts
import { useEffect, useState } from 'react';

export const useChatSocket = (chatId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`ws://localhost:8000/ws/${chatId}?token=${token}`);

    ws.onopen = () => console.log("Conectado al chat:", chatId);
    ws.onclose = () => console.log("Desconectado del chat");
    
    setSocket(ws);

    return () => ws.close();
  }, [chatId]);

  const sendMessage = (content: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ content }));
    }
  };

  return { sendMessage };
};