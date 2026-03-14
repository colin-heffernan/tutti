import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react";
import path from 'path';

export default defineConfig({
  plugins: [
    react()
  ],
  base: '/static/', // This should match Django's settings.STATIC_URL
  build: {
    // Where Vite will save its output files.
    // This should be something in your settings.STATICFILES_DIRS
    outDir: path.resolve(__dirname, './static/frontend'),
    emptyOutDir: false, // Preserve the outDir to not clobber Django's other files.
    manifest: "manifest.json",
    rollupOptions: {
      input: {
        'index': path.resolve(__dirname, './src/index.jsx'),
      },
      output: {
        // Output JS bundles to js/ directory with -bundle suffix
        entryFileNames: `[name].js`,
      },
    },
  },
  server: {
    cors: {
        origin: 'http://127.0.0.1:8000',
    },
  },
});