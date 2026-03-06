// src/components/chat/ChatSidebar.tsx
export default function ChatSidebar({ 
  chats = [], // Valor por defecto: array vacío
  onSelect, 
  currentUsername, 
  onLogout 
}: any) {
  return (
    <div className="w-full h-full bg-[#111b21] text-white p-4 border-r border-[#222e35]">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2a3942]">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">Conectado como</span>
          <span className="font-bold text-whatsapp-green">@{currentUsername}</span>
        </div>
        <button 
          onClick={onLogout} 
          className="text-red-400 text-xs hover:underline bg-red-400/10 px-2 py-1 rounded"
        >
          Salir
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tus Chats</p>
        {chats.map((chat: any) => (
          <div 
            key={chat.id} 
            onClick={() => onSelect(chat)} 
            className="p-3 hover:bg-[#2a3942] cursor-pointer rounded-lg transition-colors border-l-4 border-transparent hover:border-whatsapp-green bg-[#1a252b]"
          >
            <span className="font-medium text-gray-200"># {chat.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}