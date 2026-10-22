// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { getResources } from '@app/features/resource';
import ResourceEdit from '../edit';

const params = vi.hoisted(() => ({ current: { resource: 'r1', node: 'n1' } }));
vi.mock('react-router-dom', () => ({ useParams: () => params.current }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@app/components/PageBasic', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// The form is covered by its own tests; here it only shows what the page hands it.
vi.mock('@app/features/resource', () => ({
  getResources: vi.fn(),
  CreateResourceForm: (props: Record<string, unknown>) => <pre data-testid="form">{JSON.stringify(props)}</pre>,
}));

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const renderPage = (client = newClient()) =>
  render(
    <QueryClientProvider client={client}>
      <ResourceEdit />
    </QueryClientProvider>,
  );

const formProps = async () => JSON.parse((await screen.findByTestId('form')).textContent ?? '');
const resourceOn = (node: string, pool: string) =>
  ({ data: [{ name: 'r1', node_name: node, props: { StorPoolName: pool } }] }) as never;

describe('Resource edit page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    params.current = { resource: 'r1', node: 'n1' };
  });

  it('waits for the resource and opens the form in edit mode with its pool', async () => {
    let resolve: (value: never) => void = () => {};
    vi.mocked(getResources).mockReturnValue(new Promise((r) => (resolve = r)) as never);
    renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('edit');
    // The form takes its values once: not before they are there.
    expect(screen.queryByTestId('form')).toBeNull();

    resolve(resourceOn('n1', 'pool1'));
    expect(await formProps()).toEqual({ isEdit: true, initialValues: { name: 'r1', storage_pool: 'pool1' } });
    expect(getResources).toHaveBeenCalledWith({ resources: ['r1'], nodes: ['n1'] });
  });

  it('opens the resource on another node with that node pool, not a cached one', async () => {
    const client = newClient();
    vi.mocked(getResources).mockResolvedValue(resourceOn('n1', 'pool1'));
    const first = renderPage(client);
    expect((await formProps()).initialValues.storage_pool).toBe('pool1');
    first.unmount();

    params.current = { resource: 'r1', node: 'n2' };
    let resolve: (value: never) => void = () => {};
    vi.mocked(getResources).mockReturnValue(new Promise((r) => (resolve = r)) as never);
    renderPage(client);
    expect(screen.queryByTestId('form')).toBeNull();

    resolve(resourceOn('n2', 'pool2'));
    expect((await formProps()).initialValues.storage_pool).toBe('pool2');
    expect(getResources).toHaveBeenLastCalledWith({ resources: ['r1'], nodes: ['n2'] });
  });

  it('shows an empty state for a resource that does not exist', async () => {
    vi.mocked(getResources).mockResolvedValue({ data: [] } as never);
    renderPage();

    await waitFor(() => expect(document.querySelector('.ant-empty-description')).toHaveTextContent('No data'));
    expect(screen.queryByTestId('form')).toBeNull();
  });
});
