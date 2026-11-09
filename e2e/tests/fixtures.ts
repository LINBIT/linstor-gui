// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { test as base, expect, type Locator, type Page } from '@playwright/test';

/** Set per project in playwright.config.ts: the mock this project's GUI talks to. */
export type MockOptions = { mockURL: string };

/** The mock's replies that differed from the LINSTOR spec since the last call. */
const takeViolations = async (mockURL: string): Promise<unknown[]> =>
  (await fetch(`${mockURL}/__mock/violations`)).json() as Promise<unknown[]>;

// Every test fails on an uncaught error in the page, and on a mock reply that
// the controller would not send (e2e/mock/lib/specCheck.js), whatever it
// asserts.
export const test = base.extend<{ page: Page } & MockOptions>({
  mockURL: ['', { option: true }],
  page: async ({ page, mockURL }, runTest) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // A reply to the previous test can still arrive after it ended; it is not
    // this test's. A polled request that repeats shows up again below.
    await takeViolations(mockURL);
    await runTest(page);
    expect(errors, 'uncaught errors in the page').toEqual([]);
    expect(await takeViolations(mockURL), 'mock replies that differ from the LINSTOR spec').toEqual([]);
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
 *
 * The visible list is virtual: only the items in view exist, so an option
 * scrolled out of it cannot be found. Where the select can be searched, the
 * option is typed first, as a user would, which brings it into the list.
 */
export const pick = async (scope: Page | Locator, label: string, option: string) => {
  const field = scope.getByLabel(label, { exact: true });
  await field.click();
  if (await field.isEditable()) {
    await field.fill(option);
  }
  const page = 'page' in scope ? scope.page() : scope;

  await page.locator(`.ant-select-dropdown:visible .ant-select-item-option[title="${option}"]`).click();
};
