import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/strategy-quiz/',
  // public/404.html is automatically copied to dist/404.html by Vite's
  // static file handling — no need to list it as a Rollup entry point.
})
