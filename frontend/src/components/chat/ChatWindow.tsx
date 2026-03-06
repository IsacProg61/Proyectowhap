export default function ChatWindow({ chat }: { chat?: any }) {
  // Si 'chat' es undefined o null, mostramos la pantalla vacía
  if (!chat) {
    return (
      <div className="flex-1 h-full bg-[#0b141a] flex flex-col items-center justify-center text-[#8696a0]">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl mb-2 text-gray-200">WhatsApp Web</h2>
        <p className="max-w-xs text-center text-sm">
          Envía y recibe mensajes sin necesidad de tener tu teléfono conectado.
        </p>
      </div>
    );
  }

  // Si hay un chat, mostramos el contenido
  return (
    <div className="flex-1 h-full bg-[#0b141a] flex flex-col items-center justify-center text-[#8696a0]">
      <h2 className="text-xl mb-2 text-white">Chat seleccionado: {chat.id}</h2>
      <p>Los mensajes aparecerán aquí cuando conectemos el backend.</p>
    </div>
  );
}