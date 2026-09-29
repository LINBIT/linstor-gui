// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { defineConfig, devices } from '@playwright/test';

// End-to-end tests: the built GUI (vite preview, run `npm run build` first)
// against the API mock in e2e/mock. Each scenario gets its own mock and its
// own preview server proxied to it; a project runs the tests in
// e2e/tests/<scenario>/. The mock keeps state (settings, users, the empty
// scenario's nodes), so tests run one at a time.
const SCENARIOS = [
  { name: 'default', mockPort: 43611, guiPort: 43621 },
  { name: 'empty', mockPort: 43612, guiPort: 43622 },
  { name: 'workflows', mockPort: 43613, guiPort: 43623 },
];

const CI = !!process.env.CI;

interface WebServer {
  command: string;
  env: Record<string, string>;
  url: string;
  reuseExistingServer: boolean;
}

export default defineConfig({
  testDir: './e2e/tests',
  workers: 1,
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: CI
    ? [
        ['list'],
        ['junit', { outputFile: 'e2e-junit.xml' }],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ]
    : 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: SCENARIOS.map(({ name, guiPort }) => ({
    name,
    testMatch: `${name}/**/*.spec.ts`,
    use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${guiPort}/` },
  })),
  webServer: SCENARIOS.flatMap(({ name, mockPort, guiPort }): WebServer[] => [
    {
      command: 'node e2e/mock/server.js',
      env: { MOCK_SCENARIO: name, PORT: String(mockPort), MOCK_VERBOSE: '0' },
      url: `http://127.0.0.1:${mockPort}/v1/controller/version`,
      // Never reuse: the mock keeps state, and every run starts from the scenario.
      reuseExistingServer: false,
    },
    {
      command: `npx vite preview --host 127.0.0.1 --port ${guiPort} --strictPort`,
      env: { VITE_LINSTOR_API_HOST: `http://127.0.0.1:${mockPort}` },
      url: `http://127.0.0.1:${guiPort}/`,
      reuseExistingServer: !CI,
    },
  ]),
});
