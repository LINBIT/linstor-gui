// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ConnectStatus from '../ConnectStatus';
import { getControllerConfig } from '@app/features/node/api';

vi.mock('@app/features/node/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node/api')>()),
  getControllerConfig: vi.fn(),
}));

const mockedConfig = vi.mocked(getControllerConfig);

const renderStatus = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return render(
    <QueryClientProvider client={client}>
      <ConnectStatus />
    </QueryClientProvider>,
  );
};

describe('ConnectStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing while the controller config is loading', () => {
    mockedConfig.mockReturnValue(new Promise(() => undefined) as never);
    const { container } = renderStatus();
    expect(container.firstChild).toBeNull();
  });

  it('shows the connected icon and tooltip when the controller answers', async () => {
    mockedConfig.mockResolvedValue({ data: {} } as never);
    const { container } = renderStatus();

    const status = await waitFor(() => {
      const el = container.querySelector('.connect__status');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(status.classList.contains('connect__status--disconnected')).toBe(false);

    fireEvent.mouseEnter(status.querySelector('.inline-block') as HTMLElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('CONNECTED');
  });

  it('switches to the disconnected state when the request fails', async () => {
    mockedConfig.mockRejectedValue(new Error('down'));
    const { container } = renderStatus();

    const status = await waitFor(() => {
      const el = container.querySelector('.connect__status--disconnected');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });

    fireEvent.mouseEnter(status.querySelector('.inline-block') as HTMLElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('DISCONNECTED');
  });
});
