import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    // allow the site to be served over a Cloudflare/ngrok tunnel domain
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
})
