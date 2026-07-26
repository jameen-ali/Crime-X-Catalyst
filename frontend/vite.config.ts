import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // In dev: proxy to local backend. In prod: VITE_API_BASE_URL points to AppSail.
  const backendTarget = env.VITE_API_BASE_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    base: '/',
    server: {
      port: 5173,
      proxy: {
        // Forward all /api/* requests to the FastAPI backend (dev only)
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Split large vendor chunks to avoid bundle size warnings.
          // manualChunks must be a function in Rollup 4+ (Vite 5+).
          manualChunks(id: string) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/plotly.js')) {
              return 'vendor-charts'
            }
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
              return 'vendor-map'
            }
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) {
              return 'vendor-ui'
            }
          },
        },
      },
    },
  }
})
