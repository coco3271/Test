import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the build works inside the iOS/Android web view.
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
  server: { host: true },
});
