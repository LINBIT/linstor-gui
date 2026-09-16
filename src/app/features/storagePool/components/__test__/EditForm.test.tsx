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
  getStoragePoolByNode: vi.fn(),
  updateStoragePool: vi.fn(),
  getPhysicalStoragePoolByNode: vi.fn(),
  createPhysicalStorage: vi.fn(),
  createStoragePool: vi.fn(),
  getStoragePool: vi.fn(),
  deleteStoragePoolV2: vi.fn(),
  getStoragePoolCount: vi.fn(),
}));

vi.mock('@app/features/node', () => ({
  useNodes: () => ({ data: [{ name: 'node-1' }, { name: 'node-2' }], isLoading: false }),
  getNetworksByNode: vi.fn(),
}));

vi.mock('@app/features/requests', () => ({
  fullySuccess: (res?: { ret_code: number }[]) => !!res && res.every((r) => r.ret_code > 0),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate, useParams: () => ({ node: 'node-1', storagePool: 'pool-lvm' }) };
});

import { getStoragePoolByNode, updateStoragePool } from '../../api';
import { getNetworksByNode } from '@app/features/node';
import { EditForm } from '../EditForm';

const renderForm = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  const refetch = vi.spyOn(client, 'refetchQueries');
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EditForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return refetch;
};

describe('storage pool EditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStoragePoolByNode).mockResolvedValue({
      data: [
        { storage_pool_name: 'other', node_name: 'node-1', provider_kind: 'LVM', props: {} },
        {
          storage_pool_name: 'pool-lvm',
          node_name: 'node-1',
          provider_kind: 'LVM_THIN',
          props: { 'StorDriver/StorPoolName': 'vg0/thin', PrefNic: 'eth0' },
        },
      ],
    } as never);
    vi.mocked(getNetworksByNode).mockResolvedValue({ data: [{ name: 'eth0' }, { name: 'eth1' }] } as never);
    vi.mocked(updateStoragePool).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('loads the pool from its node and locks everything but the network', async () => {
    renderForm();
    const name = await screen.findByPlaceholderText('Please input storage pool name');
    await waitFor(() => expect(name).toHaveValue('pool-lvm'));
    expect(name).toBeDisabled();
    expect(screen.getByPlaceholderText('Please input Volume Group/Thin Pool')).toHaveValue('vg0/thin');
    expect(screen.getByPlaceholderText('Please input Volume Group/Thin Pool')).toBeDisabled();
    expect(getStoragePoolByNode).toHaveBeenCalledWith('node-1');
    expect(getNetworksByNode).toHaveBeenCalledWith('node-1');
    // node, network, provider kind: only the network select is enabled.
    const [node, network, kind] = screen.getAllByRole('combobox');
    expect(node).toBeDisabled();
    expect(network).toBeEnabled();
    expect(kind).toBeDisabled();
  });

  it('submits the chosen network as the PrefNic override and returns to the list', async () => {
    renderForm();
    await waitFor(() => expect(screen.getByPlaceholderText('Please input storage pool name')).toHaveValue('pool-lvm'));
    const network = screen.getAllByRole('combobox')[1];
    fireEvent.mouseDown(network);
    fireEvent.click(await screen.findByText('eth1', { selector: '.ant-select-item-option-content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(updateStoragePool).toHaveBeenCalledWith(
        { node: 'node-1', storagepool: 'pool-lvm' },
        { delete_namespaces: [], delete_props: [], override_props: { PrefNic: 'eth1' } },
      ),
    );
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/inventory/storage-pools'), { timeout: 3000 });
  });

  it('stays on the page when the controller reports a failure', async () => {
    vi.mocked(updateStoragePool).mockResolvedValue({ data: [{ ret_code: -1, message: 'nope' }] } as never);
    renderForm();
    await waitFor(() => expect(screen.getByPlaceholderText('Please input storage pool name')).toHaveValue('pool-lvm'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(updateStoragePool).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 1200));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('cancel refreshes the list query and goes back', async () => {
    const refetch = renderForm();
    await waitFor(() => expect(getStoragePoolByNode).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(refetch).toHaveBeenCalledWith({ queryKey: ['getStoragePool'] });
    expect(navigate).toHaveBeenCalledWith('/inventory/storage-pools');
    expect(updateStoragePool).not.toHaveBeenCalled();
  });
});
