import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3100,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://kg-ai-cobol-modernize:3050',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: process.env.VITE_API_URL || 'http://kg-ai-cobol-modernize:3050',
        changeOrigin: true,
        secure: false
      },
      '/gateway': {
        target: 'http://sentineli-gateway:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/gateway/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
