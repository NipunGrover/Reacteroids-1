import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{port :5555},
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})
