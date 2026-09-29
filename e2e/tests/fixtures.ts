// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test as base, expect, type Page } from '@playwright/test';

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
