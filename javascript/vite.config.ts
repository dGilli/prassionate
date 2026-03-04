import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'tracker.ts'),
      name: 'PrassionateTracker',
      fileName: 'tracker',
      formats: ['es', 'umd', 'iife'],
    },
    rollupOptions: {
      output: {
        globals: {
          window: 'window',
          document: 'document',
          navigator: 'navigator',
        },
      },
    },
    minify: 'terser',
    target: 'es2018',
    outDir: '../web/static',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
