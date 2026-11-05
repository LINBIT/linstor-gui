// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test as base, expect, type Locator, type Page } from '@playwright/test';

// Every test fails on an uncaught error in the page, whatever it asserts.
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, runTest) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await runTest(page);
    expect(errors, 'uncaught errors in the page').toEqual([]);
  },
});

export { expect };
export type { Page };

/** The texts of the toasts on screen right now. */
export const toastTexts = (page: Page) => page.locator('.ant-message-notice').allInnerTexts();

/** A toast with this text, waited for. */
export const toast = (page: Page, text: string | RegExp) => page.locator('.ant-message-notice', { hasText: text });

/**
 * Checks that `assertion` keeps holding for `ms`, not only once: a dialog that
 * stays open (it is still visible while its close animation runs), a toast
 * shown once (a duplicate comes a moment after the first). The assertion
 * must check the page as it is now: a retrying expect would wait for the
 * state instead (and `timeout: 0` means no timeout at all).
 */
export const keepsHolding = async (assertion: () => Promise<void>, ms = 1500) => {
  const until = Date.now() + ms;
  do {
    await assertion();
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < until);
};

/**
 * Picks `option` in the select labelled `label` inside `scope` (a page, or a
 * dialog). antd renders its options twice: a hidden accessible list (role
 * "option") and the visible items a user clicks, so the visible one is
 * clicked by its title.
 */
export const pick = async (scope: Page | Locator, label: string, option: string) => {
  await scope.getByLabel(label, { exact: true }).click();
  const page = 'page' in scope ? scope.page() : scope;
  await page.locator(`.ant-select-dropdown:visible .ant-select-item-option[title="${option}"]`).click();
};
