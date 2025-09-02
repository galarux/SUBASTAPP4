# 🏆 SUBASTAPP - Aplicación de Subastas en Tiempo Real

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/galarux/SUBASTAPP4)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

Aplicación web completa para gestionar subastas de jugadores de fútbol en tiempo real, diseñada para uso móvil y PC.

## 🌟 Características Principales

- ✅ **Subastas en tiempo real** con Socket.IO
- ✅ **Interfaz responsive** optimizada para móvil y PC
- ✅ **Sistema de turnos** para seleccionar jugadores
- ✅ **Gestión de créditos** automática
- ✅ **Base de datos MySQL** con Prisma ORM
- ✅ **Autenticación de usuarios** simple
- ✅ **Imágenes locales** de jugadores
- ✅ **Sistema de reinicio** automático

## 🚀 Tecnologías

### Frontend
- **React 18** + **TypeScript**
- **Vite** (bundler rápido)
- **Tailwind CSS** (estilos responsive)
- **Socket.IO Client** (tiempo real)
- **Zustand** (gestión de estado)

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **Socket.IO** (tiempo real)
- **Prisma** (ORM moderno)
- **MySQL** (base de datos)

## 📋 Prerrequisitos

- Node.js (versión 18 o superior)
- MySQL (local o remoto)
- npm o yarn

## 🛠️ Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/galarux/SUBASTAPP4.git
cd SUBASTAPP4
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

# Crear base de datos
npm run db:push
```

### 3. Configurar el Frontend
```bash
cd ../frontend

# Instalar dependencias
npm install
```

## 🚀 Ejecución

### Desarrollo (Recomendado)
```bash
# Desde el directorio raíz
.\start-all.bat
```

### Por Separado
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## 📱 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (`npm run db:studio`)

## 🎮 Cómo Usar la Aplicación

### 1. Iniciar
```bash
.\start-all.bat
```

### 2. Acceder
- Abre http://localhost:5173
- Inicia sesión con usuarios de prueba:
  - `usuario1@test.com` (Turno 1)
  - `a@a.com` (Turno 2)

### 3. Probar Subasta
1. **Usuario 1** selecciona jugador para subastar
2. **Usuario 1** inicia la subasta
3. **Ambos usuarios** pujan en tiempo real
4. Contador se sincroniza automáticamente
5. Se adjudica al ganador cuando termina

### 4. Reiniciar
```bash
.\reset-auction.bat
```

## 🔧 Solución de Problemas de IP

Si la aplicación no funciona por cambio de IP:

```bash
# Solución automática
powershell -ExecutionPolicy Bypass -File fix-ip.ps1

# Ver documentación completa
# IP-TROUBLESHOOTING.md
```

## 🗄️ Base de Datos

### Tablas Principales
- **usuarios**: Usuarios y créditos
- **items**: Jugadores disponibles
- **pujas**: Historial de pujas
- **configuracion**: Parámetros globales
- **estadoSubasta**: Estado actual

### Comandos Útiles
```bash
# Ver base de datos
npm run db:studio

# Crear migración
npm run db:migrate

# Sincronizar esquema
npm run db:push
```

## 📁 Estructura del Proyecto

```
SUBASTAPP4/
├── frontend/                 # React app
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # Estado global
│   │   ├── services/        # Llamadas API
│   │   └── config/          # Configuración centralizada
│   ├── img/jugadores/       # Imágenes locales
│   └── package.json
│
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── routes/          # Endpoints REST
│   │   ├── sockets/         # Eventos Socket.IO
│   │   ├── scripts/         # Scripts de gestión
│   │   ├── db/              # Configuración DB
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma    # Esquema de base de datos
│   └── package.json
│
├── scripts/                  # Scripts de gestión
│   ├── start-all.bat        # Iniciar aplicación
│   ├── stop-all.bat         # Detener aplicación
│   ├── reset-auction.bat    # Reiniciar subasta
│   └── fix-ip.ps1           # Solucionar problemas de IP
│
└── README.md
```

## 🎯 Funcionalidades Completas

- ✅ Login de usuarios
- ✅ Visualización de jugadores
- ✅ Sistema de pujas en tiempo real
- ✅ Turnos para seleccionar jugadores
- ✅ Gestión de créditos automática
- ✅ Interfaz responsive (móvil + PC)
- ✅ Reinicio automático de subastas
- ✅ Cierre automático de sesiones
- ✅ Notificaciones en tiempo real
- ✅ Sincronización de contadores
- ✅ Imágenes locales de jugadores
- ✅ Sistema de salidas de puja
- ✅ Adjudicación automática

## 🔄 Próximos Pasos

1. ✅ Implementar autenticación completa
2. ✅ Cargar jugadores desde RapidAPI
3. ✅ Implementar lógica de subastas
4. ✅ Añadir validaciones
5. ✅ Mejorar UI/UX
6. ✅ Sistema de reinicio automático
7. ✅ Notificaciones en tiempo real
8. 🔄 Configurar despliegue

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- 📧 **Issues**: [GitHub Issues](https://github.com/galarux/SUBASTAPP4/issues)
- 📚 **Documentación**: [IP-TROUBLESHOOTING.md](IP-TROUBLESHOOTING.md)
- 🐛 **Reportar Bugs**: Crear un issue en GitHub

## 🙏 Agradecimientos

- [RapidAPI Football](https://rapidapi.com/api-sports/api/api-football/) por los datos de jugadores
- [Prisma](https://www.prisma.io/) por el ORM moderno
- [Socket.IO](https://socket.io/) por la comunicación en tiempo real
- [Tailwind CSS](https://tailwindcss.com/) por los estilos responsive

---

⭐ **Si te gusta este proyecto, dale una estrella en GitHub!**
