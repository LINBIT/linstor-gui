// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import Dashboard from '../Dashboard';
import { store } from '@app/store';
import { CLUSTER_SETUP_DISMISSED_KEY } from '@app/features/clusterSetup/dismiss';

const mockGetNodes = vi.fn();
vi.mock('@app/features/node/api', () => ({
  getNodes: (...args: unknown[]) => mockGetNodes(...args),
}));

vi.mock('@app/components/PageBasic', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-basic">{children}</div>,
}));

vi.mock('@app/components/StoragePoolInfo', () => ({
  StoragePoolInfo: () => <div data-testid="storage-pool-info">SP</div>,
}));
vi.mock('@app/features/resource', () => ({
  FaultyList: () => <div data-testid="faulty-list">FL</div>,
}));
vi.mock('@app/features/clusterSetup/components/SetupClusterWizard', () => ({
  SetupClusterWizard: () => null,
}));

const renderDashboard = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGetNodes.mockReset();
  });

  it('shows only SetupClusterCard when nodes list is empty', async () => {
    mockGetNodes.mockResolvedValueOnce({ data: [] });
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Welcome — let's set up your LINSTOR cluster/i)).toBeInTheDocument());
    expect(screen.queryByTestId('storage-pool-info')).not.toBeInTheDocument();
    expect(screen.queryByTestId('faulty-list')).not.toBeInTheDocument();
  });

  it('shows chart + faulty list when nodes exist', async () => {
    mockGetNodes.mockResolvedValueOnce({ data: [{ name: 'gui01' }] });
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('storage-pool-info')).toBeInTheDocument());
    expect(screen.queryByText(/Welcome — let's set up your LINSTOR cluster/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('faulty-list')).toBeInTheDocument();
  });

  it('shows chart + faulty list when cluster is empty but dismissed', async () => {
    window.localStorage.setItem(CLUSTER_SETUP_DISMISSED_KEY, 'true');
    mockGetNodes.mockResolvedValueOnce({ data: [] });
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('storage-pool-info')).toBeInTheDocument());
    expect(screen.queryByText(/Welcome — let's set up your LINSTOR cluster/i)).not.toBeInTheDocument();
  });
});
