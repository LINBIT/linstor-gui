// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { onTestFinished, vi } from 'vitest';

const capture = (level: 'error' | 'warn') => {
  const spy = vi.spyOn(console, level).mockImplementation(() => undefined);
  onTestFinished(() => spy.mockRestore());
  return spy;
};

/**
 * For a test that makes the GUI log an error on purpose: the log is kept off
 * the output (setupTests fails a test on any unexpected console.error or
 * console.warn) and returned, so the test can assert on it. Restored when the
 * test ends.
 */
export const captureConsoleError = () => capture('error');

/** captureConsoleError, for console.warn. */
export const captureConsoleWarn = () => capture('warn');

/**
 * For a test that expects a render to throw (a hook used outside its
 * provider): React reports the error to the console and, in development,
 * rethrows it through a window error event that jsdom prints itself unless it
 * is cancelled. Both are kept off the output; the console spy is returned.
 */
export const captureRenderError = () => {
  const cancel = (event: ErrorEvent) => event.preventDefault();
  window.addEventListener('error', cancel);
  onTestFinished(() => window.removeEventListener('error', cancel));
  return capture('error');
};
