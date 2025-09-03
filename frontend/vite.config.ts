import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Configuración específica para Azure
    target: 'es2020',
    rollupOptions: {
      // Forzar uso de Rollup sin dependencias nativas problemáticas
      external: [],
      output: {
        // Asegurar compatibilidad
        format: 'es',
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash].[ext]'
      }
    },
    // Optimizaciones para Azure
    minify: 'terser',
    sourcemap: false,
    // Evitar problemas de dependencias nativas
    commonjsOptions: {
      include: []
    }
  },
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    host: true
  },
  // Configuración de optimización
  optimizeDeps: {
    // Forzar resolución de dependencias
    force: true,
    // Incluir solo dependencias esenciales
    include: ['react', 'react-dom', 'socket.io-client', 'zustand']
  },
  // Configuración de resolución
  resolve: {
    // Priorizar módulos ES
    mainFields: ['module', 'main'],
    // Evitar problemas de extensión
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  // Forzar Vite a usar Rollup en JavaScript puro
  define: {
    'process.env.ROLLUP_NATIVE': 'false'
  },
  // Configuración específica para evitar módulos nativos
  ssr: {
    noExternal: ['rollup']
  }
})
