import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for visual regression testing.
 * Tests the webview React app in isolation (outside VSCode).
 */
export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    // Base URL for the test server
    baseURL: 'http://localhost:5173',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Capture trace on failure
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'npm run visual:serve',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Snapshot settings for visual regression
  expect: {
    toHaveScreenshot: {
      // Allow small differences due to anti-aliasing
      maxDiffPixelRatio: 0.01,
      // Animation threshold
      animations: 'disabled',
    },
  },
});
