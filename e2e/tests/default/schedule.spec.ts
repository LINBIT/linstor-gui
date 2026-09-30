// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test, expect } from '../fixtures';

// cron-parser is CommonJS; only the built bundle shows how its import resolves,
// so this runs against the build rather than as a unit test.
test('the schedule dialog accepts cron expressions and previews their runs', async ({ page }) => {
  await page.goto('#/schedule/list');
  await page.getByRole('button', { name: '+ Add' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create Schedule' });
  await expect(dialog.getByRole('textbox').nth(1)).toHaveValue('0 0 * * *');
  await expect(dialog.getByText('Invalid cron expression. Please check the format.')).toHaveCount(0);

  await dialog.getByRole('button', { name: 'Open Cron Editor' }).first().click();
  const editor = page.getByRole('dialog', { name: 'Cron Editor' });
  await expect(editor.getByText('Next 5 Execution Times:')).toBeVisible();
  await expect(editor.getByText('Invalid Cron Expression')).toHaveCount(0);
});
