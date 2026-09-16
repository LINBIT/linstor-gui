// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  autoPlace: vi.fn(),
  resourceCreateOnNode: vi.fn(),
  resourceModify: vi.fn(),
  getResources: vi.fn(),
}));
vi.mock('@app/features/storagePool', () => ({
  useStoragePools: () => ({
    isLoading: false,
    data: [
      { storage_pool_name: 'pool-a', node_name: 'node-1', provider_kind: 'LVM_THIN' },
      { storage_pool_name: 'pool-a', node_name: 'node-2', provider_kind: 'LVM_THIN' },
      { storage_pool_name: 'DfltDisklessStorPool', node_name: 'node-1', provider_kind: 'DISKLESS' },
    ],
  }),
}));
vi.mock('@app/features/resourceDefinition', () => ({
  useResourceDefinitions: () => ({ isLoading: false, data: [{ name: 'res-a' }, { name: 'res-b' }] }),
}));
vi.mock('@app/features/node', () => ({
  useNodes: () => ({ isLoading: false, data: [{ name: 'node-1' }, { name: 'node-2' }, { name: 'node-3' }] }),
}));
vi.mock('@app/features/requests', () => ({
  fullySuccess: (res?: { ret_code: number }[]) => !!res && res.every((r) => r.ret_code > 0),
}));

const navigate = vi.fn();
let params: Record<string, string> = {};
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate, useParams: () => params };
});

import { autoPlace, resourceCreateOnNode, resourceModify, getResources } from '../../api';
import { CreateResourceForm } from '../CreateResourceForm';

const ok = { data: [{ ret_code: 1 }] };

const renderForm = (props: React.ComponentProps<typeof CreateResourceForm> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CreateResourceForm {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const pick = async (combobox: HTMLElement, label: string) => {
  fireEvent.mouseDown(combobox);
  fireEvent.click(await screen.findByText(label, { selector: '.ant-select-item-option-content' }));
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

describe('CreateResourceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params = {};
    vi.mocked(autoPlace).mockResolvedValue(ok as never);
    vi.mocked(resourceCreateOnNode).mockResolvedValue(ok as never);
    vi.mocked(resourceModify).mockResolvedValue(ok as never);
    // res-a already lives on node-1; nothing else is placed anywhere.
    vi.mocked(getResources).mockImplementation(
      async (query?: { resources?: string[] }) =>
        ({ data: query?.resources?.includes('res-a') ? [{ name: 'res-a', node_name: 'node-1' }] : [] }) as never,
    );
  });

  it('requires a resource definition', async () => {
    renderForm();
    submit();
    expect(await screen.findByText('Resource definition name is required!')).toBeInTheDocument();
    expect(autoPlace).not.toHaveBeenCalled();
  });

  it('auto-places with the place count and pool, then goes back', async () => {
    renderForm();
    await pick(screen.getAllByRole('combobox')[0], 'res-a');
    // Auto mode never offers the diskless pool.
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    const pools = await screen.findAllByText(/pool/i, { selector: '.ant-select-item-option-content' });
    expect(pools.map((p) => p.textContent)).toEqual(['pool-a']);
    fireEvent.click(pools[0]);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('switch'));
    submit();

    await waitFor(() =>
      expect(autoPlace).toHaveBeenCalledWith('res-a', {
        diskless_on_remaining: true,
        select_filter: { place_count: 3, storage_pool: 'pool-a' },
      }),
    );
    expect(resourceCreateOnNode).not.toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  it('stays on the page when the controller refuses the placement', async () => {
    vi.mocked(autoPlace).mockResolvedValue({ data: [{ ret_code: -1, message: 'no space' }] } as never);
    renderForm();
    await pick(screen.getAllByRole('combobox')[0], 'res-b');
    submit();
    await waitFor(() => expect(autoPlace).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('manual mode offers only nodes without the resource and creates it there with the pool', async () => {
    renderForm();
    await pick(screen.getAllByRole('combobox')[0], 'res-a');
    fireEvent.click(screen.getByText('Manual'));
    await waitFor(() => expect(getResources).toHaveBeenCalledWith({ resources: ['res-a'] }));

    const [, nodeSelect, poolSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(nodeSelect);
    const nodes = await screen.findAllByText(/^node-/, { selector: '.ant-select-item-option-content' });
    expect(nodes.map((n) => n.textContent)).toEqual(['node-2', 'node-3']);
    fireEvent.click(nodes[1]);
    await pick(poolSelect, 'pool-a');
    submit();

    await waitFor(() =>
      expect(resourceCreateOnNode).toHaveBeenCalledWith('res-a', 'node-3', {
        resource: { name: 'res-a', node_name: 'node-3', props: { StorPoolName: 'pool-a' } },
      }),
    );
    expect(autoPlace).not.toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  it('manual mode with <DRBD_DISKLESS> sends the flag and no pool', async () => {
    renderForm();
    await pick(screen.getAllByRole('combobox')[0], 'res-b');
    fireEvent.click(screen.getByText('Manual'));
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(3));
    const [, nodeSelect, poolSelect] = screen.getAllByRole('combobox');
    await pick(nodeSelect, 'node-1');
    await pick(poolSelect, '<DRBD_DISKLESS>');
    submit();
    await waitFor(() =>
      expect(resourceCreateOnNode).toHaveBeenCalledWith('res-b', 'node-1', {
        resource: { name: 'res-b', node_name: 'node-1', props: {}, flags: ['DRBD_DISKLESS'] },
      }),
    );
  });

  it('edit mode pins name and node from the route and lets only the pool change', async () => {
    params = { resource: 'res-a', node: 'node-1' };
    // The edit page passes the resource object plus its current pool.
    renderForm({ isEdit: true, initialValues: { name: 'res-a', storage_pool: 'pool-a' } });
    expect(screen.queryByText('Manual')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(3));
    const [nameSelect, nodeSelect, poolSelect] = screen.getAllByRole('combobox');
    expect(nameSelect).toBeDisabled();
    expect(nodeSelect).toBeDisabled();
    expect(screen.getByText('node-1')).toBeInTheDocument();

    await pick(poolSelect, '<DRBD_DISKLESS>');
    submit();
    await waitFor(() =>
      expect(resourceModify).toHaveBeenCalledWith('res-a', 'node-1', {
        override_props: { StorPoolName: 'DRBD_DISKLESS' },
        delete_props: [],
      }),
    );
    expect(resourceCreateOnNode).not.toHaveBeenCalled();
    expect(autoPlace).not.toHaveBeenCalled();
  });

  it('cancel goes back', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(navigate).toHaveBeenCalledWith(-1);
  });
});
