// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { Route } from '@playwright/test';

import { test, expect, pick, type Page } from '../fixtures';

// A submit whose request fails shows an error and leaves the form to try
// again, whichever way it fails: the controller refuses (an error status with
// an ApiCallRc list), a proxy in front of it answers with an HTML error page,
// or no answer comes at all (a failover, a dropped connection).
const FAILURES: { name: string; fail: (route: Route) => Promise<void> }[] = [
  {
    name: 'the controller refuses',
    fail: (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify([{ ret_code: -4611686018406153700, message: 'Refused by the e2e test.' }]),
      }),
  },
  {
    name: 'a proxy answers 502',
    fail: (route) =>
      route.fulfill({ status: 502, contentType: 'text/html', body: '<html><body>Bad Gateway</body></html>' }),
  },
  { name: 'no answer comes', fail: (route) => route.abort('connectionrefused') },
];

type Form = {
  name: string;
  /** Where the form is; the first goto opens the list it goes back to. */
  list: string;
  create: string;
  /** The write the submit sends. */
  request: RegExp;
  method: 'POST' | 'PUT';
  fill: (page: Page) => Promise<void>;
};

const FORMS: Form[] = [
  {
    name: 'resource group',
    list: '#/storage-configuration/resource-groups',
    create: '#/storage-configuration/resource-groups/create',
    request: /\/v1\/resource-groups$/,
    method: 'POST',
    fill: (page) => page.getByLabel('Resource Group Name').fill('e2e-fail-group'),
  },
  {
    name: 'resource definition',
    list: '#/storage-configuration/resource-overview',
    create: '#/storage-configuration/resource-definitions/create',
    request: /\/v1\/resource-definitions$/,
    method: 'POST',
    fill: (page) => page.getByLabel('Name').first().fill('e2e-fail-res'),
  },
  {
    name: 'node',
    list: '#/inventory/nodes',
    create: '#/inventory/nodes/create',
    request: /\/v1\/nodes$/,
    method: 'POST',
    fill: async (page) => {
      await page.getByLabel('Name', { exact: true }).fill('e2e-fail-node');
      await page.getByLabel('IP', { exact: true }).fill('10.0.9.20');
    },
  },
  {
    name: 'storage pool',
    list: '#/inventory/storage-pools',
    create: '#/inventory/storage-pools/create',
    request: /\/v1\/physical-storage\/[^/]+$/,
    method: 'POST',
    fill: async (page) => {
      await page.getByLabel('Storage Pool Name').fill('e2efail');
      await pick(page, 'Node', 'node03');
      await page.keyboard.press('Escape');
      await pick(page, 'Device Path', '/dev/sdb');
      await page.keyboard.press('Escape');
    },
  },
  {
    name: 'external file',
    list: '#/files',
    create: '#/files/create',
    request: /\/v1\/files\/[^/]+$/,
    method: 'PUT',
    fill: async (page) => {
      await page.getByLabel('Path').fill('/etc/linstor.d/e2e-fail.conf');
      await page.getByLabel('Content').fill('x = 1\n');
    },
  },
];

const errorToast = (page: Page) => page.locator('.ant-message-notice:has(.ant-message-error)');

for (const form of FORMS) {
  test(`a ${form.name} whose submit fails shows the error, and a retry goes through`, async ({ page }) => {
    for (const failure of FAILURES) {
      await test.step(failure.name, async () => {
        await page.goto(form.list);
        // Two hash changes in a row can leave the last step's form mounted,
        // with what it chose still in it; wait for it to be gone.
        await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(0);
        await page.goto(form.create);
        await form.fill(page);
        let sent = 0;
        await page.route(form.request, (route) => {
          if (route.request().method() !== form.method) return route.fallback();
          sent += 1;
          return failure.fail(route);
        });
        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(errorToast(page).first()).toBeVisible();
        expect(sent).toBeGreaterThan(0);
        // Still on the form, and Submit can be pressed again.
        await expect(page).toHaveURL(new RegExp(`${form.create.replace(/[/#]/g, '\\$&')}$`));
        await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
        await expect(page.getByRole('button', { name: 'Submit' })).not.toHaveClass(/ant-btn-loading/);
        await page.unroute(form.request);
        // The next failure must show its own error, not find this one.
        await page.evaluate("document.querySelectorAll('.ant-message-notice').forEach((n) => n.remove())");
      });
    }

    // The same form, sent again without a failure, is created.
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page).toHaveURL(new RegExp(`${form.list.replace(/[/#]/g, '\\$&')}$`));
  });
}
