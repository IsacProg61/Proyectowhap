"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      // Guardamos el nombre en localStorage para usarlo en los mensajes
      localStorage.setItem('chat_username', username.trim());
      
      // Opcional: Aquí podrías hacer un fetch rápido al backend 
      // para avisar que un usuario entró.
      
      router.push('/chat');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] dark:bg-[#111b21]">
      <div className="w-full max-w-sm p-6 bg-white dark:bg-[#202c33] shadow-md rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          ¿Cómo te llamas?
        </h2>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            placeholder="Tu nombre de usuario..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green dark:bg-[#2a3942] dark:border-none dark:text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          
          <button
            type="submit"
            className="w-full p-3 bg-[#00a884] text-white font-bold rounded-lg hover:bg-[#008f72] transition-colors"
          >
            Empezar a chatear
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          No se requiere contraseña. Tu nombre será visible para otros.
        </p>
      </div>
    </div>
  );
}