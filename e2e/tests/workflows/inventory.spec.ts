// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, pick, toast, type Page } from '../fixtures';

const rowWith = (page: Page, ...cells: string[]) => {
  let rows = page.getByRole('row');
  for (const name of cells) rows = rows.filter({ has: page.getByRole('cell', { name, exact: true }) });
  return rows;
};

const deleteFromRowMenu = async (page: Page, ...cells: string[]) => {
  await rowWith(page, ...cells)
    .getByRole('img', { name: 'more' })
    .click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
};

// Searched for: other tests add pools too, and the list has pages.
const searchPools = async (page: Page, name: string) => {
  await page.getByPlaceholder('Storage Pool Name').fill(name);
  await page.getByRole('button', { name: 'Search' }).click();
};

test('a node is added, listed and deleted', async ({ page }) => {
  // From the list, as a user gets there: the form goes back when it is done.
  await page.goto('#/inventory/nodes');
  await page.goto('#/inventory/nodes/create');
  await page.getByLabel('Name', { exact: true }).fill('e2e-node');
  await page.getByLabel('IP', { exact: true }).fill('10.0.9.9');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, "New node 'e2e-node' registered.")).toBeVisible();
  await expect(page).toHaveURL(/#\/inventory\/nodes$/);
  await expect(rowWith(page, 'e2e-node')).toBeVisible();

  await deleteFromRowMenu(page, 'e2e-node');
  await expect(toast(page, "Node 'e2e-node' deleted.")).toBeVisible();
  await expect(rowWith(page, 'e2e-node')).toHaveCount(0);
});

test('a node whose name is taken is refused, and the form keeps what was typed', async ({ page }) => {
  await page.goto('#/inventory/nodes');
  await page.goto('#/inventory/nodes/create');
  await page.getByLabel('Name', { exact: true }).fill('node01');
  await page.getByLabel('IP', { exact: true }).fill('10.0.9.9');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, "A node with the name 'node01' already exists.")).toBeVisible();
  await expect(page).toHaveURL(/#\/inventory\/nodes\/create$/);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('node01');
});

test('a storage pool is created on a new device, listed and deleted', async ({ page }) => {
  await page.goto('#/inventory/storage-pools');
  await page.goto('#/inventory/storage-pools/create');
  await page.getByLabel('Storage Pool Name').fill('e2esp');
  await pick(page, 'Node', 'node01');
  await pick(page, 'Device Path', '/dev/sdb');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, "Successfully created storage pool 'e2esp' on node 'node01'.")).toBeVisible();
  await expect(page).toHaveURL(/#\/inventory\/storage-pools$/);
  await searchPools(page, 'e2esp');
  await expect(rowWith(page, 'e2esp', 'node01')).toBeVisible();

  await deleteFromRowMenu(page, 'e2esp', 'node01');
  await expect(toast(page, "Storage pool 'e2esp' on node 'node01' deleted.")).toBeVisible();
  await expect(rowWith(page, 'e2esp', 'node01')).toHaveCount(0);
});

test('a storage pool is created from an existing volume group on two nodes', async ({ page }) => {
  await page.goto('#/inventory/storage-pools');
  await page.goto('#/inventory/storage-pools/create');
  await page.getByText('Existing Device').click();
  await page.getByLabel('Storage Pool Name').fill('e2evg');
  // Always several nodes for an existing pool.
  await pick(page, 'Node', 'node02');
  await pick(page, 'Node', 'node03');
  await page.keyboard.press('Escape');
  await page.getByLabel('Volume Group/Thin Pool').fill('vg_e2e');
  await page.getByRole('button', { name: 'Submit' }).click();
  // One pool per node, and one step back to the list (not one per node).
  await expect(toast(page, "New storage pool 'e2evg' on node 'node02' registered.")).toBeVisible();
  await expect(toast(page, "New storage pool 'e2evg' on node 'node03' registered.")).toBeVisible();
  await expect(page).toHaveURL(/#\/inventory\/storage-pools$/);
  await searchPools(page, 'e2evg');
  await expect(rowWith(page, 'e2evg', 'node02')).toBeVisible();
  await expect(rowWith(page, 'e2evg', 'node03')).toBeVisible();
});

test('a ZFS storage pool is created on a new device', async ({ page }) => {
  await page.goto('#/inventory/storage-pools');
  await page.goto('#/inventory/storage-pools/create');
  await page.getByLabel('Storage Pool Name').fill('e2ezfs');
  await pick(page, 'Node', 'node02');
  await pick(page, 'Type', 'ZFS');
  await pick(page, 'Device Path', '/dev/sdc');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, "Successfully created storage pool 'e2ezfs' on node 'node02'.")).toBeVisible();
  await searchPools(page, 'e2ezfs');
  await expect(rowWith(page, 'e2ezfs', 'node02')).toContainText('ZFS');
});
