import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.onrender.com', 'doctors-farms-frontend-production.up.railway.app', 'doctors-farms-production.up.railway.app'],
  },
});
