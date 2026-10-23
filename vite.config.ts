import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@makko/engine': '/src/engine/makko-engine.ts',
    },
  },
});

