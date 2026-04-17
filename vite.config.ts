import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "/",
  // Dev-only proxy — in production the frontend calls the backend URL directly
  // via the VITE_API_BASE_URL env var (e.g. https://ecofeast-api.onrender.com/api)
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(new URL('.', import.meta.url).pathname),
    }
  }
});
