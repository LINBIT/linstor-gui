// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { message } from 'antd';

import { deleteError, useDeleteAction, type DeleteActionOptions } from '../useDeleteAction';
import { toastsAreQuiet } from '@app/utils/toast';

vi.mock('antd', () => ({
  message: { success: vi.fn(), error: vi.fn() },
}));

type Item = { name: string };
const a = { name: 'a' };
const b = { name: 'b' };
const c = { name: 'c' };

const ok = [{ ret_code: 1, message: 'deleted' }];

const setup = (overrides: Partial<DeleteActionOptions<Item>> = {}) => {
  const options: DeleteActionOptions<Item> = {
    remove: vi.fn(async () => ({ data: ok })),
    keyOf: (item) => item.name,
    nameOf: (item) => item.name,
    refresh: vi.fn(),
    ...overrides,
  };
  const hook = renderHook(() => useDeleteAction(options));
  return { options, hook };
};

describe('deleteError', () => {
  it('reads openapi-fetch errors, ApiCallRc lists and axios bodies', () => {
    expect(deleteError({ data: ok })).toBeUndefined();
    expect(deleteError(ok)).toBeUndefined();
    expect(deleteError({ error: [{ ret_code: -1, message: 'in use' }] })).toBe('in use');
    expect(deleteError([{ ret_code: -5, message: 'nope' }, ...ok])).toBe('nope');
    expect(deleteError({ data: [{ ret_code: -2, message: 'axios said no' }] })).toBe('axios said no');
    expect(deleteError({ error: { message: 'plain' } })).toBe('plain');
    expect(deleteError(undefined)).toBeUndefined();
  });
});

describe('useDeleteAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks rows as deleting until the refresh is done', async () => {
    let finishRefresh!: () => void;
    const { hook } = setup({ refresh: () => new Promise<void>((resolve) => (finishRefresh = resolve)) });

    let running!: Promise<unknown>;
    act(() => {
      running = hook.result.current.run([a]);
    });
    expect(hook.result.current.isDeleting('a')).toBe(true);
    expect(hook.result.current.busy).toBe(true);

    // Still deleting while the list reloads.
    await vi.waitFor(() => expect(finishRefresh).toBeTypeOf('function'));
    expect(hook.result.current.isDeleting('a')).toBe(true);

    await act(async () => {
      finishRefresh();
      await running;
    });
    expect(hook.result.current.isDeleting('a')).toBe(false);
    expect(hook.result.current.busy).toBe(false);
  });

  it('leaves a single delete to the fetch proxy toast', async () => {
    const { hook, options } = setup();
    await act(async () => {
      const result = await hook.result.current.run([a]);
      expect(result.done).toEqual([a]);
    });
    expect(options.refresh).toHaveBeenCalledTimes(1);
    expect(message.success).not.toHaveBeenCalled();
    expect(message.error).not.toHaveBeenCalled();
  });

  it('reports a single failure as a failure, never as deleted', async () => {
    const { hook } = setup({ remove: async () => ({ error: [{ ret_code: -1, message: 'in use' }] }) });
    let result!: Awaited<ReturnType<typeof hook.result.current.run>>;
    await act(async () => {
      result = await hook.result.current.run([a]);
    });
    expect(result.done).toEqual([]);
    expect(result.failed).toEqual([{ item: a, error: 'in use' }]);
    // The proxy toasted the reply's error already.
    expect(message.error).not.toHaveBeenCalled();
    expect(message.success).not.toHaveBeenCalled();
  });

  it('toasts a thrown single failure itself, since no reply reached the proxy', async () => {
    const { hook } = setup({
      remove: async () => {
        throw new Error('network down');
      },
    });
    await act(async () => {
      await hook.result.current.run([a]);
    });
    expect(message.error).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Failed to delete a: network down' }),
    );
  });

  it('toasts single deletes itself when asked (axios calls bypass the proxy)', async () => {
    const { hook } = setup({ toastSingle: true, remove: async () => ({ data: ok }) });
    await act(async () => {
      await hook.result.current.run([a]);
    });
    expect(message.success).toHaveBeenCalledWith('Deleted a');
  });

  it('runs a bulk delete quietly, refreshes once and toasts one summary', async () => {
    const quietDuring: boolean[] = [];
    const { hook, options } = setup({
      remove: async (item) => {
        quietDuring.push(toastsAreQuiet());
        return item.name === 'b' ? { error: [{ ret_code: -1, message: 'in use' }] } : { data: ok };
      },
    });
    await act(async () => {
      await hook.result.current.run([a, b, c]);
    });
    expect(quietDuring).toEqual([true, true, true]);
    expect(toastsAreQuiet()).toBe(false);
    expect(options.refresh).toHaveBeenCalledTimes(1);
    expect(message.success).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledTimes(1);
    expect(message.error).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Deleted 2 of 3; b failed: in use' }),
    );
  });

  it('summarises a clean bulk delete as one success toast', async () => {
    const { hook } = setup();
    await act(async () => {
      await hook.result.current.run([a, b]);
    });
    expect(message.success).toHaveBeenCalledTimes(1);
    expect(message.success).toHaveBeenCalledWith('Deleted 2 of 2');
  });

  it('never has more than `concurrency` deletes in flight', async () => {
    let inFlight = 0;
    let peak = 0;
    const items = Array.from({ length: 7 }, (_, i) => ({ name: `r${i}` }));
    const { hook } = setup({
      concurrency: 2,
      remove: async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 1));
        inFlight -= 1;
        return { data: ok };
      },
    });
    let result!: Awaited<ReturnType<typeof hook.result.current.run>>;
    await act(async () => {
      result = await hook.result.current.run(items);
    });
    expect(peak).toBe(2);
    expect(result.done).toHaveLength(7);
  });

  it('does nothing for an empty selection', async () => {
    const { hook, options } = setup();
    await act(async () => {
      await hook.result.current.run([]);
    });
    expect(options.remove).not.toHaveBeenCalled();
    expect(options.refresh).not.toHaveBeenCalled();
  });
});
