import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-maplibre': ['maplibre-gl'],
          'vendor-spatial': ['rbush', 'flatgeobuf'],
          'vendor-ui': ['@tanstack/react-table', '@tanstack/react-virtual', 'lucide-react'],
        },
      },
    },
  },
});
