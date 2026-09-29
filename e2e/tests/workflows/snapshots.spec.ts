// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, toast, type Page } from '../fixtures';

// Snapshots of the scenario's "demo" resource (placed on node01 and node02).
const openSnapshotDialog = async (page: Page) => {
  await page.goto('#/storage-configuration/resource-overview');
  const replica = page.getByRole('row', { name: /^node01 / });
  // Expand "demo" unless it still is from the previous snapshot: the goto
  // above does not reload an overview that is already open.
  if (!(await replica.isVisible())) {
    await page.getByRole('row').filter({ hasText: 'demo' }).first().getByRole('button').first().click();
  }
  await replica.getByRole('img', { name: 'more' }).click();
  // Exact, and in the row menu: the sidebar has a "Snapshots" item too.
  await page.getByRole('menu').last().getByRole('menuitem', { name: 'Snapshot', exact: true }).click();
  // The dialog has no accessible name; its title identifies it.
  return page.getByRole('dialog').filter({ hasText: 'Create Snapshot' });
};

const takeSnapshot = async (page: Page, name: string) => {
  const dialog = await openSnapshotDialog(page);
  await dialog.getByRole('textbox').fill(name);
  await dialog.getByRole('button', { name: 'OK' }).click();
  return dialog;
};

test('snapshots are taken, a duplicate name is refused, and both are deleted at once', async ({ page }) => {
  let dialog = await takeSnapshot(page, 'e2e-snap-1');
  // The toast names the snapshot, not the trailing "Resumed IO" step.
  await expect(toast(page, "New snapshot 'e2e-snap-1' of resource 'demo' registered.")).toBeVisible();
  await expect(dialog).toBeHidden();

  dialog = await takeSnapshot(page, 'e2e-snap-1');
  await expect(toast(page, "A snapshot definition with the name 'e2e-snap-1' already exists")).toBeVisible();
  // Refused: the dialog stays open with the name, to correct it.
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox')).toHaveValue('e2e-snap-1');
  await dialog.getByRole('textbox').fill('e2e-snap-2');
  await dialog.getByRole('button', { name: 'OK' }).click();
  await expect(dialog).toBeHidden();

  await page.goto('#/snapshot');
  for (const name of ['e2e-snap-1', 'e2e-snap-2']) {
    await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
  }

  await page.getByRole('main').locator('thead').getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
  await expect(toast(page, 'Deleted 2 of 2')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'e2e-snap-1', exact: true })).toHaveCount(0);
});
