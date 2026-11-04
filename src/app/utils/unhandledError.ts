// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { message } from 'antd';
import i18n from 'i18next';

import { ApiError } from '@app/features/requests';
import { isControllerAuthRequiredError } from '@app/utils/controllerAuth';

// Errors stay long enough to read, as the reply toasts do.
const ERROR_TOAST_SECONDS = 10;

/** Errors someone has already shown, or that are not failures at all. */
const isReported = (error: unknown): boolean => {
  // The request proxy toasted the controller's reply (see reportReply).
  if (error instanceof ApiError) return true;
  // The auth gate asks for a token instead.
  if (isControllerAuthRequiredError(error)) return true;
  if (error && typeof error === 'object') {
    // antd's validateFields: the form marks the fields itself.
    if ('errorFields' in error) return true;
    // A request the GUI cancelled (a page left, a newer search).
    const { name } = error as { name?: unknown };
    if (name === 'AbortError' || name === 'CanceledError') return true;
  }
  return false;
};

const messageOf = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return String(error);
};

/**
 * Shows a failure nobody else reported. A submit whose request could not
 * reach the controller (fetch throws during a failover) or whose mutation has
 * no onError of its own otherwise ends silently: the button does nothing.
 * Toasts are keyed by their text, so the same failure reaching here twice
 * (from the mutation cache and as an unhandled rejection) shows once.
 */
export const reportUnhandledError = (error: unknown): void => {
  if (isReported(error)) return;
  const content = i18n.t('common:action_failed', { message: messageOf(error) });
  message.error({
    content,
    key: `unhandled:${content}`,
    duration: ERROR_TOAST_SECONDS,
    onClick: () => message.destroy(`unhandled:${content}`),
  });
};
