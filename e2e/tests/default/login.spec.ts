// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, toast, type Page } from '../fixtures';

// GUI user login, kept in the mock's key-value store: a fresh user store
// offers admin/admin and forces a new password; once changed, the default is
// neither advertised nor accepted.
const NEW_PASSWORD = 'e2e-admin-pw';

const logIn = async (page: Page, password: string) => {
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
};

const setUserLogin = async (page: Page, on: boolean) => {
  await page.goto('#/users');
  const toggle = page.getByRole('main').getByRole('switch').first();
  await expect(toggle).toHaveAttribute('aria-checked', String(!on));
  await toggle.click();
  await expect(toast(page, `Authentication is now ${on ? 'enabled' : 'disabled'}`)).toBeVisible();
};

test('user login: default credential, forced change, then only the new password', async ({ page }) => {
  await setUserLogin(page, true);

  await page.reload();
  await expect(page.getByText('Default credential: admin/admin')).toBeVisible();
  await logIn(page, 'admin');

  // The dialog has no accessible name; its fields identify it.
  const change = page.getByRole('dialog').filter({ hasText: 'Confirm password' });
  await expect(change).toBeVisible();
  await change.getByLabel('New password').fill(NEW_PASSWORD);
  await change.getByLabel('Confirm password').fill(NEW_PASSWORD);
  await change.getByRole('button', { name: 'Change password' }).click();
  await expect(change).toBeHidden();

  // The page reloads and logs in again with the new password.
  await expect(page.getByRole('menuitem', { name: /Authentication/ })).toBeVisible();
  await page.getByRole('banner').getByRole('img', { name: 'down' }).last().click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  await expect(page.getByText('Default credential: admin/admin')).toBeHidden();

  await logIn(page, 'admin');
  await expect(page.getByText('Please check your username and password and try again')).toBeVisible();

  await logIn(page, NEW_PASSWORD);
  await expect(page.getByRole('dialog').filter({ hasText: 'Confirm password' })).toBeHidden();
  await setUserLogin(page, false);
});
