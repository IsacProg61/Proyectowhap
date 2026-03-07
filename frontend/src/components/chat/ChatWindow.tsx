export default function ChatWindow({ chat, currentUsername }: { chat?: any; currentUsername?: string }) {
  // Si 'chat' es undefined o null, mostramos la pantalla vacía
  if (!chat) {
    return (
      <div className="flex-1 h-full bg-brand-bg flex flex-col items-center justify-center text-brand-muted">
        <div className="text-6xl mb-4 bg-brand-panel p-6 rounded-full shadow-lg">💬</div>
        <h2 className="text-xl font-semibold mb-2 text-brand-text">WhatsApp Clone Web</h2>
        <p className="max-w-xs text-center text-sm">
          Envía y recibe mensajes al instante. <br /> (Selecciona un chat a la izquierda)
        </p>
      </div>
    );
  }

  // Nombre del chat (si no es grupo, saca el nombre del otro sujeto)
  const chatName = chat.is_group
    ? chat.name
    : chat.participants?.find((p: any) => p.username !== currentUsername)?.username || 'Desconocido';

  // Si hay un chat, mostramos el marco del chat
  return (
    <div className="flex-1 h-full bg-brand-panel flex flex-col">
      {/* Header del Chat */}
      <div className="h-16 bg-brand-sidebar border-b border-brand-border px-6 flex items-center shadow-sm z-10">
        <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold mr-4">
          {chatName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-lg font-bold text-brand-text">@{chatName}</h2>
      </div>

      {/* Área de Mensajes (Placeholder) */}
      <div className="flex-1 bg-brand-bg p-6 overflow-y-auto">
        <div className="text-center mt-10 p-4 bg-brand-muted/10 rounded-xl text-brand-muted max-w-sm mx-auto">
          <p>Aún no hay mensajes en este chat.</p>
          <p className="text-xs mt-2 text-brand-accent">Muy pronto conectaremos los Websockets.</p>
        </div>
      </div>

      {/* Input de Mensajes (Placeholder) */}
      <div className="h-20 bg-brand-sidebar border-t border-brand-border px-6 flex items-center">
        <input
          disabled
          placeholder="Escribe un mensaje aquí..."
          className="flex-1 bg-brand-bg text-brand-text border border-brand-border rounded-lg p-3 focus:outline-none focus:border-brand-accent disabled:opacity-50"
        />
        <button disabled className="ml-4 bg-brand-accent text-white p-3 rounded-lg font-bold disabled:opacity-50 flex-shrink-0">
          Enviar
        </button>
      </div>
    </div>
  );
}