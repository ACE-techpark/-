import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 120000, fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5175', browserName: 'chromium', channel: 'msedge', headless: true, trace: 'retain-on-failure' },
  webServer: [
    { command: 'node server/index.js', url: 'http://127.0.0.1:3002/api/health', reuseExistingServer: false,
      env: { PORT: '3002', GAME_STATE_FILE: 'test-results/e2e-games.json' } },
    { command: 'node node_modules/vite/bin/vite.js --host --port 5175 --strictPort', url: 'http://127.0.0.1:5175', reuseExistingServer: false,
      env: { PORT: '3002', VITE_PUBLIC_GAME_URL: '' } },
  ],
});
