import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['@flakiness/playwright', {
    flakinessProject: 'flakiness/podkeeper',
  }]],
});
