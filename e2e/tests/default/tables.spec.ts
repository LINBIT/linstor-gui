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
