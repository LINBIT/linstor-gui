// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, pick, toast, type Page } from '../fixtures';

const remoteRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });

const openCreateRemote = async (page: Page) => {
  await page.goto('#/remote/list');
  await page.getByRole('button', { name: '+ Add' }).click();
  return page.getByRole('dialog').filter({ hasText: 'Create' });
};

const fillS3 = async (page: Page, name: string) => {
  const dialog = await openCreateRemote(page);
  await dialog.getByLabel('Name', { exact: true }).fill(name);
  await dialog.getByLabel('Endpoint').fill('s3.example.com');
  await dialog.getByLabel('Bucket').fill('linstor');
  await dialog.getByLabel('Region').fill('eu-central-1');
  await dialog.getByLabel('Access Key').fill('e2e-access');
  await dialog.getByLabel('Secret Key').fill('e2e-secret');
  return dialog;
};

test('an S3 remote is added, a backup is shipped to it, and the remote is deleted', async ({ page }) => {
  const dialog = await fillS3(page, 'e2e-s3');
  await dialog.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, "New remote 'e2e-s3' created.")).toBeVisible();
  await expect(dialog).toBeHidden();
  const row = remoteRow(page, 'e2e-s3');
  await expect(row).toBeVisible();

  await row.getByRole('img', { name: 'more' }).click();
  await page.getByRole('menuitem', { name: 'Backups' }).click();
  await expect(page).toHaveURL(/#\/remote\/e2e-s3\/backups$/);
  await page.getByRole('button', { name: '+ Add' }).click();
  const backup = page.getByRole('dialog').filter({ hasText: 'Create' });
  await pick(backup, 'Resource', 'demo');
  await backup.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, "Backup shipping of resource 'demo' to remote 'e2e-s3' started.")).toBeVisible();
  await expect(backup).toBeHidden();
  await expect(page.getByRole('cell', { name: 'back_00001', exact: true })).toBeVisible();

  await page.goto('#/remote/list');
  await remoteRow(page, 'e2e-s3').getByRole('img', { name: 'more' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
  await expect(toast(page, "Remote 'e2e-s3' deleted.")).toBeVisible();
  await expect(remoteRow(page, 'e2e-s3')).toHaveCount(0);
});

test('a remote whose name is taken is refused once, and the dialog keeps what was typed', async ({ page }) => {
  let dialog = await fillS3(page, 'e2e-taken');
  await dialog.getByRole('button', { name: 'Submit' }).click();
  await expect(dialog).toBeHidden();

  dialog = await fillS3(page, 'e2e-taken');
  await dialog.getByRole('button', { name: 'Submit' }).click();
  await expect(toast(page, "A remote with the name 'e2e-taken' already exists.")).toHaveCount(1);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Name', { exact: true })).toHaveValue('e2e-taken');
});
