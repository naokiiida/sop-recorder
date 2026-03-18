import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    mockReset: true,
    restoreMocks: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
    },
  },
  plugins: [WxtVitest()],
});
