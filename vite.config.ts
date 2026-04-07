import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from this folder even if the shell cwd is not the project root
// https://vite.dev/config/shared-options.html#envdir
export default defineConfig({
  envDir: path.resolve(__dirname),
  plugins: [react(), tailwindcss()],
  // Spotify redirects to http://127.0.0.1:5173 — on Windows, default "localhost"
  // can listen only on IPv6 (::1), so 127.0.0.1 gets ERR_CONNECTION_REFUSED.
  server: {
    host: true,
    port: 5173,
  },
})