// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, toast, type Page } from '../fixtures';

const resourceRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });

test('a resource is defined and spawned from a group, placed, and deleted', async ({ page }) => {
  // From the overview, as a user gets there: the form goes back when it is done.
  await page.goto('#/storage-configuration/resource-overview');
  await page.goto('#/storage-configuration/resource-definitions/create');
  await page.getByLabel('Name').first().fill('e2e-res');
  await page.getByRole('switch', { name: /Spawn on create/ }).click();
  await page.getByRole('spinbutton').first().fill('1');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, "New resource definition 'e2e-res' created.")).toBeVisible();
  await expect(page).toHaveURL(/#\/storage-configuration\/resource-overview$/);
  const row = resourceRow(page, 'e2e-res');
  await expect(row).toBeVisible();
  await row.getByRole('button').first().click();
  await expect(page.getByRole('cell', { name: 'node01', exact: true }).first()).toBeVisible();

  await row.getByRole('img', { name: 'more' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
  await expect(toast(page, "Resource definition 'e2e-res' deleted.")).toBeVisible();
  await expect(resourceRow(page, 'e2e-res')).toHaveCount(0);
});
