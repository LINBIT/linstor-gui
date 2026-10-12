// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ControllerActions } from '../ControllerActions';
import { getControllerConfig, updateControllerLogLevel } from '@app/features/node';
import { selectOption, ok } from '../../__test__/helpers';

vi.mock('@app/features/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node')>()),
  getControllerConfig: vi.fn(),
  updateControllerLogLevel: vi.fn(),
}));

const renderActions = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ControllerActions />
    </QueryClientProvider>,
  );

describe('ControllerActions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getControllerConfig).mockResolvedValue({ data: { log: { level: 'INFO' } } } as never);
    vi.mocked(updateControllerLogLevel).mockResolvedValue(ok as never);
  });

  it('shows the current log level and changes it', async () => {
    renderActions();
    const select = screen.getByRole('combobox', { name: 'Log level' });
    await waitFor(() => expect(screen.getByTitle('INFO')).toBeInTheDocument());

    await selectOption(select, 'DEBUG');
    await waitFor(() => expect(updateControllerLogLevel).toHaveBeenCalledWith('DEBUG'));
    // Read back from the controller afterwards.
    await waitFor(() => expect(getControllerConfig).toHaveBeenCalledTimes(2));
  });
});
