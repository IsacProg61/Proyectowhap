export default function ChatSidebar({ chats, onSelect, currentUsername, onLogout }: any) {
  return (
    <div className="w-full h-full bg-[#111b21] text-white p-4 border-r border-[#222e35]">
      <div className="flex justify-between mb-4">
        <span className="font-bold">@{currentUsername}</span>
        <button onClick={onLogout} className="text-red-400 text-sm">Salir</button>
      </div>
      <div className="space-y-2">
        {chats.map((chat: any) => (
          <div key={chat.id} onClick={() => onSelect(chat)} className="p-2 hover:bg-[#2a3942] cursor-pointer rounded">
            Chat {chat.id}
          </div>
        ))}
      </div>
    </div>
  );
}