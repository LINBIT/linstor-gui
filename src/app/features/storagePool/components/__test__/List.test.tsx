// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { forwardRef, useImperativeHandle, useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Real antd and a real query client; only the transport, the router's
// navigate and the redux UI mode are replaced.

vi.mock('../../api', () => ({
  getStoragePool: vi.fn(),
  getStoragePoolCount: vi.fn(),
  deleteStoragePoolV2: vi.fn(),
  updateStoragePool: vi.fn(),
}));

vi.mock('@app/features/node', () => ({
  useNodes: () => ({ data: [{ name: 'node-1' }, { name: 'node-2' }, { name: 'node-3' }], isLoading: false }),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

let uiMode = 'NORMAL';
vi.mock('react-redux', () => ({
  useSelector: (selector: (s: unknown) => unknown) => selector({ setting: { mode: uiMode } }),
}));
vi.mock('@app/models/setting', () => ({
  UIMode: { NORMAL: 'NORMAL', VSAN: 'VSAN', HCI: 'HCI' },
}));

vi.mock('@app/components/PropertyForm', () => ({
  default: forwardRef(function PropertyFormMock(
    { handleSubmit, initialVal }: { handleSubmit: (d: unknown) => void; initialVal?: Record<string, unknown> },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    useImperativeHandle(ref, () => ({ openModal: () => setOpen(true) }));
    return open ? (
      <button data-testid="property-form-submit" onClick={() => handleSubmit({ override_props: initialVal })}>
        property-form
      </button>
    ) : null;
  }),
}));

import { getStoragePool, getStoragePoolCount, deleteStoragePoolV2, updateStoragePool } from '../../api';
import { List } from '../List';

const GIB = 1024 * 1024;

const pools = [
  {
    uuid: 'sp-1',
    storage_pool_name: 'pool-lvm',
    node_name: 'node-1',
    provider_kind: 'LVM',
    free_capacity: 1 * GIB,
    total_capacity: 4 * GIB,
    supports_snapshots: false,
    props: { 'StorDriver/StorPoolName': 'vg0', PrefNic: 'eth0' },
  },
  {
    uuid: 'sp-2',
    storage_pool_name: 'DfltDisklessStorPool',
    node_name: 'node-2',
    provider_kind: 'DISKLESS',
    supports_snapshots: false,
    props: {},
  },
  {
    uuid: 'sp-3',
    storage_pool_name: 'pool-zfs',
    node_name: 'node-3',
    provider_kind: 'ZFS_THIN',
    free_capacity: 512 * 1024,
    total_capacity: 2 * GIB,
    supports_snapshots: true,
    props: { 'StorDriver/StorPoolName': 'tank' },
  },
];

const renderList = (initialEntry = '/inventory/storage-pools') => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <List />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

const openRowMenu = async (name: string) => {
  fireEvent.mouseEnter(within(rowOf(name)).getByRole('img', { name: 'more' }));
  let menu: HTMLElement | undefined;
  await waitFor(() => {
    const open = screen
      .getAllByRole('menu')
      .filter((m) => !m.closest('.ant-dropdown')?.classList.contains('ant-dropdown-hidden'));
    expect(open).toHaveLength(1);
    menu = open[0];
  });
  return menu as HTMLElement;
};

describe('storage pool List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    vi.mocked(getStoragePool).mockImplementation(async (query?: { storage_pools?: string[] }) => {
      if (query?.storage_pools?.[0] === 'DfltDisklessStorPool') {
        return { data: [pools[1]] } as never;
      }
      return { data: pools } as never;
    });
    vi.mocked(getStoragePoolCount).mockResolvedValue({ data: { count: 3 } } as never);
    vi.mocked(deleteStoragePoolV2).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(updateStoragePool).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('lists pools with node links, provider tags, disk, capacities and snapshot support', async () => {
    renderList();
    const lvm = (await screen.findByText('pool-lvm')).closest('tr') as HTMLElement;
    expect(within(lvm).getByText('node-1').closest('a')).toHaveAttribute('href', '/inventory/nodes/node-1');
    expect(within(lvm).getByText('LVM')).toBeInTheDocument();
    expect(within(lvm).getByText('vg0')).toBeInTheDocument();
    expect(within(lvm).getByText('1.00 GiB')).toBeInTheDocument();
    expect(within(lvm).getByText('4.00 GiB')).toBeInTheDocument();
    expect(lvm.querySelector('.anticon-close-circle')).not.toBeNull();

    const diskless = rowOf('DfltDisklessStorPool');
    expect(within(diskless).getAllByText('N/A')).toHaveLength(3);

    const zfs = rowOf('pool-zfs');
    expect(within(zfs).getByText('512.00 MiB')).toBeInTheDocument();
    expect(zfs.querySelector('.anticon-check-circle')).not.toBeNull();

    expect(screen.getByText('Total 3 items')).toBeInTheDocument();
    expect(getStoragePool).toHaveBeenCalledWith({ limit: 10, offset: 0 });
  });

  it('hiding default pools drops them from the list and the total, and over-fetches to fill the page', async () => {
    renderList();
    await screen.findByText('DfltDisklessStorPool');
    fireEvent.click(screen.getByRole('switch'));
    // The toggle is part of the query key, so the list reloads before it filters.
    await waitFor(() => expect(getStoragePool).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 15 })));
    expect(await screen.findByText('pool-lvm')).toBeInTheDocument();
    expect(await screen.findByText('Total 2 items')).toBeInTheDocument();
    expect(screen.queryByText('DfltDisklessStorPool')).not.toBeInTheDocument();
  });

  it('search sends node and pool name to the backend and the URL', async () => {
    renderList();
    await screen.findByText('pool-lvm');
    // The page-size picker is a combobox too; the node filter comes first.
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByText('node-3', { selector: '.ant-select-item-option-content' }));
    fireEvent.change(screen.getByPlaceholderText('Storage Pool Name'), { target: { value: 'pool-z' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() =>
      expect(getStoragePool).toHaveBeenLastCalledWith(
        expect.objectContaining({ nodes: 'node-3', storage_pools: 'pool-z' }),
      ),
    );
    expect(navigate).toHaveBeenCalledWith('/inventory/storage-pools?nodes=node-3&storage_pools=pool-z');
  });

  it('seeds the filters from the URL', async () => {
    renderList('/inventory/storage-pools?nodes=node-1&storage_pools=pool-lvm');
    await screen.findByText('pool-lvm');
    expect(getStoragePool).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      nodes: ['node-1'],
      storage_pools: ['pool-lvm'],
    });
  });

  it('reset clears the query and returns to the list route', async () => {
    renderList('/inventory/storage-pools?nodes=node-1');
    await screen.findByText('pool-lvm');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(getStoragePool).toHaveBeenLastCalledWith({}));
    expect(navigate).toHaveBeenCalledWith('/inventory/storage-pools');
  });

  it('uses the HCI routes in HCI mode', async () => {
    uiMode = 'HCI';
    renderList();
    const lvm = (await screen.findByText('pool-lvm')).closest('tr') as HTMLElement;
    expect(within(lvm).getByText('node-1').closest('a')).toHaveAttribute('href', '/hci/inventory/nodes/node-1');
    expect(screen.getByText('+ Add').closest('a')).toHaveAttribute('href', '/hci/inventory/storage-pools/create');
    const menu = await openRowMenu('pool-lvm');
    fireEvent.click(within(menu).getByText('Edit'));
    expect(navigate).toHaveBeenCalledWith('/hci/inventory/storage-pools/node-1/pool-lvm/edit');
  });

  it('edit from the row menu goes to the edit page', async () => {
    renderList();
    await screen.findByText('pool-lvm');
    const menu = await openRowMenu('pool-lvm');
    fireEvent.click(within(menu).getByText('Edit'));
    expect(navigate).toHaveBeenCalledWith('/inventory/storage-pools/node-1/pool-lvm/edit');
  });

  it('deletes after confirm and refetches', async () => {
    renderList();
    await screen.findByText('pool-zfs');
    const menu = await openRowMenu('pool-zfs');
    fireEvent.click(within(menu).getByText('Delete'));
    expect(await screen.findByText('Are you sure to delete this storage pool?')).toBeInTheDocument();
    expect(deleteStoragePoolV2).not.toHaveBeenCalled();
    const listCallsBefore = vi.mocked(getStoragePool).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteStoragePoolV2).toHaveBeenCalledWith({ node: 'node-3', storagepool: 'pool-zfs' }));
    await waitFor(() => expect(getStoragePool).toHaveBeenCalledTimes(listCallsBefore + 1));
  });

  it('bulk delete needs a selection, confirms, then deletes each selected pool', async () => {
    renderList();
    await screen.findByText('pool-lvm');
    const bulk = screen.getByRole('button', { name: 'Delete' });
    expect(bulk).toBeDisabled();
    const [, lvmBox, , zfsBox] = screen.getAllByRole('checkbox');
    fireEvent.click(lvmBox);
    fireEvent.click(zfsBox);
    expect(bulk).toBeEnabled();
    fireEvent.click(bulk);
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteStoragePoolV2).toHaveBeenCalledTimes(2));
    expect(deleteStoragePoolV2).toHaveBeenCalledWith({ node: 'node-1', storagepool: 'pool-lvm' });
    expect(deleteStoragePoolV2).toHaveBeenCalledWith({ node: 'node-3', storagepool: 'pool-zfs' });
  });

  it('the property form submits to the pool it was opened for', async () => {
    renderList();
    await screen.findByText('pool-lvm');
    const menu = await openRowMenu('pool-lvm');
    fireEvent.click(within(menu).getByText('Properties'));
    fireEvent.click(await screen.findByTestId('property-form-submit'));
    await waitFor(() =>
      expect(updateStoragePool).toHaveBeenCalledWith(
        { node: 'node-1', storagepool: 'pool-lvm' },
        { override_props: { 'StorDriver/StorPoolName': 'vg0', PrefNic: 'eth0' } },
      ),
    );
  });

  it('shows an empty table when there are no pools', async () => {
    vi.mocked(getStoragePool).mockResolvedValue({ data: [] } as never);
    vi.mocked(getStoragePoolCount).mockResolvedValue({ data: { count: 0 } } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
  });
});
