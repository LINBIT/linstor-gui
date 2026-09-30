// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { EnterPassphrase } from '../EnterPassphrase';
import { enterPassPhrase } from '../../passphrase';

vi.mock('../../passphrase', () => ({ enterPassPhrase: vi.fn() }));

describe('EnterPassphrase', () => {
  it('never writes the passphrase to the console', async () => {
    vi.mocked(enterPassPhrase).mockResolvedValue({ error: [{ message: 'wrong' }] } as never);
    const console_ = (['log', 'info', 'debug', 'warn', 'error'] as const).map((level) => vi.spyOn(console, level));

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EnterPassphrase />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(await screen.findByLabelText('pass-phrase'), { target: { value: 'secret-passphrase' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));

    await waitFor(() => expect(enterPassPhrase).toHaveBeenCalledWith('secret-passphrase'));
    for (const spy of console_) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain('secret-passphrase');
      spy.mockRestore();
    }
  });
});
