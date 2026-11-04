// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

const antd = vi.hoisted(() => ({ message: { error: vi.fn(), destroy: vi.fn() } }));
vi.mock('antd', () => antd);

import { ApiError } from '@app/features/requests';
import { createControllerAuthRequiredError } from '@app/utils/controllerAuth';
import { reportUnhandledError } from '@app/utils/unhandledError';
import { createQueryClient } from '../queryClient';

const shown = () => antd.message.error.mock.calls.map(([options]) => options.content);

const runMutation = (options: { onError?: () => void; meta?: Record<string, unknown> }) => {
  const client = createQueryClient();
  return client
    .getMutationCache()
    .build(client, { mutationFn: () => Promise.reject(new TypeError('Failed to fetch')), ...options })
    .execute(undefined)
    .catch(() => undefined);
};

describe('reportUnhandledError', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a failure nobody reported, once however often it arrives', () => {
    reportUnhandledError(new TypeError('Failed to fetch'));
    reportUnhandledError(new TypeError('Failed to fetch'));
    expect(antd.message.error).toHaveBeenCalledTimes(2);
    const [first, second] = antd.message.error.mock.calls.map(([options]) => options);
    expect(first.content).toBe('The action failed: Failed to fetch');
    // The same key: antd replaces the toast instead of stacking a second.
    expect(second.key).toBe(first.key);
  });

  it('reads the message of a rejection that is not an Error', () => {
    reportUnhandledError({ message: 'gateway is down' });
    reportUnhandledError('timeout');
    expect(shown()).toEqual(['The action failed: gateway is down', 'The action failed: timeout']);
  });

  it('leaves alone what is reported elsewhere or is no failure', () => {
    // The request proxy toasted the controller's reply.
    reportUnhandledError(new ApiError('Resource group exists', 409, []));
    // The auth gate asks for a token.
    reportUnhandledError(createControllerAuthRequiredError());
    // A form's validateFields: the fields show their errors.
    reportUnhandledError({ errorFields: [{ name: ['name'], errors: ['required'] }] });
    // A cancelled request.
    reportUnhandledError(new DOMException('aborted', 'AbortError'));
    expect(antd.message.error).not.toHaveBeenCalled();
  });
});

describe('createQueryClient', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reports a mutation that fails without an onError of its own', async () => {
    await runMutation({});
    expect(shown()).toEqual(['The action failed: Failed to fetch']);
  });

  it('leaves the error to a mutation that handles it, or whose callers do', async () => {
    const onError = vi.fn();
    await runMutation({ onError });
    expect(onError).toHaveBeenCalled();
    await runMutation({ meta: { reportsErrors: true } });
    expect(antd.message.error).not.toHaveBeenCalled();
  });
});
