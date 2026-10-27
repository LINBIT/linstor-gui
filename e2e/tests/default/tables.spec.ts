// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect } from '../fixtures';

// Table takes these names from antd's locale only; whether the locale reaches
// ConfigProvider shows in the built bundle, so this runs against the build.
test('the row expand buttons of a table have a name', async ({ page }) => {
  await page.goto('#/storage-configuration/resource-overview');

  const expand = page.getByRole('button', { name: 'Expand row' }).first();
  await expect(expand).toBeVisible();
  await expand.click();
  await expect(page.getByRole('button', { name: 'Collapse row' }).first()).toBeVisible();
});

// The storage pool table scrolls sideways, so antd adds an aria-hidden row
// that measures the columns with copies of their titles, Select all included.
test('keyboard focus never lands in the hidden column-measuring row', async ({ page }) => {
  await page.goto('#/inventory/storage-pools');
  await expect(page.getByRole('checkbox', { name: 'Select all' })).toBeVisible();
  const measured = page.locator('.ant-table-measure-row input');
  await expect(measured).toHaveCount(1);

  // Tab through the whole page: no stop may be inside the measuring row.
  const focusedInMeasureRow = page.locator('.ant-table-measure-row :focus');
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    await expect(focusedInMeasureRow).toHaveCount(0);
  }
});
