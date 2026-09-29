// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, toast } from '../fixtures';

test('enabling the gateway without linstor-gateway warns, disabling resets it', async ({ page }) => {
  await page.goto('#/settings');
  await page.getByRole('tab', { name: 'Gateway' }).click();
  const tab = page.getByRole('tabpanel', { name: 'Gateway' });

  await tab.getByRole('switch').first().click();
  await tab.getByRole('button', { name: 'Save' }).first().click();
  await expect(toast(page, 'LINSTOR-Gateway is not available')).toBeVisible();

  await tab.getByRole('switch').first().click();
  await tab.getByRole('button', { name: 'Save' }).first().click();
  await expect(toast(page, 'LINSTOR-Gateway configuration has been reset.')).toBeVisible();
});
