import { defineConfig, devices } from "@playwright/test";

// End-to-end test config. Playwright drives a real browser against the app.
export default defineConfig({
  testDir: "./e2e",
  // Fail the run if someone leaves test.only in the code (would skip everything else).
  forbidOnly: !!process.env.CI,
  reporter: "list",

  use: {
    // Dedicated port so E2E never collides with another dev server (e.g. a
    // portfolio site on the default 5173). --strictPort makes Vite fail loudly
    // instead of silently picking a different port.
    baseURL: "http://localhost:5199",
    // Capture a trace (DOM + screenshots) when a test retries — great for debugging.
    trace: "on-first-retry",
  },

  // Playwright starts this for you before the tests, and shuts it down after.
  webServer: {
    command: "npm run dev -- --port 5199 --strictPort",
    url: "http://localhost:5199",
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
