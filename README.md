# 💬 WhatsApp Clone (Guía para Developers)

¡Bienvenido al código fuente de nuestro **WhatsApp Clone**! Este proyecto es una aplicación de mensajería en tiempo real construida con **Next.js 14** en el Frontend y **FastAPI (Python)** en el Backend, con una base de datos **PostgreSQL**.

Si eres un **Desarrollador Junior** o estás aprendiendo sobre arquitecturas modernas, este documento está hecho específicamente para ti. Aquí te explicaremos cómo funciona todo por debajo, con especial atención a **cómo logramos que la aplicación sea extremadamente rápida usando paralelismo y concurrencia en Python**.

---

## 🏗️ Arquitectura General

Imagina que la aplicación está dividida en dos grandes mundos que se comunican entre sí:

*   **El Frontend (Carpeta `/frontend`):** Es la cara visual de la app. Está hecho con React (Next.js) y Tailwind CSS. Se encarga de mostrar la lista de chats, dibujar las burbujas de colores de los mensajes y recolectar lo que el usuario teclea.
*   **El Backend (Carpeta `/backend`):** Es el cerebro. Está hecho con **FastAPI** (Python). Su trabajo es verificar que los usuarios existan, guardar los mensajes en la base de datos (PostgreSQL) y mandarle los mensajes nuevos a la persona correcta de forma instantánea.

La magia de que los mensajes lleguen al instante, sin necesidad de recargar la página web, se llama **WebSockets**. Un WebSocket es como una llamada telefónica directa: la línea se mantiene abierta todo el tiempo, así que cuando alguien envía un mensaje, el servidor (FastAPI) lo grita inmediatamente por el tubo acústico, y el navegador de quien recibe (React) lo atrapa al vuelo.

---

## ⚡ La Magia Oculta: Concurrencia, Hilos y Procesos en Python

Esta es la parte más interesante de este proyecto. Tu backend en Python está diseñado para soportar muchísimo tráfico sin "congelarse". Si te fijas en `backend/main.py`, verás conceptos como `async`, `await`, y Pools de Concurrencia. **¿Por qué programamos esto así?**

En Python existe algo llamado **GIL (Global Interpreter Lock)**. Es un "candado" interno que solo permite a Python ejecutar código en un solo núcleo (core) del procesador a la vez, por seguridad. Para aplicaciones de chat en tiempo real, esto podría ser un cuello de botella terrible.

Aquí te explicamos cómo burlamos al GIL y logramos un chat veloz:

### 1. Concurrencia Asíncrona (`async / await`) — El Recepcionista Veloz
**Para qué sirve:** Para coordinar miles de conexiones Websocket de usuarios en línea.
*   En `main.py`, la función que abre el chat (`websocket_chat_endpoint`) es asíncrona (`async def`). 
*   **Concepto JR:** Imagina un restaurante. El mesero asíncrono toma tu orden (recibe el mensaje de Socket) y la manda a la cocina. En lugar de quedarse parado frente a la estufa viendo cómo se fríe la carne, el mesero se va a atender a otras 50 mesas. Cuando la cocina termina tu plato, un timbre suena y el mesero te lo lleva. Esto se llama **Event Loop** de I/O. Mientras lee o escribe en la red, Python atiende a otros.

### 2. Piscina de Hilos (`ThreadPoolExecutor`) — Para la Base de Datos
**Para qué sirve:** Porque nuestra Base de Datos (SQLAlchemy Síncrona) es el "chef lento".
*   Si usamos al *"Mesero Veloz Asíncrono"* para ir a guardar el mensaje a PostgreSQL usando código tradicional bloqueante (síncrono), el mesero se quedaría trabado, paralizando a todo el restaurante.
*   **La Solución:** En `main.py` declaramos un `thread_pool`. Cada vez que nos llega un mensaje de chat y tenemos que hablar con la base de datos, metemos esa tarea en ese "pool": `loop.run_in_executor(thread_pool, _save_message_db_task...)`. 
*   **Concepto JR:** En lugar del mesero, tenemos "ayudantes" (Threads). El mesero le pasa la orden a un ayudante, el ayudante se pelea peleando con la base de datos a su propio ritmo bloqueado, y cuando graba el texto en SQL, le avisa al Event Loop para que envíe el mensaje al frontend. Python permite que los hilos operen en "paralelo" siempre y cuando dependan del Input/Output (Disco Duro / Red) gracias a que el GIL se suelta en esos momentos.

### 3. Procesos Nativos (`ProcessPoolExecutor`) — Para Tareas Súper Pesadas
**Para qué sirve:** Para matemática pesada y evadir el candado GIL por completo.
*   Si tuviéramos que calcular algo fuertísimo, como comprimir el video de un chat o minar bitcoins con la terminal, ni los Hilos ni `async` nos salvarían. El candado (GIL) nos detendría en un solo procesador.
*   **La Solución:** Declaramos un `ProcessPoolExecutor`. Cuando FastAPI recibe esa petición (ver endpoint `/api/system/heavy-computation`), clona todo el motor de Python y lo lanza a un núcleo distinto de tu CPU de computadora. 
*   **Concepto JR:** Hemos contratado a cocineros en franquicias que operan de manera totalmente paralela al restaurante original, aprovechando el 100% de la computadora física del servidor host.

**En Resumen:**
Nuestro backend recibe miles de mensajes fluidamente usando `WebSocket Asíncronos`, inyecta esos mensajes a la DB delegándolos a la basura con `Hilos (Threads)`, y resuelve problemas matemáticos críticos usando `Procesos Nativos`. ¡Una máquina perfecta! 🛠️

---

## 🚀 Cómo Empezar Localmente (Tu Guía Práctica)

Asegúrate de tener instalado **Python 3.11+** y **Node.js 18+**.
También asegúrate de que **PostgreSQL** esté instalado y corriendo en tu computadora.

### 1. Levantar el Backend (FastAPI)

1. Abre tu terminal.
2. Ingresa a la carpeta del servidor: `cd backend`
3. Activa el entorno virtual de Python: `source venv/bin/activate` (o equivalente en Windows).
4. *(Opcional)* Si eres nuevo, asegúrate de instalar librerías: `pip install -r requirements.txt` (incluyendo `websockets`).
5. Abre y configura el archivo `.env` que debería apuntar a tu base de datos postgres local:
   `DATABASE_URL=postgresql://usuario_postgres:password_postgres@localhost:5432/nombre_db_whatsapp`
6. Enciende el servidor:
   ```bash
   uvicorn main:app --reload
   ```
7. Tu API estará lista en `http://127.0.0.1:8000`. ¡Puedes visitar `/docs` en tu navegador para ver toda la API documentada por Swagger automáticamente!

### 2. Levantar el Frontend (React / Next.js)

1. Abre otra terminal independiente.
2. Ingresa a la carpeta web: `cd frontend`
3. *(Opcional)* Instala las dependencias la primera vez: `npm install`
4. Enciende el Servidor de Next.js:
   ```bash
   npm run dev
   ```
5. Ve a tu navegador Web y abre: `http://localhost:3000`

### Bonus: ¿Cómo fluye un Chat Visualmente? 🕵️‍♂️
1. Abres el navegador en `localhost:3000` y haces **Login**.
2. React ejecuta una petición HTTP REST normal pidiendo tu JWT (Token) para saber que eres auténtico.
3. React intercepta y llama un Endpoint GET en `/api/messages/history/{chat_id}` para cargar todos los burbujitas de chats pasados y pintarlas de color gris o morado (según tu ID verificado contra el autor de forma sincrónica para que no parpadee).
4. Mientras, de fondo, React abre el `WebSocket` hacia FastAPI. Todo esto mientras que un efecto estricto (`isMounted`) previene crear túneles dobles zombies.
5. Haces click en **"Enviar"**. El navegador no hace HTTP, envía un simple envoltorio `ws.send(texto)`.
6. En FastAPI (`main.py`), tu mesero (Endpoint WS Async) avienta el texto al ayudante de Base de Datos para incrustarlo a PostgreSQL (Thread Pool).
7. Cuando el Thread devuelve el mensaje *perfecto* que ya trae Timestamp de Sistema exacto (así React no truena su formateo CSS), el WebSocket Broadcast lo propulsa de vuelta no solo a ti, ¡Sino a todos en esa misma sala!

¡Y Listo! Empieza tu aventura revisando los componentes en `/frontend/src/` y los endpoints en `/backend/main.py`. Mueve cosas, rompe cosas y diviértete programando. 👨‍💻🥳
