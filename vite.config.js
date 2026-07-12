import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  // VITE_PUBLIC_BASE lets us emit absolute asset URLs when the app is hosted
  // under a non-root path (e.g. Supabase Storage). Defaults to '/' for
  // Cloudflare Pages / normal root hosting.
  base: process.env.VITE_PUBLIC_BASE || '/',
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
