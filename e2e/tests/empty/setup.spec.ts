// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect } from '../fixtures';

// A controller without nodes: the dashboard offers the cluster setup wizard,
// which registers the nodes and a storage pool on each; the mock keeps them.
const NODES = [
  ['e2e-a', '10.0.0.11'],
  ['e2e-b', '10.0.0.12'],
];

test('the setup wizard registers nodes and pools, and a node can be deleted again', async ({ page }) => {
  await page.goto('#/');
  await page.getByRole('button', { name: 'Get started' }).click();
  const wizard = page.getByRole('dialog', { name: 'Cluster setup' });

  await wizard.getByRole('button', { name: /Add another node/ }).click();
  for (const [i, [name, address]] of NODES.entries()) {
    await wizard.getByPlaceholder('node01').nth(i).fill(name);
    await wizard.getByPlaceholder('10.0.0.1').nth(i).fill(address);
  }
  await wizard.getByRole('button', { name: 'Next' }).click();

  const pool = wizard.getByRole('combobox', { name: 'Device / pool' });
  await pool.fill('vg0/thinpool');
  await pool.press('Enter');
  await wizard.getByRole('button', { name: 'Next' }).click();

  await wizard.getByLabel('Resource group name').fill('e2e-rg');
  await wizard.getByRole('button', { name: 'Next' }).click();

  await expect(wizard.getByText('e2e-a (10.0.0.11:3366)')).toBeVisible();
  await wizard.getByRole('button', { name: 'Create cluster' }).click();
  await expect(wizard.getByText('Cluster set up successfully')).toBeVisible();
  await wizard.getByRole('button', { name: 'Close' }).last().click();

  await page.goto('#/inventory/nodes');
  const nodeRow = (name: string) =>
    page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });
  for (const [name] of NODES) {
    await expect(nodeRow(name)).toBeVisible();
  }

  await page.goto('#/inventory/storage-pools');
  await expect(page.getByRole('row').filter({ hasText: 'lvm-thin-pool' })).toHaveCount(NODES.length);

  await page.goto('#/inventory/nodes');
  await nodeRow('e2e-b').getByRole('img', { name: 'more' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
  await expect(nodeRow('e2e-b')).toHaveCount(0);
  await expect(nodeRow('e2e-a')).toBeVisible();
});
