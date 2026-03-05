import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// --- ESTO ES LO QUE FALTA ---
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
  logout: () => api.post("/auth/logout"),
};

export const usersApi = {
  me: () => api.get("/users/me"),
  list: () => api.get("/users/"),
};

export const chatsApi = {
  list: () => api.get("/messages/chats"),
  createDm: (userId: string) => api.post(`/messages/chats/dm/${userId}`),
};