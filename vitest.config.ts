import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    // Testy muszą dawać ten sam wynik niezależnie od strefy maszyny.
    env: { TZ: 'America/New_York' },
  },
});
