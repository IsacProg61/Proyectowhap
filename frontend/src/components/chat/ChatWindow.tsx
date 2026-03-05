export default function ChatWindow({ chat }: any) {
  return (
    <div className="flex-1 h-full bg-[#0b141a] flex flex-col items-center justify-center text-[#8696a0]">
      <h2 className="text-xl mb-2">Chat seleccionado: {chat.id}</h2>
      <p>Los mensajes aparecerán aquí cuando conectemos el backend.</p>
    </div>
  );
}