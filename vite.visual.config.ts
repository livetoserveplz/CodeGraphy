import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite config for visual regression testing.
 * Serves the webview with mocked VSCode API for Playwright tests.
 */
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'tests/visual'),
  publicDir: resolve(__dirname, 'tests/visual/public'),
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    // Mark as visual test mode
    'import.meta.env.VISUAL_TEST': JSON.stringify(true),
  },
});
