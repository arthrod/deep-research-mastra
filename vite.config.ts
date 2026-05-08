import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    cloudflare({
      configPath: './wrangler.jsonc',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4000,
  },
  build: {
    outDir: 'dist',
  },
})
