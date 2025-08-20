# 📱 Aplicación Web para Subasta en Tiempo Real (Mobile + PC)

## 🎯 Objetivo General

Desarrollar una aplicación web extremadamente sencilla y responsive, pensada para usarse desde el móvil y también desde PC, que permita gestionar una subasta en tiempo real.

---

## ✅ Requisitos Funcionales

### General
- Cada usuario parte con 2.000 créditos que le permiten pujar. Cada item tiene un precio de salida en créditos establecido por el pujador. Debe tener un valor por defecto almacenado en bbdd que será 5 inicialmente pero podria modificarse manualmente por un usuario directamente contra la tabla (no interfaz) mediante UPDATE, incluso en mitad de una subasta.

- Inicialmente se establecerá un orden de puja para los usuarios. Para ello se guardara en bbdd el orden, en un campo en la tabla usuarios (1,2,3...) que se rellenara mediante UPDATE directamente a bbdd (no interfaz).

- Si un jugador no tiene creditos sale de la subasta y no podra pujar ni sacar nuevos jugadores en su turno.

- Si un jugador alcanza 25 jugadores (items) sale de la subasta y no podra pujar ni sacar nuevos jugadores en su turno.

### 1. Login
- Cada usuario debe autenticarse con su dispositivo móvil o PC.
- No hace falta registro, basta con un login simple (correo o nombre de usuario único). Yo los daré de alta en una bbdd en su momento, para pruebas haz lo mas basico que se pueda para simularlo.
- Se debe identificar claramente quién es cada pujador.


### 2. Visualización del ítem en subasta
- Todos los usuarios logados deben ver el ítem que se está subastando actualmente en tiempo real.
- Se muestra nombre, equipo, posicion y una imagen si hay.
- Los items que se subastan son JUGADORES. Se tiene una bbdd accesible con una tabla llamada jugadores como la siguiente.

#### JUGADORES
Son los jugadores reales de la liga española.

TABLA: jugadores_reales
Es un maestro de todos los jugadores que juegan La Liga española en la temporada 2025/26 en adelante.
Se cargarán desde la api-football de rapidapi.
Debe almacenarse:
- Identificador único: no debe ser autoincremental, ya que lo igualaremos al id de rapid_api
- Nombre
- Fecha nacimiento
- Nacionalidad
- Peso (varchar)
- Altura (varchar)
- Lesionado (si/no)
- Foto_Url
- Equipo
- Posicion: este campo estará en blanco porque no se carga desde RAPIDAPI. Sus valores pueden ser PORTERO, DEFENSA, MEDIO, DELANTERO.

Ejemplo llamada rapidapi
Obtiene los jugadores de La Liga de la temporada 2025/26
https://api-football-v1.p.rapidapi.com/v3/players?league=140&season=2025

### 3. Pujar
- Cada usuario puede introducir una cantidad manual y pulsar "Pujar".
- Alternativamente, puede pulsar un botón de subida rápida que aumente automáticamente la puja actual en una cantidad fija (por ejemplo, +5€).
- el tiempo de puja debe ser configurable, por defecto 30 sg.
- el usuario puede pulsar un boton y salir de la puja actual. Si todos los jugadores salen, la puja activa se da por ganada y el item se asigna al usuario de la puja activa.
- Se deben almacenar todas las pujas ganadoras.
- Si termina el tiempo de la puja, la puja activa se da por ganada y el item se asigna al usuario de la puja activa.

### 4. Turnos para seleccionar el ítem a subastar
- Por turnos, cada usuario puede elegir el siguiente ítem a subastar. 
- Para ello, debe usarse un buscador con autocompletar:
  - Solo muestra ítems que aún **no han sido subastados**
  - Al seleccionar uno, lo establece como "ítem actual"

### 5. Tiempo real
- Todos los cambios (nueva puja, cambio de ítem, etc.) deben reflejarse **en tiempo real** en todos los dispositivos conectados.

---

## 🧱 Tecnologías Recomendadas

### Frontend (interfaz web responsive)
- **Framework**: React + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Estado compartido**: React Context o Zustand
- **Sockets**: Socket.IO cliente

### Backend (API + tiempo real)
- **Servidor**: Node.js + Express
- **Tiempo real**: Socket.IO
- **Base de datos**: MySql 
- **ORM**: Prisma

### Autenticación
- Clerk, Auth0 o Supabase Auth (login sencillo)

### Hosting
- Frontend: Vercel o Netlify
- Backend: Render o Railway
- DB: Supabase o Railway


---

## 🗂️ Estructura de Carpetas Propuesta
- Usa comandos de PowerShell para gestionarlo. Utilizaremos windows en local.


```bash
subasta-app/
├── frontend/                # React app (Vite + Tailwind)
│   ├── public/
│   ├── src/
│   │   ├── components/      # Botones, inputs, layout
│   │   ├── pages/           # Páginas principales (Login, Subasta)
│   │   ├── hooks/           # Lógica reutilizable
│   │   ├── context/         # Estado global (usuario, ítem actual)
│   │   ├── services/        # Llamadas API
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── tailwind.config.ts
│
├── backend/                 # Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── routes/          # Endpoints REST
│   │   ├── sockets/         # Eventos en tiempo real
│   │   ├── db/              # Conexión y modelos (Prisma)
│   │   └── server.ts
│   └── prisma/
│       └── schema.prisma    # Definición de tablas (ítems, usuarios, pujas)
│
├── .env                     # Configuración sensible (claves, DB, etc.)
├── README.md
	└── package.json             # Raíz con workspaces opcional
	```

## Produccion
- Debe ser sencillo poner todo en produccion. Tengo un hosting en hostinger, pero puedo usar otras cosas si son gratis y fiables.
- En local tengo una bbdd Mysql y se requiere poder hacer pruebas.