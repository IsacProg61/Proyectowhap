"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { chatsApi, usersApi, authApi } from "@/lib/api";
import { Chat, User } from "@/types";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    usersApi.me().then((res) => setCurrentUser(res.data)).catch(() => router.push("/login"));
  }, [router]);

  // Load chats
  useEffect(() => {
    chatsApi.list().then((res) => {
      setChats(res.data);
      // Auto-open General chat
      const general = res.data.find((c: Chat) => c.id === "general");
      if (general) setActiveChat(general);
    }).catch(console.error);
  }, []);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleNewChat = () => {
    usersApi.list().then((res) => {
      setUsers(res.data);
      setShowUserList(true);
    });
  };

  const handleStartDm = async (userId: string) => {
    const res = await chatsApi.createDm(userId);
    const newChat: Chat = res.data;
    setChats((prev) => {
      const exists = prev.find((c) => c.id === newChat.id);
      return exists ? prev : [newChat, ...prev];
    });
    setActiveChat(newChat);
    setShowUserList(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      {/* Sidebar */}
      <div className="w-80 shrink-0 h-full overflow-hidden">
        <ChatSidebar
          chats={chats}
          activeId={activeChat?.id ?? null}
          onSelect={setActiveChat}
          currentUsername={currentUser.username}
          onNewChat={handleNewChat}
          onLogout={handleLogout}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 h-full overflow-hidden relative">
        {activeChat ? (
          <ChatWindow chat={activeChat} currentUsername={currentUser.username} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-brand-muted">
            <div className="w-20 h-20 rounded-full bg-brand-sidebar flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-brand-muted">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
            </div>
            <p className="text-lg font-light">Select a chat to start messaging</p>
          </div>
        )}

        {/* User list modal */}
        {showUserList && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-brand-sidebar rounded-2xl w-80 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                <h3 className="text-brand-text font-semibold">New Direct Message</h3>
                <button
                  onClick={() => setShowUserList(false)}
                  className="text-brand-muted hover:text-brand-text"
                >✕</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {users
                  .filter((u) => u.username !== currentUser.username)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleStartDm(u.id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-brand-panel transition text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#6b7280] flex items-center justify-center text-white font-bold uppercase">
                        {u.display_name[0]}
                      </div>
                      <div>
                        <p className="text-brand-text text-sm font-medium">{u.display_name}</p>
                        <p className="text-brand-muted text-xs">@{u.username}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}