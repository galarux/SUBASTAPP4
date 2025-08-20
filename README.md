 # 🏆 Subasta App - Aplicación de Subastas en Tiempo Real

Aplicación web para gestionar subastas de jugadores de fútbol en tiempo real, diseñada para uso móvil y PC.

## 🚀 Tecnologías

### Frontend
- **React 18** + **TypeScript**
- **Vite** (bundler)
- **Tailwind CSS** (estilos)
- **Socket.IO Client** (tiempo real)
- **Zustand** (gestión de estado)

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **Socket.IO** (tiempo real)
- **Prisma** (ORM)
- **MySQL** (base de datos)

## 📋 Prerrequisitos

- Node.js (versión 18 o superior)
- MySQL (local o remoto)
- npm o yarn

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd SUBASTAPP
```

### 2. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
copy env.example .env

# Editar .env con tus credenciales de base de datos
# DATABASE_URL="mysql://usuario:password@localhost:3306/subasta_app"

# Generar cliente de Prisma
npm run db:generate

# Crear base de datos (asegúrate de que MySQL esté corriendo)
npm run db:push
```

### 3. Configurar el Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install
```

## 🚀 Ejecución

### Desarrollo

**Opción 1 - Iniciar todo junto:**
```bash
# Desde el directorio raíz
.\start-all.bat
```

**Opción 2 - Iniciar por separado:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Producción

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

## 📱 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (ejecutar `npm run db:studio`)

## 🎮 Cómo Usar la Aplicación

### 1. Iniciar la Aplicación
```bash
.\start-all.bat
```

### 2. Acceder a la Aplicación
- Abre http://localhost:5173 en tu navegador
- Inicia sesión con uno de los usuarios de prueba:
  - `usuario1@test.com` (Turno 1)
  - `a@a.com` (Turno 2)

### 3. Probar la Subasta
1. **Usuario 1** selecciona un jugador para subastar
2. **Usuario 1** inicia la subasta
3. **Ambos usuarios** pueden pujar en tiempo real
4. El contador se sincroniza automáticamente
5. Cuando termina el tiempo, se adjudica al ganador

### 4. Reiniciar la Subasta
```bash
.\reset-auction.bat
```
- Cierra automáticamente todas las sesiones
- Resetea créditos y datos
- Los usuarios deben volver a iniciar sesión

## 🗄️ Base de Datos

### Tablas principales:
- **usuarios**: Información de usuarios y créditos
- **items**: Jugadores disponibles para subasta
- **pujas**: Historial de pujas realizadas
- **configuracion**: Configuración global del sistema

### Comandos útiles:
```bash
# Ver base de datos en navegador
npm run db:studio

# Crear migración
npm run db:migrate

# Sincronizar esquema
npm run db:push
```

## 🔄 Gestión de Subastas

### Reiniciar Subasta
Para reiniciar completamente la subasta y cerrar todas las sesiones de usuario:

```bash
# Opción 1 - Usar el script batch (recomendado)
.\reset-auction.bat

# Opción 2 - Ejecutar directamente
cd backend && npx ts-node src/scripts/resetAuction.ts
```

### Limpiar Datos
Para limpiar solo los datos sin cerrar sesiones:

```bash
cd backend && npx ts-node src/scripts/cleanupData.ts
```

### Scripts Disponibles
- **`reset-auction.bat`**: Reinicia subasta y cierra todas las sesiones
- **`cleanupData.ts`**: Limpia datos sin cerrar sesiones
- **`resetAuction.ts`**: Script completo de reinicio con notificaciones

### ¿Qué hace el reinicio?
1. **Limpia estado de subasta** - Elimina todas las pujas y estados
2. **Resetea créditos** - Todos los usuarios vuelven a 2000 créditos
3. **Elimina duplicados** - Limpia jugadores duplicados
4. **Notifica usuarios** - Envía alerta a todos los usuarios conectados
5. **Cierra sesiones** - Redirige automáticamente al login

## 🖼️ Imágenes de Jugadores

La aplicación incluye imágenes locales de jugadores ubicadas en `frontend/img/jugadores/`. El sistema asigna automáticamente una imagen aleatoria a cada jugador durante el proceso de reinicio.

### Estructura de imágenes:
```
frontend/img/jugadores/
├── Adrian_18812.png
├── Adam_Aznou_Ben_Cheikh_431921.png
├── Aimar_Dunabeitia_384262.png
└── ... (más de 50 imágenes)
```

### Asignación automática:
- Cada vez que se ejecuta `reset-auction.bat`, se insertan 50 jugadores
- A cada jugador se le asigna una imagen aleatoria de la carpeta
- Las imágenes se cargan localmente para mejor rendimiento

## 🔧 Configuración

### Variables de entorno (.env)

```env
# Base de datos
DATABASE_URL="mysql://usuario:password@localhost:3306/subasta_app"

# Servidor
PORT=3001

# CORS
CORS_ORIGIN="http://localhost:5173"

# RapidAPI (para cargar jugadores)
RAPIDAPI_KEY="tu_api_key_aqui"
RAPIDAPI_HOST="api-football-v1.p.rapidapi.com"

# JWT
JWT_SECRET="tu_secreto_jwt_aqui"
```

## 📁 Estructura del Proyecto

```
SUBASTAPP/
├── frontend/                 # React app
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # Estado global
│   │   ├── services/        # Llamadas API
│   │   └── App.tsx
│   ├── img/
│   │   └── jugadores/       # Imágenes locales de jugadores
│   └── package.json
│
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── routes/          # Endpoints REST
│   │   ├── sockets/         # Eventos Socket.IO
│   │   ├── scripts/         # Scripts de gestión
│   │   │   ├── cleanupData.ts    # Limpieza de datos
│   │   │   └── resetAuction.ts   # Reinicio completo
│   │   ├── db/              # Configuración DB
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma    # Esquema de base de datos
│   └── package.json
│
├── start-all.bat            # Iniciar aplicación completa
├── reset-auction.bat        # Reiniciar subasta
└── README.md
```

## 🎯 Funcionalidades

- ✅ Login de usuarios
- ✅ Visualización de jugadores en subasta
- ✅ Sistema de pujas en tiempo real
- ✅ Turnos para seleccionar jugadores
- ✅ Gestión de créditos
- ✅ Interfaz responsive (móvil + PC)
- ✅ Reinicio automático de subastas
- ✅ Cierre automático de sesiones
- ✅ Notificaciones en tiempo real
- ✅ Sincronización de contadores
- ✅ Imágenes locales de jugadores
- ✅ Sistema de salidas de puja
- ✅ Adjudicación automática cuando solo queda un usuario

## 🔄 Próximos pasos

1. ✅ Implementar autenticación completa
2. ✅ Cargar jugadores desde RapidAPI
3. ✅ Implementar lógica de subastas
4. ✅ Añadir validaciones
5. ✅ Mejorar UI/UX
6. ✅ Sistema de reinicio automático
7. ✅ Notificaciones en tiempo real
8. Configurar despliegue

## 📞 Soporte

Para dudas o problemas, revisa la documentación o crea un issue en el repositorio.
