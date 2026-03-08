import axios from "axios";

// Para desarrollo local, Next.js por defecto intentará usar el puerto 3000.
// Configuramos baseURL para que le pegue directamente a FastAPI.
const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Agrega el token a todas las peticiones automáticamente
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
// ----------------------------

export const authApi = {
  // Ahora mandamos email y password como pide el backend FastAPI (UserLogin)
  login: (data: any) => api.post("/auth/login", data),
  // Registramos usuario nuevo usando (UserCreate)
  register: (data: any) => api.post("/auth/register", data),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("chat_user");
    }
  },
};

export const usersApi = {
  me: () => api.get("/users/me"),
  list: () => api.get("/users/"),
};

export const chatsApi = {
  list: () => api.get("/messages/chats"),
  createDm: (userId: string) => api.post(`/messages/chats/dm/${userId}`),
  createGroup: (data: { name: string; participant_ids: string[] }) =>
    api.post("/messages/chats/group", data),
  deleteChat: (chatId: string) => api.delete(`/messages/chats/${chatId}`),
};

export const messagesApi = {
  getHistory: (chatId: string) => api.get(`/messages/history/${chatId}`),
};