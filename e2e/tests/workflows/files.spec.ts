// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, pick, toast, type Page } from '../fixtures';

const PATH = '/etc/linstor.d/e2e.conf';

const fileRow = (page: Page) => page.getByRole('row').filter({ has: page.getByRole('cell', { name: PATH }) });

const rowAction = async (page: Page, action: string) => {
  await fileRow(page).getByRole('img', { name: 'more' }).click();
  await page.getByRole('menuitem', { name: action, exact: true }).click();
};

test('an external file is created, deployed to a resource, undeployed and deleted', async ({ page }) => {
  // From the list, as a user gets there: the form goes back when it is done.
  await page.goto('#/files');
  await page.goto('#/files/create');
  await page.getByLabel('Path').fill(PATH);
  await page.getByLabel('Content').fill('key = "value"\n');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, `External file '${PATH}' created.`)).toBeVisible();
  await expect(page).toHaveURL(/#\/files$/);
  await expect(fileRow(page)).toContainText('Not Deployed');

  await rowAction(page, 'Deploy');
  const dialog = page.getByRole('dialog').filter({ hasText: 'Deploy to Resource' });
  await pick(dialog, 'Select Resource', 'demo');
  await dialog.getByRole('button', { name: 'Confirm' }).click();
  await expect(toast(page, 'File deployed successfully')).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(fileRow(page).getByText('demo', { exact: true })).toBeVisible();

  // A deployed file is not deleted: the controller refuses.
  await rowAction(page, 'Delete');
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
  await expect(toast(page, `External file '${PATH}' is still deployed.`)).toBeVisible();
  await expect(fileRow(page)).toBeVisible();

  await rowAction(page, 'Undeploy');
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
  await expect(toast(page, 'File undeployed successfully')).toBeVisible();
  await expect(fileRow(page)).toContainText('Not Deployed');

  await rowAction(page, 'Delete');
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
  await expect(toast(page, `External file '${PATH}' deleted.`)).toBeVisible();
  await expect(fileRow(page)).toHaveCount(0);
});

test('a deploy the controller refuses is not reported as deployed', async ({ page }) => {
  await page.goto('#/files');
  await page.goto('#/files/create');
  await page.getByLabel('Path').fill(PATH);
  await page.getByLabel('Content').fill('key = "value"\n');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(fileRow(page)).toBeVisible();

  await page.route('**/v1/resource-definitions/*/files/*', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify([{ ret_code: -4611686018406153700, message: 'Deploying the file failed on node01.' }]),
    }),
  );
  await rowAction(page, 'Deploy');
  const dialog = page.getByRole('dialog').filter({ hasText: 'Deploy to Resource' });
  await pick(dialog, 'Select Resource', 'demo');
  await dialog.getByRole('button', { name: 'Confirm' }).click();
  await expect(toast(page, 'Deploying the file failed on node01.')).toBeVisible();
  await expect(toast(page, 'File deployed successfully')).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await page.unroute('**/v1/resource-definitions/*/files/*');

  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await rowAction(page, 'Delete');
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
  await expect(fileRow(page)).toHaveCount(0);
});
