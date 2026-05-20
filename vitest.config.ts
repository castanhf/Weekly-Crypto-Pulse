import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', 'e2e/**'],
    setupFiles: ['./vitest.setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname)
    }
  }
});
