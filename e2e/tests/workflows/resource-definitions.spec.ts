// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, keepsHolding, toast, type Page } from '../fixtures';

// The scenario's "demo" resource: 1 GiB, placed on node01 and node02.
const definitionRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });

const rowAction = async (page: Page, name: string, action: string) => {
  await definitionRow(page, name).getByRole('img', { name: 'more' }).click();
  await page.getByRole('menuitem', { name: action, exact: true }).click();
};

const openResize = async (page: Page) => {
  await rowAction(page, 'demo', 'Resize');
  const dialog = page.getByRole('dialog').filter({ hasText: 'Resize demo' });
  await expect(dialog.getByRole('spinbutton')).toBeVisible();
  return dialog;
};

test('a resource definition is cloned, and the clone is listed', async ({ page }) => {
  await page.goto('#/storage-configuration/resource-overview');
  await rowAction(page, 'demo', 'Clone');
  const dialog = page.getByRole('dialog').filter({ hasText: 'Clone' });
  await dialog.getByLabel('Name').fill('e2e-clone');
  await dialog.getByRole('button', { name: 'Clone' }).click();
  await expect(toast(page, "New resource definition 'e2e-clone' cloned from 'demo'.")).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(definitionRow(page, 'e2e-clone')).toBeVisible();

  await rowAction(page, 'e2e-clone', 'Delete');
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
  await expect(toast(page, "Resource definition 'e2e-clone' deleted.")).toBeVisible();
});

test('a clone whose name is taken is refused with the reason, and the dialog keeps the name', async ({ page }) => {
  await page.goto('#/storage-configuration/resource-overview');
  await rowAction(page, 'demo', 'Clone');
  const dialog = page.getByRole('dialog').filter({ hasText: 'Clone' });
  await dialog.getByLabel('Name').fill('demo');
  await dialog.getByRole('button', { name: 'Clone' }).click();
  await expect(toast(page, "A resource definition with the name 'demo' already exists")).toBeVisible();
  await keepsHolding(async () => {
    expect(await dialog.isVisible()).toBe(true);
    expect(await toast(page, 'already exists').count()).toBe(1);
  });
  await expect(dialog.getByLabel('Name')).toHaveValue('demo');
});

test('a volume is grown, and shrinking it is refused', async ({ page }) => {
  await page.goto('#/storage-configuration/resource-overview');
  let dialog = await openResize(page);
  await expect(dialog.getByRole('spinbutton')).toHaveValue('1');
  await dialog.getByRole('spinbutton').fill('2');
  await dialog.getByRole('button', { name: 'OK' }).click();
  await expect(toast(page, "Volume definition with number '0' on resource definition 'demo' modified.")).toBeVisible();
  await expect(dialog).toBeHidden();
  // The refusal below must not find the success toasts of the growth.
  await page.evaluate("document.querySelectorAll('.ant-message-notice').forEach((n) => n.remove())");

  dialog = await openResize(page);
  await expect(dialog.getByRole('spinbutton')).toHaveValue('2');
  await dialog.getByRole('spinbutton').fill('1');
  await dialog.getByRole('button', { name: 'OK' }).click();
  await expect(toast(page, "Shrinking volume definition '0' of 'demo' is not supported.")).toBeVisible();
  // Refused: no success, and the dialog stays open with the size, to correct it.
  await keepsHolding(async () => {
    expect(await dialog.isVisible()).toBe(true);
    expect(await page.locator('.ant-message-success').count()).toBe(0);
  });
  await expect(dialog.getByRole('spinbutton')).toHaveValue('1');
});
