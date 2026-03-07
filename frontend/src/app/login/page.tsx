"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Login Flow
        const res = await authApi.login({ email, password });
        localStorage.setItem('token', res.data.access_token);
        // Temporarily store the email as "username" for MVP until we fetch the true /me profile
        localStorage.setItem('chat_user', email);
        router.push('/chat');

      } else {
        // Register Flow
        await authApi.register({ username, email, password });

        // Auto-login after successful registration
        const res = await authApi.login({ email, password });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('chat_user', username);
        router.push('/chat');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Ocurrió un error inesperado.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg font-sans">
      <div className="w-full max-w-sm p-8 bg-brand-panel border border-brand-border shadow-2xl rounded-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-brand-accent rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
          <span className="text-3xl text-white transform -rotate-3">💬</span>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-brand-text tracking-tight">
          {isLogin ? "Bienvenido de vuelta" : "Únete ahora"}
        </h2>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Elige un @usuario"
              className="w-full p-3.5 bg-brand-bg border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent text-brand-text placeholder-brand-muted transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Tu correo electrónico"
            className="w-full p-3.5 bg-brand-bg border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent text-brand-text placeholder-brand-muted transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña secreta"
            className="w-full p-3.5 bg-brand-bg border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent text-brand-text placeholder-brand-muted transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
          />

          <button
            type="submit"
            className="w-full p-4 mt-2 bg-brand-accent text-white font-bold rounded-xl hover:bg-brand-accent_hover shadow-lg shadow-brand-accent/20 transition-all active:scale-[0.98]"
          >
            {isLogin ? "Entrar al Chat" : "Crear mi Cuenta"}
          </button>
        </form>

        <p className="mt-8 text-sm text-brand-muted">
          {isLogin ? "¿Nuevo por aquí? " : "¿Ya eres miembro? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-accent font-bold hover:underline"
          >
            {isLogin ? "Regístrate ahora" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}