import { defineConfig, devices } from '@playwright/test';

/* ============================================================
 * Mock-mode-only by design (per user decision, 2026-09): every test drives
 * the dev server with NEXT_PUBLIC_USE_MOCKS=true, the same mode this whole
 * Asset Land/Inventory feature was built and verified in. Not wired for a
 * real deployment target — that would need real auth, real seeded fixtures,
 * and a different mental model for "did this mutation actually happen."
 *
 * The mock backend keeps its state in the dev server process's memory, not a
 * database — there is no reset between tests. Specs are written to read
 * current state before acting and assert on the delta, not on hardcoded
 * absolute values, so they don't depend on running against a freshly booted
 * server or on any particular run order.
 * ============================================================ */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // shared in-memory mock state — parallel workers would race each other
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_USE_MOCKS: 'true' },
    timeout: 60_000,
  },
});
