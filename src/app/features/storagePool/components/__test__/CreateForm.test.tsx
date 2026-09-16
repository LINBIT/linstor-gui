// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The form imports its api through the feature barrel; mocking the api
// module covers that path because vitest mocks by resolved file.
vi.mock('../../api', () => ({
  getPhysicalStoragePoolByNode: vi.fn(),
  createPhysicalStorage: vi.fn(),
  createStoragePool: vi.fn(),
  getStoragePool: vi.fn(),
  getStoragePoolByNode: vi.fn(),
  updateStoragePool: vi.fn(),
  deleteStoragePoolV2: vi.fn(),
  getStoragePoolCount: vi.fn(),
}));

vi.mock('@app/features/node', () => ({
  useNodes: () => ({ data: [{ name: 'node-1' }, { name: 'node-2' }], isLoading: false }),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

import { getPhysicalStoragePoolByNode, createPhysicalStorage, createStoragePool } from '../../api';
import { CreateForm } from '../CreateForm';

const ok = { data: [{ ret_code: 1 }] };

const renderForm = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CreateForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const pick = async (combobox: HTMLElement, label: string) => {
  fireEvent.mouseDown(combobox);
  fireEvent.click(await screen.findByText(label, { selector: '.ant-select-item-option-content' }));
};

// New-device form order: node, type, device path.
const nodeSelect = () => screen.getAllByRole('combobox')[0];
const typeSelect = () => screen.getAllByRole('combobox')[1];
const deviceSelect = () => screen.getAllByRole('combobox')[2];

const typeName = (name: string) =>
  fireEvent.change(screen.getByPlaceholderText('Enter storage pool name'), { target: { value: name } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

describe('storage pool CreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPhysicalStoragePoolByNode).mockResolvedValue({
      data: [
        { device: '/dev/sdb', size: 1 },
        { device: '/dev/sdc', size: 1 },
      ],
    } as never);
    vi.mocked(createPhysicalStorage).mockResolvedValue(ok as never);
    vi.mocked(createStoragePool).mockResolvedValue(ok as never);
  });

  it('requires a name, a node and a device for a new device', async () => {
    renderForm();
    submit();
    expect(await screen.findByText('Enter storage pool name')).toBeInTheDocument();
    expect(screen.getByText('Please select nodes!')).toBeInTheDocument();
    expect(screen.getByText('Please select device path!')).toBeInTheDocument();
    expect(createPhysicalStorage).not.toHaveBeenCalled();
  });

  it('rejects a name LINSTOR would refuse', async () => {
    renderForm();
    typeName('-bad');
    submit();
    expect(await screen.findByText('Please input a valid storage pool name!')).toBeInTheDocument();
  });

  it("lists the chosen node's physical devices", async () => {
    renderForm();
    await pick(nodeSelect(), 'node-2');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalledWith({ node: 'node-2' }));
    fireEvent.mouseDown(deviceSelect());
    const devices = await screen.findAllByText(/^\/dev\//, { selector: '.ant-select-item-option-content' });
    expect(devices.map((d) => d.textContent)).toEqual(['/dev/sdb', '/dev/sdc']);
  });

  it('creates physical storage plus pool on one node, then goes back', async () => {
    renderForm();
    typeName('pool-a');
    await pick(nodeSelect(), 'node-1');
    await pick(typeSelect(), 'LVM_THIN');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalled());
    await pick(deviceSelect(), '/dev/sdb');
    submit();

    await waitFor(() =>
      expect(createPhysicalStorage).toHaveBeenCalledWith('node-1', {
        pool_name: 'pool-a',
        provider_kind: 'LVM_THIN',
        raid_level: 'JBOD',
        device_paths: ['/dev/sdb'],
        with_storage_pool: { name: 'pool-a', external_locking: false },
        sed: false,
        vdo_enable: false,
        vdo_slab_size_kib: 0,
        vdo_logical_size_kib: 0,
      }),
    );
    expect(createStoragePool).not.toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  it('creates on every node when multiple nodes is on', async () => {
    renderForm();
    typeName('pool-multi');
    fireEvent.click(screen.getByRole('switch'));
    await pick(nodeSelect(), 'node-1');
    await pick(nodeSelect(), 'node-2');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalledWith({ node: 'node-1' }));
    await pick(deviceSelect(), '/dev/sdc');
    submit();

    await waitFor(() => expect(createPhysicalStorage).toHaveBeenCalledTimes(2));
    expect(vi.mocked(createPhysicalStorage).mock.calls.map((c) => c[0])).toEqual(['node-1', 'node-2']);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  it('stays on the page when a physical storage request fails', async () => {
    vi.mocked(createPhysicalStorage).mockRejectedValue(new Error('device busy'));
    renderForm();
    typeName('pool-fail');
    await pick(nodeSelect(), 'node-1');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalled());
    await pick(deviceSelect(), '/dev/sdb');
    submit();
    await waitFor(() => expect(createPhysicalStorage).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('an existing volume group creates the pool directly with the driver name', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Existing Device'));
    expect(screen.queryByText('Multiple Nodes')).not.toBeInTheDocument();
    typeName('pool-vg');
    await pick(nodeSelect(), 'node-2');
    fireEvent.mouseDown(typeSelect());
    // The existing-device list also offers DISKLESS and the file/SPDK kinds.
    expect(await screen.findByText('DISKLESS', { selector: '.ant-select-item-option-content' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('LVM_THIN', { selector: '.ant-select-item-option-content' }));
    fireEvent.change(screen.getByPlaceholderText('Volume Group/Thin Pool Name'), { target: { value: 'vg0/thin' } });
    submit();

    await waitFor(() =>
      expect(createStoragePool).toHaveBeenCalledWith('node-2', {
        storage_pool_name: 'pool-vg',
        provider_kind: 'LVM_THIN',
        props: { 'StorDriver/StorPoolName': 'vg0/thin' },
        external_locking: false,
      }),
    );
    expect(getPhysicalStoragePoolByNode).not.toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  it('picking a ZFS kind reminds about ZFS and relabels the pool field', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Existing Device'));
    await pick(typeSelect(), 'ZFS');
    expect(await screen.findByText(/install and configure ZFS/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ZFS Pool name')).toBeInTheDocument();
  });

  it('cancel goes back without creating', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(navigate).toHaveBeenCalledWith(-1);
    expect(createPhysicalStorage).not.toHaveBeenCalled();
  });
});
