import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  resolve: {
    alias: {
      // Previously provided by @base44/vite-plugin; now defined here so `@/…`
      // imports keep resolving to ./src after removing the Base44 toolchain.
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
  ],
});
