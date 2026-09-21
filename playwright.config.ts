import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    // Use the user's installed Chrome rather than downloading another browser.
    channel: 'chrome',
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    port: 4173,
    reuseExistingServer: true,
  },
})
