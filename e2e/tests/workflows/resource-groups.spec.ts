// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, toast, type Page } from '../fixtures';

const groupRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });

const deleteFromRowMenu = async (page: Page, name: string) => {
  await groupRow(page, name).getByRole('img', { name: 'more' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
};

test('a resource group is created, listed and deleted', async ({ page }) => {
  // From the list, as a user gets there: the form goes back when it is done.
  await page.goto('#/storage-configuration/resource-groups');
  await page.goto('#/storage-configuration/resource-groups/create');
  await page.getByLabel('Resource Group Name').fill('e2e-group');
  await page.getByLabel('Description').fill('created by the e2e tests');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, "New resource group 'e2e-group' created.")).toBeVisible();
  await expect(page).toHaveURL(/#\/storage-configuration\/resource-groups$/);
  await expect(groupRow(page, 'e2e-group')).toBeVisible();

  await deleteFromRowMenu(page, 'e2e-group');
  await expect(toast(page, "Resource group 'e2e-group' deleted.")).toBeVisible();
  await expect(groupRow(page, 'e2e-group')).toHaveCount(0);
});

test('a resource group that still has resources is not deleted', async ({ page }) => {
  await page.goto('#/storage-configuration/resource-groups');
  await deleteFromRowMenu(page, 'DfltRscGrp');
  await expect(toast(page, "Cannot delete resource group 'DfltRscGrp'")).toBeVisible();
  await expect(groupRow(page, 'DfltRscGrp')).toBeVisible();
});
