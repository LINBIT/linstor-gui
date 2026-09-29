// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect } from '../fixtures';

// Every page renders its heading against the default scenario (3 nodes, 2
// pools each, one resource) without an error in the page.
const PAGES: [string, string | RegExp][] = [
  ['#/', 'Dashboard'],
  ['#/inventory/nodes', 'Node List'],
  ['#/inventory/storage-pools', 'Storage Pool List'],
  ['#/inventory/controller', 'Controller'],
  ['#/storage-configuration/resource-groups', 'Resource Group List'],
  ['#/storage-configuration/resource-overview', 'Resource Overview'],
  ['#/snapshot', 'Snapshot List'],
  ['#/error-reports', 'Error Report List'],
  ['#/reactor', 'DRBD Reactor Configurations'],
  ['#/files', 'External Files'],
  ['#/remote/list', 'Remote List'],
  ['#/schedule/list', 'Schedule List'],
  ['#/auth-tokens', 'Auth Tokens'],
  ['#/users', 'Authentication & Users'],
  ['#/settings', 'Settings'],
];

for (const [path, heading] of PAGES) {
  test(`${path} renders`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('main').getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
  });
}

test('the node list shows the cluster', async ({ page }) => {
  await page.goto('#/inventory/nodes');
  for (const node of ['node01', 'node02', 'node03']) {
    await expect(page.getByRole('cell', { name: node, exact: true })).toBeVisible();
  }
});
