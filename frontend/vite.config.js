import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = process.env.VITE_PROXY_TARGET || 'http://msm-sis-api:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true
      },
      '/opensis': {
        target: process.env.VITE_OPENSIS_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/opensis/, '')
      }
    }
  }
})