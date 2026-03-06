import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-[#f0f2f5] dark:bg-[#111b21]">
      <div className="flex w-full h-full overflow-hidden shadow-xl">
        
        {/* Panel Izquierdo */}
        <aside className="w-1/3 min-w-[300px] max-w-[450px] border-r border-gray-300 dark:border-gray-700">
          <ChatSidebar />
        </aside>

        {/* Panel Derecho */}
        <main className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
          <ChatWindow />
        </main>
        
      </div>
    </div>
  );
}