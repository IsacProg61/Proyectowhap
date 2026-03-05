import threading
import queue
import time
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
message_queue = queue.Queue()

# Creamos el Lock (la llave de la sección crítica)
file_lock = threading.Lock()

def persistent_worker():
    print("🧵 [Hilo Worker] Iniciado y esperando mensajes...")
    while True:
        log_entry = message_queue.get()
        if log_entry is None: break
        
        # SECCIÓN CRÍTICA: Solo un hilo entra aquí a la vez
        with file_lock:
            with open("chat_history.log", "a", encoding="utf-8") as f:
                f.write(f"{log_entry}\n")
                # Simulamos que escribir en disco es lento
                time.sleep(1) 
        
        print(f"✅ [Hilo Worker] Guardado con Lock: {log_entry}")
        message_queue.task_done()

worker_thread = threading.Thread(target=persistent_worker, daemon=True)
worker_thread.start()

@app.get("/api/messages/history")
async def get_history():
    """
    Incluso para leer, usamos el Lock para evitar leer 
    mientras el hilo worker está escribiendo.
    """
    with file_lock:
        try:
            with open("chat_history.log", "r") as f:
                lines = f.readlines()
            return {"history": [line.strip() for line in lines]}
        except FileNotFoundError:
            return {"history": []}
        
class MessageInput(BaseModel):
    user: str
    content: str

@app.post("/api/messages/send")
async def send_message(data: MessageInput):
    """
    Este es el 'Productor'. Recibe el mensaje de la API y lo
    pone en la cola para que el hilo trabajador lo procese.
    """
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    formatted_msg = f"[{timestamp}] {data.user}: {data.content}"
    
    # Metemos el mensaje en la cola (thread-safe)
    message_queue.put(formatted_msg)
    
    return {"status": "Enviado a la cola de persistencia", "msg": formatted_msg}