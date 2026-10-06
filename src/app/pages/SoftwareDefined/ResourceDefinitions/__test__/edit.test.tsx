// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { getResourceDefinition } from '@app/features/resourceDefinition';
import Edit from '../edit';

vi.mock('react-router-dom', () => ({ useParams: () => ({ resource: 'rd1' }) }));

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
vi.mock('@app/features/resourceDefinition', () => ({
  getResourceDefinition: vi.fn(),
  CreateForm: (props: Record<string, unknown>) => <pre data-testid="form">{JSON.stringify(props)}</pre>,
}));

const renderPage = (client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) =>
  render(
    <QueryClientProvider client={client}>
      <Edit />
    </QueryClientProvider>,
  );

const formProps = async () => JSON.parse((await screen.findByTestId('form')).textContent ?? '');

describe('Resource definition edit page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches the definition and opens the form in edit mode with its values', async () => {
    vi.mocked(getResourceDefinition).mockResolvedValue({
      data: [{ name: 'rd1', resource_group_name: 'rg1', props: { 'DrbdOptions/Net/protocol': 'A' } }],
    } as never);
    renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('resource_definition:edit');
    const props = JSON.parse((await screen.findByTestId('form')).textContent ?? '');
    expect(getResourceDefinition).toHaveBeenCalledWith({ resource_definitions: ['rd1'] });
    expect(props).toEqual({
      isEdit: true,
      initialValues: { name: 'rd1', resource_group_name: 'rg1', replication_mode: 'A' },
    });
  });

  it('shows protocol C for a definition without the protocol property', async () => {
    vi.mocked(getResourceDefinition).mockResolvedValue({
      data: [{ name: 'rd1', resource_group_name: 'DfltRscGrp' }],
    } as never);
    renderPage();

    const props = JSON.parse((await screen.findByTestId('form')).textContent ?? '');
    expect(props.initialValues.replication_mode).toBe('C');
  });

  it('opens the next visit with the group as it is now, not as it was', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(getResourceDefinition).mockResolvedValue({
      data: [{ name: 'rd1', resource_group_name: 'rg1' }],
    } as never);
    const first = renderPage(client);
    expect((await formProps()).initialValues.resource_group_name).toBe('rg1');
    first.unmount();
    // gcTime 0 drops the entry on a zero timer after the page is gone.
    await new Promise((resolve) => setTimeout(resolve, 0));

    vi.mocked(getResourceDefinition).mockResolvedValue({
      data: [{ name: 'rd1', resource_group_name: 'rg2' }],
    } as never);
    renderPage(client);
    expect((await formProps()).initialValues.resource_group_name).toBe('rg2');
  });

  it('shows an empty state for a definition that does not exist', async () => {
    vi.mocked(getResourceDefinition).mockResolvedValue({ data: [] } as never);
    renderPage();

    await waitFor(() => expect(document.querySelector('.ant-empty-description')).toHaveTextContent('No data'));
    expect(screen.queryByTestId('form')).toBeNull();
  });
});
