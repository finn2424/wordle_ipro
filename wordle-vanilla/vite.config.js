import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5031',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
