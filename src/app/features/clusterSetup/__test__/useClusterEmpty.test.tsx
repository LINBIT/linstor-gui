import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

import { useClusterEmpty } from '../hooks/useClusterEmpty';
import { CLUSTER_SETUP_DISMISSED_KEY } from '../dismiss';

const mockGetNodes = vi.fn();
vi.mock('@app/features/node/api', () => ({
  getNodes: (...args: unknown[]) => mockGetNodes(...args),
}));

const Probe: React.FC = () => {
  const { empty, dismissed, isFetched } = useClusterEmpty();
  return (
    <div>
      <span data-testid="fetched">{String(isFetched)}</span>
      <span data-testid="empty">{String(empty)}</span>
      <span data-testid="dismissed">{String(dismissed)}</span>
    </div>
  );
};

const renderWithClient = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
};

describe('useClusterEmpty', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGetNodes.mockReset();
  });

  it('reports empty=true when controller has no nodes and not dismissed', async () => {
    mockGetNodes.mockResolvedValueOnce({ data: [] });
    renderWithClient();
    await waitFor(() => expect(screen.getByTestId('fetched').textContent).toBe('true'));
    expect(screen.getByTestId('empty').textContent).toBe('true');
    expect(screen.getByTestId('dismissed').textContent).toBe('false');
  });

  it('reports empty=false when controller has at least one node', async () => {
    mockGetNodes.mockResolvedValueOnce({ data: [{ name: 'gui01' }] });
    renderWithClient();
    await waitFor(() => expect(screen.getByTestId('fetched').textContent).toBe('true'));
    expect(screen.getByTestId('empty').textContent).toBe('false');
  });

  it('reports dismissed=true when the localStorage flag is set', async () => {
    window.localStorage.setItem(CLUSTER_SETUP_DISMISSED_KEY, 'true');
    mockGetNodes.mockResolvedValueOnce({ data: [] });
    renderWithClient();
    await waitFor(() => expect(screen.getByTestId('fetched').textContent).toBe('true'));
    expect(screen.getByTestId('empty').textContent).toBe('true');
    expect(screen.getByTestId('dismissed').textContent).toBe('true');
  });
});
