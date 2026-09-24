// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';

import { apiErrorMessage } from '..';

describe('apiErrorMessage', () => {
  it('joins the messages of an error response', () => {
    expect(
      apiErrorMessage({
        error: [
          { ret_code: -1, message: 'Remote already exists' },
          { ret_code: -1, message: 'second' },
        ],
      }),
    ).toBe('Remote already exists, second');
  });

  it('skips entries without a message', () => {
    expect(apiErrorMessage({ error: [{ ret_code: -1 }, { ret_code: -1, message: 'only' }] })).toBe('only');
  });

  it('reports nothing for a successful response', () => {
    expect(apiErrorMessage({ data: [{ ret_code: 1, message: 'ok' }] } as { error?: unknown })).toBeUndefined();
    expect(apiErrorMessage(undefined)).toBeUndefined();
  });

  it('reports nothing for an error body that is not an ApiCallRc list', () => {
    expect(apiErrorMessage({ error: { message: 'Bad Gateway' } })).toBeUndefined();
  });
});
