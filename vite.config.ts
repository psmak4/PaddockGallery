import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // DexGallery's dev server uses 5173; keep the two siblings apart.
  server: { port: 5174 },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
    // Agent worktrees (.claude/worktrees/…) hold whole copies of the repo; don't run their tests too.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
