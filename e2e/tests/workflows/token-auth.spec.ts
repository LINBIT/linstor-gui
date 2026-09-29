// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, toast, type Page } from '../fixtures';

const controllerAuthTab = async (page: Page) => {
  await page.goto('#/settings');
  await page.getByRole('tab', { name: 'Controller Auth' }).click();
  return page.getByRole('tabpanel', { name: 'Controller Auth' });
};

test('controller token auth: initialize, manage tokens, disable', async ({ page }) => {
  let tab = await controllerAuthTab(page);
  await expect(tab.getByText('Token initialization')).toBeVisible();

  await tab.getByRole('button', { name: 'Initialize Token Auth' }).click();
  const initialized = page.getByRole('dialog').filter({ hasText: 'Controller Token Auth Initialized' });
  await expect(initialized.getByRole('textbox')).toHaveValue('e2e-init-token');
  await initialized.getByRole('button', { name: 'Stay Here' }).click();

  tab = await controllerAuthTab(page);
  await expect(tab.getByText('Token authentication already initialized')).toBeVisible();
  await expect(tab.getByText('Token initialization')).toBeHidden();
  // The token never reaches the reply log, which lives in sessionStorage.
  expect(await page.evaluate(() => sessionStorage.getItem('global_api_log') ?? '')).not.toContain('e2e-init-token');

  await page.goto('#/auth-tokens');
  await page
    .getByRole('button', { name: /Create/ })
    .first()
    .click();
  await page.getByLabel('Description').fill('e2e-token');
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('e2e-token-2', { exact: true }).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('cell', { name: 'e2e-token', exact: true })).toBeVisible();

  tab = await controllerAuthTab(page);
  await tab.getByRole('button', { name: 'Disable Token Auth' }).click();
  await page.getByRole('tooltip').getByRole('button').last().click();
  await expect(toast(page, 'Controller token authentication disabled.')).toBeVisible();
  await expect(tab.getByText('Token initialization')).toBeVisible();
});
