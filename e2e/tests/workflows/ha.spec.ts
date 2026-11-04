// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, pick, toast, type Page } from '../fixtures';

// The scenario's "demo" resource, placed on node01 and node02. The mock's
// drbd-reactor promotes it on node01 first and moves it on an evict.
const haRow = (page: Page) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'demo', exact: true }) });

const rowAction = async (page: Page, action: string) => {
  await haRow(page).getByRole('img', { name: 'more' }).click();
  await page.getByRole('menu').last().getByRole('menuitem', { name: action }).click();
};

test('an HA configuration is created, evicted to another node, and deleted', async ({ page }) => {
  // From the list, as a user gets there: the editor goes back when it is done.
  await page.goto('#/reactor');
  await page.goto('#/reactor/create');
  await pick(page, 'Resource Name', 'demo');
  await page.getByLabel('Config File').fill('demo');
  await page.getByRole('button', { name: 'Add Systemd/Mount' }).click();
  const unit = page.getByRole('dialog').filter({ hasText: 'Add Systemd/Mount' });
  await unit.getByLabel('Unit Name').fill('e2e.service');
  await unit.getByRole('button', { name: 'Add' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(toast(page, 'Operation Successful')).toBeVisible();
  await expect(page).toHaveURL(/#\/reactor$/);
  await expect(haRow(page)).toContainText('node01');

  await rowAction(page, 'Evict');
  await page.getByRole('dialog').getByRole('button', { name: 'Evict' }).click();
  await expect(toast(page, '"demo" migrated to node02')).toBeVisible();
  await expect(haRow(page)).toContainText('node02');
  await expect(page.getByRole('alert').filter({ hasText: 'Evicting "demo"' })).toBeHidden();

  await rowAction(page, 'Delete');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(haRow(page)).toHaveCount(0);
});
