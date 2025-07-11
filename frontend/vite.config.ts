import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path'; // ✅ required for path.resolve()

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // ✅ this enables @/components and more
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
