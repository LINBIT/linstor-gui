// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { forwardRef, useImperativeHandle, useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from 'antd';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The resource overview on real antd and a real query client. The two
// transports (definitions, live resources view) and every cross-feature
// dependency are mocked at their module; the dialogs that have their own
// suites are reduced to markers.

vi.mock('../../api', () => ({
  adjustResourceGroup: vi.fn(),
  deleteResource: vi.fn(),
  getResources: vi.fn(),
  resourceMigration: vi.fn(),
  resourceModify: vi.fn(),
  toggleResource: vi.fn(),
  createResourceOnNode: vi.fn(),
}));

vi.mock('@app/features/resourceDefinition', () => ({
  deleteResourceDefinition: vi.fn(),
  getResourceDefinition: vi.fn(),
  updateResourceDefinition: vi.fn(),
  updateVolumeDefinition: vi.fn(),
  cloneResourceDefinition: vi.fn(),
  ResizeVolumeModal: ({ open, resourceName }: { open: boolean; resourceName: string }) =>
    open ? <div>resize-modal:{resourceName}</div> : null,
}));

vi.mock('@app/features/volumeDefinition', () => ({
  CreateForm: () => <span>create-volume-definition</span>,
}));
vi.mock('@app/features/resourceGroup/components/SpawnForm', () => ({
  SpawnForm: () => <button>spawn-form</button>,
}));
vi.mock('@app/hooks', () => ({
  useWidth: () => ({ width: 1400 }),
}));
vi.mock('@app/features/node', () => ({
  useNodes: () => ({ data: [{ name: 'node-1' }, { name: 'node-2' }, { name: 'node-3' }], isLoading: false }),
}));
vi.mock('@app/features/node/api', () => ({
  getNodes: vi.fn(async () => ({ data: [{ name: 'node-1' }, { name: 'node-2' }, { name: 'node-3' }] })),
}));
vi.mock('@app/features/storagePool', () => ({
  useStoragePools: () => ({ isLoading: false, data: [] }),
}));

vi.mock('@app/components/PropertyForm', () => ({
  default: forwardRef(function PropertyFormMock(
    { handleSubmit, type }: { handleSubmit: (d: unknown) => void; type: string },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    useImperativeHandle(ref, () => ({ openModal: () => setOpen(true), closeModal: () => setOpen(false) }));
    return open ? (
      <button data-testid={`property-form-${type}`} onClick={() => handleSubmit({ override_props: { 'Aux/k': 'v' } })}>
        property-form
      </button>
    ) : null;
  }),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

let uiMode = 'NORMAL';
let grafanaEnabled = false;
const createSnapshot = vi.fn();
vi.mock('react-redux', () => ({
  useSelector: (selector: (s: unknown) => unknown) =>
    selector({ setting: { mode: uiMode, grafanaConfig: { enable: grafanaEnabled } } }),
  useDispatch: () => ({ snapshot: { createSnapshot } }),
}));
vi.mock('@app/models/setting', () => ({
  UIMode: { NORMAL: 'NORMAL', VSAN: 'VSAN', HCI: 'HCI' },
}));

import {
  adjustResourceGroup,
  deleteResource,
  getResources,
  resourceMigration,
  resourceModify,
  toggleResource,
} from '../../api';
import {
  deleteResourceDefinition,
  getResourceDefinition,
  updateResourceDefinition,
  updateVolumeDefinition,
} from '@app/features/resourceDefinition';
import { OverviewList } from '../OverviewList';

const GIB = 1024 * 1024;
const ok = { data: [{ ret_code: 1 }] };

const definitions = [
  {
    name: 'res-a',
    resource_group_name: 'rg-1',
    layer_data: [{ type: 'DRBD' }, { type: 'STORAGE' }],
    props: { 'Aux/team': 'db' },
    volume_definitions: [{ volume_number: 0, size_kib: 4 * GIB, props: { 'Aux/vd': '1' }, flags: [] }],
  },
  {
    name: 'res-b',
    resource_group_name: 'rg-2',
    layer_data: [{ type: 'STORAGE' }],
    props: {},
    volume_definitions: [{ volume_number: 0, size_kib: 1 * GIB, flags: ['RESIZE'] }],
  },
  { name: 'res-empty', resource_group_name: 'rg-1', layer_data: [], props: {}, volume_definitions: [] },
];

const volume = (over: Record<string, unknown> = {}) => ({
  volume_number: 0,
  allocated_size_kib: 2 * GIB,
  storage_pool_name: 'pool-a',
  device_path: '/dev/drbd1000',
  provider_kind: 'LVM_THIN',
  state: { disk_state: 'UpToDate' },
  ...over,
});

const resourcesView = [
  {
    name: 'res-a',
    node_name: 'node-1',
    flags: [],
    state: { in_use: true },
    layer_object: { drbd: { connections: { 'node-2': { connected: true } } } },
    volumes: [volume()],
  },
  {
    name: 'res-a',
    node_name: 'node-2',
    flags: ['DRBD_DISKLESS'],
    state: { in_use: false },
    layer_object: { drbd: { connections: { 'node-1': { connected: false, message: 'Connecting' } } } },
    volumes: [
      volume({ allocated_size_kib: 0, storage_pool_name: 'DfltDisklessStorPool', state: { disk_state: 'Diskless' } }),
    ],
  },
  {
    name: 'res-b',
    node_name: 'node-1',
    flags: [],
    state: { in_use: false },
    layer_object: { drbd: { connections: {} } },
    volumes: [volume({ allocated_size_kib: 1 * GIB })],
  },
];

const renderList = (initialEntry = '/storage-configuration/resource-overview') => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <OverviewList />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

const openMenuIn = async (scope: HTMLElement) => {
  fireEvent.mouseEnter(within(scope).getByRole('img', { name: 'more' }));
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

const expandRow = async (name: string) => {
  fireEvent.click(within(rowOf(name)).getByRole('button', { name: /expand/i }));
  // The expanded row holds a nested table with one row per node.
  return await waitFor(() => {
    const nested = rowOf(name).nextElementSibling as HTMLElement;
    expect(nested).toHaveClass('ant-table-expanded-row');
    return nested;
  });
};

const nodeRowIn = (expanded: HTMLElement, node: string) =>
  within(expanded).getByText(node).closest('tr') as HTMLElement;

const confirmYes = async () => fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

describe('resource OverviewList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    grafanaEnabled = false;
    vi.mocked(getResourceDefinition).mockResolvedValue({ data: definitions } as never);
    vi.mocked(getResources).mockResolvedValue({ data: resourcesView } as never);
    for (const fn of [
      adjustResourceGroup,
      deleteResource,
      resourceMigration,
      resourceModify,
      toggleResource,
      deleteResourceDefinition,
      updateResourceDefinition,
      updateVolumeDefinition,
    ]) {
      vi.mocked(fn).mockResolvedValue(ok as never);
    }
  });

  afterEach(() => {
    // Modal.warning renders into its own root that unmount() does not reach.
    Modal.destroyAll();
  });

  it('lists definitions with group links, layer tags, aux columns and a connection-derived state', async () => {
    renderList();
    const a = (await screen.findByText('res-a')).closest('tr') as HTMLElement;
    expect(getResourceDefinition).toHaveBeenCalledWith(expect.objectContaining({ with_volume_definitions: true }));
    expect(within(a).getByText('rg-1').closest('a')).toHaveAttribute(
      'href',
      '/storage-configuration/resource-groups?resource_groups=rg-1',
    );
    expect(within(a).getByText('DRBD')).toBeInTheDocument();
    expect(within(a).getByText('STORAGE')).toBeInTheDocument();
    // The Aux property becomes a column of its own on wide screens (antd
    // renders the header once more for the horizontal-scroll copy).
    expect(screen.getAllByText('Aux/team').length).toBeGreaterThan(0);
    expect(within(a).getByText('db')).toBeInTheDocument();
    // node-2 reports its link to node-1 as down.
    await waitFor(() => expect(within(rowOf('res-a')).getByText('node-1 Connecting')).toBeInTheDocument());
    expect(within(rowOf('res-b')).getByText('RESIZING')).toBeInTheDocument();
    expect(screen.getByText('Total 3 items')).toBeInTheDocument();
  });

  it('filters by name, by aux property value and by resource group', async () => {
    renderList();
    await screen.findByText('res-a');
    const search = screen.getByPlaceholderText('Search by resource name or aux property value');

    fireEvent.change(search, { target: { value: 'res-b' } });
    await waitFor(() => expect(screen.queryByText('res-a')).not.toBeInTheDocument());
    expect(screen.getByText('res-b')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'db' } });
    await waitFor(() => expect(screen.getByText('res-a')).toBeInTheDocument());
    expect(screen.queryByText('res-b')).not.toBeInTheDocument();

    // One character is not a search.
    fireEvent.change(search, { target: { value: 'r' } });
    await waitFor(() => expect(screen.getByText('res-b')).toBeInTheDocument());

    fireEvent.change(search, { target: { value: '' } });
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByText('rg-2', { selector: '.ant-select-item-option-content' }));
    await waitFor(() => expect(screen.queryByText('res-a')).not.toBeInTheDocument());
    expect(screen.getByText('res-b')).toBeInTheDocument();
    expect(screen.queryByText('res-empty')).not.toBeInTheDocument();
  });

  it('seeds the search from ?resource= and reset clears it', async () => {
    renderList('/storage-configuration/resource-overview?resource=res-b');
    expect(await screen.findByText('res-b')).toBeInTheDocument();
    expect(screen.queryByText('res-a')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(await screen.findByText('res-a')).toBeInTheDocument();
  });

  it('expands a definition into one row per node with size, pool, device, connection and primary', async () => {
    renderList();
    await screen.findByText('res-a');
    await waitFor(() => expect(within(rowOf('res-a')).getByText('node-1 Connecting')).toBeInTheDocument());
    const expanded = await expandRow('res-a');

    const n1 = nodeRowIn(expanded, 'node-1');
    expect(within(n1).getByText('2.00 GiB / 4.00 GiB (50.00%)')).toBeInTheDocument();
    expect(within(n1).getByText('pool-a').closest('a')).toHaveAttribute(
      'href',
      '/inventory/storage-pools?storage_pools=pool-a',
    );
    expect(within(n1).getByText('/dev/drbd1000')).toBeInTheDocument();
    expect(within(n1).getByText('OK')).toBeInTheDocument();
    expect(within(n1).getByText('Primary')).toBeInTheDocument();
    expect(n1).toHaveClass('ant-table-row-primary');

    const n2 = nodeRowIn(expanded, 'node-2');
    expect(within(n2).getByText('node-1 Connecting')).toBeInTheDocument();
    expect(within(n2).queryByText('Primary')).not.toBeInTheDocument();
  });

  it('the stats icon warns without Grafana and navigates with it', async () => {
    const { unmount } = renderList();
    await screen.findByText('res-a');
    let expanded = await expandRow('res-a');
    fireEvent.click(within(nodeRowIn(expanded, 'node-1')).getByRole('img', { name: 'line-chart' }));
    expect((await screen.findAllByText('Grafana Dashboard Not Enabled')).length).toBeGreaterThan(0);
    expect(navigate).not.toHaveBeenCalled();
    Modal.destroyAll();
    unmount();

    grafanaEnabled = true;
    renderList();
    await screen.findByText('res-a');
    expanded = await expandRow('res-a');
    fireEvent.click(within(nodeRowIn(expanded, 'node-1')).getByRole('img', { name: 'line-chart' }));
    expect(navigate).toHaveBeenCalledWith('/stats/node-1/res-a');
  });

  describe('per-node actions', () => {
    it('removes the disk of a diskful node and adds one to a diskless node, after confirm', async () => {
      renderList();
      await screen.findByText('res-a');
      const expanded = await expandRow('res-a');

      let menu = await openMenuIn(nodeRowIn(expanded, 'node-1'));
      fireEvent.click(within(menu).getByText('Remove Disk'));
      expect(await screen.findByText('Are you sure to toggle this resource?')).toBeInTheDocument();
      await confirmYes();
      await waitFor(() => expect(toggleResource).toHaveBeenCalledWith('res-a', 'node-1', 'to_diskless'));

      fireEvent.mouseLeave(within(nodeRowIn(expanded, 'node-1')).getByRole('img', { name: 'more' }));
      menu = await openMenuIn(nodeRowIn(expanded, 'node-2'));
      fireEvent.click(within(menu).getByText('Add Disk'));
      await confirmYes();
      await waitFor(() => expect(toggleResource).toHaveBeenCalledWith('res-a', 'node-2', 'to_diskful'));
    });

    it('deletes the resource from one node after confirm and refetches', async () => {
      renderList();
      await screen.findByText('res-a');
      const expanded = await expandRow('res-a');
      const menu = await openMenuIn(nodeRowIn(expanded, 'node-1'));
      fireEvent.click(within(menu).getByText('Delete'));
      expect(await screen.findByText('Are you sure to delete this resource?')).toBeInTheDocument();
      expect(deleteResource).not.toHaveBeenCalled();
      const before = vi.mocked(getResources).mock.calls.length;
      await confirmYes();
      await waitFor(() => expect(deleteResource).toHaveBeenCalledWith('res-a', 'node-1'));
      await waitFor(() => expect(vi.mocked(getResources).mock.calls.length).toBeGreaterThan(before));
    });

    it('migrates the disk to another node', async () => {
      renderList();
      await screen.findByText('res-a');
      const expanded = await expandRow('res-a');
      const menu = await openMenuIn(nodeRowIn(expanded, 'node-1'));
      fireEvent.click(within(menu).getByText('Migrate'));

      const dialog = await screen.findByRole('dialog', { name: 'Migrate Resource' });
      expect(within(dialog).getByDisplayValue('node-1')).toBeDisabled();
      expect(within(dialog).getByDisplayValue('res-a')).toBeDisabled();
      fireEvent.mouseDown(within(dialog).getByRole('combobox'));
      // The source node is not a target.
      const targets = await screen.findAllByText(/^node-/, { selector: '.ant-select-item-option-content' });
      expect(targets.map((t) => t.textContent)).toEqual(['node-2', 'node-3']);
      fireEvent.click(targets[1]);
      fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

      await waitFor(() =>
        expect(resourceMigration).toHaveBeenCalledWith({ resource: 'res-a', fromnode: 'node-1', node: 'node-3' }),
      );
    });

    it('creates a snapshot through the store', async () => {
      renderList();
      await screen.findByText('res-a');
      const expanded = await expandRow('res-a');
      const menu = await openMenuIn(nodeRowIn(expanded, 'node-1'));
      fireEvent.click(within(menu).getByText('Snapshot'));
      const dialog = await screen.findByRole('dialog', { name: 'Create Snapshot' });
      fireEvent.change(within(dialog).getByPlaceholderText('Please input snapshot name here...'), {
        target: { value: 'snap-1' },
      });
      fireEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
      await waitFor(() => expect(createSnapshot).toHaveBeenCalledWith({ resource: 'res-a', name: 'snap-1' }));
    });

    it('edits the resource properties of that node', async () => {
      renderList();
      await screen.findByText('res-a');
      const expanded = await expandRow('res-a');
      const menu = await openMenuIn(nodeRowIn(expanded, 'node-2'));
      fireEvent.click(within(menu).getByText('Properties'));
      fireEvent.click(await screen.findByTestId('property-form-resource'));
      await waitFor(() =>
        expect(resourceModify).toHaveBeenCalledWith('res-a', 'node-2', { override_props: { 'Aux/k': 'v' } }),
      );
    });
  });

  describe('per-definition actions', () => {
    it('opens "add to node" for the definition', async () => {
      renderList();
      await screen.findByText('res-a');
      const menu = await openMenuIn(rowOf('res-a'));
      fireEvent.click(within(menu).getByText('Add Resource to Node'));
      expect(await screen.findByText('Add Resource to Node - res-a')).toBeInTheDocument();
    });

    it('adjusts the resource group after confirm', async () => {
      renderList();
      await screen.findByText('res-a');
      const menu = await openMenuIn(rowOf('res-a'));
      fireEvent.click(within(menu).getByText('Adjust'));
      expect(await screen.findByText('Are you sure to adjust this resource?')).toBeInTheDocument();
      await confirmYes();
      await waitFor(() => expect(adjustResourceGroup).toHaveBeenCalledWith({ resource_group: 'rg-1' }));
    });

    it('opens the resize dialog and the clone dialog', async () => {
      renderList();
      await screen.findByText('res-a');
      let menu = await openMenuIn(rowOf('res-a'));
      fireEvent.click(within(menu).getByText('Resize'));
      expect(await screen.findByText('resize-modal:res-a')).toBeInTheDocument();

      fireEvent.mouseLeave(within(rowOf('res-a')).getByRole('img', { name: 'more' }));
      menu = await openMenuIn(rowOf('res-b'));
      fireEvent.click(within(menu).getByText('Clone'));
      expect(await screen.findByPlaceholderText('Input clone name')).toBeInTheDocument();
    });

    it('submits definition and volume-definition properties to the right endpoints', async () => {
      renderList();
      await screen.findByText('res-a');
      let menu = await openMenuIn(rowOf('res-a'));
      fireEvent.click(within(menu).getByText('Resource Definition Properties'));
      fireEvent.click(await screen.findByTestId('property-form-resource-definition'));
      await waitFor(() =>
        expect(updateResourceDefinition).toHaveBeenCalledWith('res-a', { override_props: { 'Aux/k': 'v' } }),
      );

      fireEvent.mouseLeave(within(rowOf('res-a')).getByRole('img', { name: 'more' }));
      menu = await openMenuIn(rowOf('res-a'));
      fireEvent.click(within(menu).getByText('Volume Definition Properties'));
      fireEvent.click(await screen.findByTestId('property-form-volume-definition'));
      await waitFor(() =>
        expect(updateVolumeDefinition).toHaveBeenCalledWith('res-a', 0, { override_props: { 'Aux/k': 'v' } }),
      );
    });

    it('offers no volume-definition properties for a definition without volumes', async () => {
      renderList();
      await screen.findByText('res-empty');
      const menu = await openMenuIn(rowOf('res-empty'));

      // Reading volumeDefinitions[0] of it used to throw a TypeError on click.
      const item = within(menu).getByText('Volume Definition Properties').closest('li') as HTMLElement;
      expect(item).toHaveClass('ant-dropdown-menu-item-disabled');
      fireEvent.click(item);
      expect(screen.queryByTestId('property-form-volume-definition')).toBeNull();
    });

    it('deletes the definition after confirm', async () => {
      renderList();
      await screen.findByText('res-b');
      const menu = await openMenuIn(rowOf('res-b'));
      fireEvent.click(within(menu).getByText('Delete'));
      expect(await screen.findByText('Are you sure to delete this resource definitions?')).toBeInTheDocument();
      expect(deleteResourceDefinition).not.toHaveBeenCalled();
      await confirmYes();
      await waitFor(() => expect(deleteResourceDefinition).toHaveBeenCalledWith('res-b'));
    });
  });

  it('the Advanced menu leads to the create pages of the current mode', async () => {
    const { unmount } = renderList();
    await screen.findByText('res-a');
    fireEvent.mouseEnter(screen.getByRole('button', { name: /Advanced/ }));
    fireEvent.click(await screen.findByText('Create Resource Definition'));
    expect(navigate).toHaveBeenCalledWith('/storage-configuration/resource-definitions/create');
    fireEvent.click(screen.getByText('Create Resource'));
    expect(navigate).toHaveBeenLastCalledWith('/storage-configuration/resources/create');
    expect(screen.getByText('create-volume-definition')).toBeInTheDocument();
    unmount();

    uiMode = 'HCI';
    renderList();
    await screen.findByText('res-a');
    fireEvent.mouseEnter(screen.getByRole('button', { name: /Advanced/ }));
    fireEvent.click(await screen.findByText('Create Resource'));
    expect(navigate).toHaveBeenLastCalledWith('/hci/storage-configuration/resources/create');
  });

  it('shows an empty table when there are no definitions', async () => {
    vi.mocked(getResourceDefinition).mockResolvedValue({ data: [] } as never);
    vi.mocked(getResources).mockResolvedValue({ data: [] } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
  });
});
