import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // Gelistirmede API ayni kokenden gorunsun: boylece CORS ve
    // karisik icerik (mixed content) sorunlariyla ugrasmiyoruz.
    proxy: { '/api': 'http://127.0.0.1:5080' },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
