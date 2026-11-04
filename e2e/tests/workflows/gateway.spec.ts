// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect, toast, type Page } from '../fixtures';

// The GUI's own origin serves as the gateway host: the preview proxies
// /api/v2 to the mock, which stands in for linstor-gateway.
const enableGateway = async (page: Page, baseURL: string) => {
  await page.goto('#/settings');
  await page.getByRole('tab', { name: 'Gateway' }).click();
  const tab = page.getByRole('tabpanel', { name: 'Gateway' });
  await tab.getByRole('switch', { name: 'gateway-mode' }).click();
  await tab.getByRole('switch', { name: 'custom-host' }).click();
  await tab.getByPlaceholder('http://192.168.1.1:8337/').fill(baseURL);
  // The gateway answers: the GUI reloads to show its pages, instead of
  // reporting it missing.
  const reloaded = page.waitForEvent('load');
  await tab.getByRole('button', { name: 'Save' }).first().click();
  await reloaded;
  await expect(toast(page, 'LINSTOR-Gateway is not available')).toHaveCount(0);
};

const disableGateway = async (page: Page) => {
  await page.goto('#/settings');
  await page.getByRole('tab', { name: 'Gateway' }).click();
  const tab = page.getByRole('tabpanel', { name: 'Gateway' });
  await tab.getByRole('switch', { name: 'gateway-mode' }).click();
  // With a gateway that answers, the GUI reloads to drop its pages.
  const reloaded = page.waitForEvent('load');
  await tab.getByRole('button', { name: 'Save' }).first().click();
  await reloaded;
  await page.getByRole('tab', { name: 'Gateway' }).click();
  await expect(page.getByRole('switch', { name: 'gateway-mode' })).not.toBeChecked();
};

const rowWith = (page: Page, text: string) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name: text, exact: true }) });

const rowAction = async (page: Page, text: string, action: string) => {
  await rowWith(page, text).getByRole('img', { name: 'more' }).click();
  await page.getByRole('menu').last().getByRole('menuitem', { name: action, exact: true }).click();
  await page.getByRole('tooltip').getByRole('button', { name: 'Yes' }).click();
};

const deleteRow = async (page: Page, text: string) => {
  await rowAction(page, text, 'Delete');
  await expect(rowWith(page, text)).toHaveCount(0);
};

test('iSCSI, NFS and NVMe-oF exports are created through the gateway, listed and deleted', async ({
  page,
  baseURL,
}) => {
  await enableGateway(page, baseURL!);

  await page.goto('#/gateway/iscsi');
  await page.goto('#/gateway/iscsi/create');
  await page.getByPlaceholder('yyyy-mm').fill('2026-11');
  await page.getByPlaceholder('com.company').fill('com.example');
  await page.getByPlaceholder('unique-name').fill('e2e');
  await page.getByLabel('Service IP').fill('10.0.9.10/24');
  await page.getByPlaceholder('10G').fill('1');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/#\/gateway\/iscsi$/);
  const iqn = 'iqn.2026-11.com.example:e2e';
  await expect(rowWith(page, iqn)).toContainText('node01');
  await expect(rowWith(page, iqn)).toContainText('Started');
  await rowAction(page, iqn, 'Stop');
  await expect(rowWith(page, iqn)).toContainText('Stopped');
  await deleteRow(page, iqn);

  await page.goto('#/gateway/nfs');
  await page.goto('#/gateway/nfs/create');
  await page.getByLabel('Name', { exact: true }).fill('e2e_export');
  await page.getByLabel('Service IP').fill('10.0.9.11/24');
  await page.getByPlaceholder('10G').first().fill('1');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/#\/gateway\/nfs$/i);
  await expect(rowWith(page, 'e2e_export')).toContainText('node01');
  await deleteRow(page, 'e2e_export');

  await page.goto('#/gateway/nvme-of');
  await page.goto('#/gateway/nvme-of/create');
  await page.getByPlaceholder('yyyy-mm').fill('2026-11');
  await page.getByPlaceholder('com.company').fill('com.example');
  await page.getByPlaceholder('unique-name').fill('e2e');
  await page.getByLabel('Service IP').fill('10.0.9.12/24');
  await page.getByPlaceholder('10G').fill('1');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/#\/gateway\/nvme-of$/);
  const nqn = 'nqn.2026-11.com.example:nvme:e2e';
  await expect(rowWith(page, nqn)).toContainText('node01');
  await deleteRow(page, nqn);

  await disableGateway(page);
});
