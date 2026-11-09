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
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CreateForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

// A device option shows its path and, beside it, what the device is.
const OPTION = '.ant-select-item-option-content, .ant-select-item-option-content > div > span:first-child';

const pick = async (combobox: HTMLElement, label: string) => {
  fireEvent.mouseDown(combobox);
  fireEvent.click(await screen.findByText(label, { selector: OPTION }));
};

const listedDevices = async () =>
  (await screen.findAllByText(/^\/dev\//, { selector: OPTION })).map((d) => d.textContent);

const GIB = 1024 ** 3;

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
    expect(await screen.findByText('Please input storage pool name!')).toBeInTheDocument();
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
    expect(await listedDevices()).toEqual(['/dev/sdb', '/dev/sdc']);
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

  it('creates on every chosen node, with no switch to allow several', async () => {
    renderForm();
    typeName('pool-multi');
    expect(screen.queryByText('Multiple Nodes')).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();
    await pick(nodeSelect(), 'node-1');
    await pick(nodeSelect(), 'node-2');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalledWith({ node: 'node-1' }));
    await pick(deviceSelect(), '/dev/sdc');
    submit();

    await waitFor(() => expect(createPhysicalStorage).toHaveBeenCalledTimes(2));
    expect(vi.mocked(createPhysicalStorage).mock.calls.map((c) => c[0])).toEqual(['node-1', 'node-2']);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  it('a pool on a new device can be built from several devices', async () => {
    renderForm();
    typeName('pool-two');
    await pick(nodeSelect(), 'node-1');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalled());
    await pick(deviceSelect(), '/dev/sdb');
    await pick(deviceSelect(), '/dev/sdc');
    submit();

    await waitFor(() => expect(createPhysicalStorage).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createPhysicalStorage).mock.calls[0][1]).toMatchObject({
      device_paths: ['/dev/sdb', '/dev/sdc'],
    });
  });

  it('with several nodes, only the devices every one of them has are offered', async () => {
    const devicesByNode: Record<string, string[]> = {
      'node-1': ['/dev/sdb', '/dev/sdc'],
      'node-2': ['/dev/sdc', '/dev/sdd'],
    };
    vi.mocked(getPhysicalStoragePoolByNode).mockImplementation(
      ({ node }) => Promise.resolve({ data: devicesByNode[node].map((device) => ({ device, size: 1 })) }) as never,
    );
    renderForm();
    await pick(nodeSelect(), 'node-1');
    await pick(nodeSelect(), 'node-2');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalledWith({ node: 'node-2' }));

    fireEvent.mouseDown(deviceSelect());
    await waitFor(async () => expect(await listedDevices()).toEqual(['/dev/sdc']));
    expect(screen.getByText('Only the devices that all 2 chosen nodes have are listed.')).toBeInTheDocument();
  });

  it('says what each device is: size, HDD or SSD, model; a chosen one shows only its path', async () => {
    vi.mocked(getPhysicalStoragePoolByNode).mockResolvedValue({
      data: [
        { device: '/dev/sdb', size: 2 * 1024 * GIB, rotational: false, model: 'Samsung 870 ' },
        { device: '/dev/sdc', size: 4 * GIB, rotational: true, model: '' },
      ],
    } as never);
    renderForm();
    await pick(nodeSelect(), 'node-1');
    fireEvent.mouseDown(deviceSelect());
    expect(await screen.findByText('2.00 TiB · SSD · Samsung 870')).toBeInTheDocument();
    expect(screen.getByText('4.00 GiB · HDD')).toBeInTheDocument();

    await pick(deviceSelect(), '/dev/sdb');
    const tag = document.querySelector('.ant-select-selection-item[title="/dev/sdb"]') as HTMLElement;
    expect(tag).toHaveTextContent(/^\/dev\/sdb$/);
  });

  it('with several nodes, a device whose size differs shows the range, and what they disagree on is left out', async () => {
    const byNode: Record<string, object[]> = {
      'node-1': [{ device: '/dev/sdc', size: 100 * GIB, rotational: false, model: 'A' }],
      'node-2': [{ device: '/dev/sdc', size: 120 * GIB, rotational: true, model: 'A' }],
    };
    vi.mocked(getPhysicalStoragePoolByNode).mockImplementation(
      ({ node }) => Promise.resolve({ data: byNode[node] }) as never,
    );
    renderForm();
    await pick(nodeSelect(), 'node-1');
    await pick(nodeSelect(), 'node-2');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalledWith({ node: 'node-2' }));
    fireEvent.mouseDown(deviceSelect());
    expect(await screen.findByText('100.00–120.00 GiB · A')).toBeInTheDocument();
  });

  it('an empty device list says what LINSTOR takes', async () => {
    vi.mocked(getPhysicalStoragePoolByNode).mockResolvedValue({ data: [] } as never);
    renderForm();
    fireEvent.mouseDown(deviceSelect());
    expect(await screen.findByText('Select a node first.')).toBeInTheDocument();

    await pick(nodeSelect(), 'node-1');
    fireEvent.mouseDown(deviceSelect());
    expect(await screen.findByText(/^No device can be used\./)).toBeInTheDocument();
    expect(screen.getByText('Larger than 1 GiB.')).toBeInTheDocument();
    expect(screen.getByText('Not a DRBD device.')).toBeInTheDocument();
  });

  it('explains the chosen mode under the buttons', async () => {
    renderForm();
    expect(screen.getByText(/^Creates an LVM or ZFS pool on one or more empty devices/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Existing Device'));
    expect(await screen.findByText(/^Uses a pool that already exists on the nodes/)).toBeInTheDocument();
    expect(screen.queryByText(/^Creates an LVM or ZFS pool/)).toBeNull();
  });

  it('VDO has a tooltip', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Advanced Options'));
    const vdo = await screen.findByText('VDO Enabled');
    expect(vdo.closest('label')?.querySelector('.ant-form-item-tooltip')).not.toBeNull();
  });

  it('removing every chosen device asks for one again', async () => {
    renderForm();
    typeName('pool-none');
    await pick(nodeSelect(), 'node-1');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalled());
    await pick(deviceSelect(), '/dev/sdb');
    // Clicking a chosen option again takes it out.
    await pick(deviceSelect(), '/dev/sdb');
    submit();

    expect(await screen.findByText('Please select device path!')).toBeInTheDocument();
    expect(createPhysicalStorage).not.toHaveBeenCalled();
  });

  it('changing the node drops the devices chosen for the previous one', async () => {
    renderForm();
    typeName('pool-moved');
    await pick(nodeSelect(), 'node-1');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalled());
    await pick(deviceSelect(), '/dev/sdb');
    await pick(nodeSelect(), 'node-2');
    submit();

    expect(await screen.findByText('Please select device path!')).toBeInTheDocument();
    expect(createPhysicalStorage).not.toHaveBeenCalled();
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
    typeName('pool-vg');
    await pick(nodeSelect(), 'node-2');
    fireEvent.mouseDown(typeSelect());
    // The existing-device list also offers DISKLESS and the file/SPDK kinds.
    expect(await screen.findByText('DISKLESS', { selector: '.ant-select-item-option-content' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('LVM_THIN', { selector: '.ant-select-item-option-content' }));
    fireEvent.change(await screen.findByPlaceholderText('Volume Group/Thin Pool Name'), {
      target: { value: 'vg0/thin' },
    });
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

  it('a diskless pool asks for no volume group and sends no driver name', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Existing Device'));
    typeName('pool-dl');

    await pick(nodeSelect(), 'node-2');
    fireEvent.mouseDown(typeSelect());
    fireEvent.click(await screen.findByText('DISKLESS', { selector: '.ant-select-item-option-content' }));
    await waitFor(() => expect(screen.queryByPlaceholderText('Volume Group/Thin Pool Name')).not.toBeInTheDocument());
    submit();

    await waitFor(() =>
      expect(createStoragePool).toHaveBeenCalledWith('node-2', {
        storage_pool_name: 'pool-dl',
        provider_kind: 'DISKLESS',
        external_locking: false,
      }),
    );
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
  });

  it('an existing volume group on two nodes creates both pools and goes back once', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Existing Device'));
    typeName('pool-vg');
    await pick(nodeSelect(), 'node-1');
    await pick(nodeSelect(), 'node-2');
    fireEvent.change(await screen.findByPlaceholderText('Volume Group/Thin Pool Name'), {
      target: { value: 'vg0' },
    });
    submit();

    await waitFor(() => expect(createStoragePool).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Going back once per node left the GUI.
    await new Promise((r) => setTimeout(r, 20));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('stays on the page when the controller refuses a pool', async () => {
    // openapi-fetch resolves an error reply rather than rejecting.
    vi.mocked(createPhysicalStorage).mockResolvedValue({
      error: [{ ret_code: -1, message: 'pool exists' }],
      response: new Response(null, { status: 500 }),
    } as never);
    renderForm();
    typeName('pool-taken');
    await pick(nodeSelect(), 'node-1');
    await waitFor(() => expect(getPhysicalStoragePoolByNode).toHaveBeenCalled());
    await pick(deviceSelect(), '/dev/sdb');
    submit();
    await waitFor(() => expect(createPhysicalStorage).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('picking a ZFS kind reminds about ZFS and relabels the pool field', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Existing Device'));
    await pick(typeSelect(), 'ZFS');
    expect(await screen.findByText(/install and configure ZFS/)).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('ZFS Pool name')).toBeInTheDocument();
  });

  it('cancel goes back without creating', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(navigate).toHaveBeenCalledWith(-1);
    expect(createPhysicalStorage).not.toHaveBeenCalled();
  });
});
