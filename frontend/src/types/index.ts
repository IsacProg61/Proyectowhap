export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  status: 'online' | 'offline';
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  lastMessage?: Message;
  participants: User[];
}