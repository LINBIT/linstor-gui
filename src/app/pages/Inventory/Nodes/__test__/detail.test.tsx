// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';

import NodeDetail from '../detail';
import { getNodes, getControllerVersion } from '@app/features/node/api';
import { getNetWorkInterfaceByNode, deleteNetWorkInterface, updateNetWorkInterface } from '@app/features/ip';
import { getStoragePool } from '@app/features/storagePool/api';
import { getAllResources } from '@app/features/snapshot/api';
import { NavContext } from '@app/hooks/useNav';
import { renderPage, confirmPopover, ok, tableRows } from '../../__test__/helpers';

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: () => ({ node: 'gui01' }),
}));

vi.mock('@app/features/node/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node/api')>()),
  getNodes: vi.fn(),
  getControllerVersion: vi.fn(),
}));

vi.mock('@app/features/ip', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/ip')>()),
  getNetWorkInterfaceByNode: vi.fn(),
  deleteNetWorkInterface: vi.fn(),
  updateNetWorkInterface: vi.fn(),
  CreateForm: ({ node }: { node?: string }) => <div data-testid="create-interface" data-node={node ?? ''} />,
}));

vi.mock('@app/features/storagePool/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/storagePool/api')>()),
  getStoragePool: vi.fn(),
}));

vi.mock('@app/features/snapshot/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/snapshot/api')>()),
  getAllResources: vi.fn(),
}));

// The dialog pulls in queries of its own and has its own suite.
vi.mock('../components/NetInterfaceDetail', () => ({
  NetInterfaceDetail: () => null,
}));

vi.mock('@app/components/GrafanaCharts', () => ({
  default: ({ hostname }: { hostname: string }) => <div data-testid="grafana" data-hostname={hostname} />,
}));

let grafanaOn = true;
vi.mock('@app/features/settings/grafana', () => ({
  grafanaEnabled: () => grafanaOn,
}));

let activeController: string | undefined;
vi.mock('@app/features/node/hooks/useActiveController', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node/hooks/useActiveController')>()),
  useActiveController: () => activeController,
}));

let uiMode = 'NORMAL';
vi.mock('@app/features/settings/useSettings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/settings/useSettings')>()),
  useUIMode: () => uiMode,
  // Whether Grafana is on is up to the grafanaEnabled mock above.
  useSettings: () => ({ grafanaConfig: null }),
}));

const GIB = 1024 * 1024;

const node = {
  name: 'gui01',
  platform: 'LINUX',
  os_variant: 'Ubuntu 24.04.4 LTS',
  type: 'SATELLITE',
  connection_status: 'ONLINE',
  flags: ['EVACUATE'],
  net_interfaces: [
    { name: 'backup', address: '10.0.1.1', satellite_port: 3367, is_active: false },
    { name: 'default', address: '10.0.0.1', satellite_port: 3366, satellite_encryption_type: 'PLAIN', is_active: true },
  ],
  resource_layers: ['DRBD', 'STORAGE'],
  unsupported_layers: { NVME: ['nvme kernel module not loaded'] },
  storage_providers: ['LVM', 'ZFS'],
  unsupported_providers: { SPDK: ['no spdk'], EBS_INIT: [] },
};

const interfaces = [
  { name: 'default', address: '10.0.0.1', satellite_port: 3366, is_active: true, uuid: 'u1' },
  { name: 'backup', address: '10.0.1.1', satellite_port: 3367, is_active: false, uuid: 'u2' },
];

const storagePools = [
  // Holds no data, so it is not drawn.
  { storage_pool_name: 'DfltDisklessStorPool', provider_kind: 'DISKLESS', total_capacity: 0, free_capacity: 0 },
  { storage_pool_name: 'pool-a', provider_kind: 'LVM_THIN', total_capacity: 100 * GIB, free_capacity: 40 * GIB },
  { storage_pool_name: 'pool-b', provider_kind: 'ZFS', total_capacity: 200 * GIB, free_capacity: 200 * GIB },
  { storage_pool_name: 'pool-c', provider_kind: 'LVM', total_capacity: 10 * GIB, free_capacity: GIB / 2 },
];

const drbdVolume = (diskState: string, pool = 'pool-a', device = '/dev/drbd1000') => ({
  layer_data_list: [{ type: 'DRBD' }],
  state: { disk_state: diskState },
  storage_pool_name: pool,
  device_path: device,
});

const resources = [
  { name: 'res1', flags: [], state: { in_use: true, open: true }, volumes: [drbdVolume('UpToDate')] },
  { name: 'res2', flags: [], state: { in_use: false, open: true }, volumes: [drbdVolume('UpToDate')] },
  {
    name: 'res3',
    flags: ['DISKLESS', 'DRBD_DISKLESS', 'TIE_BREAKER'],
    state: { in_use: false },
    volumes: [drbdVolume('Diskless', 'DfltDisklessStorPool', '/dev/drbd1002')],
  },
];

/** Opens a tab and hands back its panel. */
const openTab = (name: string) => {
  fireEvent.click(screen.getByRole('tab', { name }));
  return screen.getByRole('tabpanel', { name }) as HTMLElement;
};

let location = '';
let navigate: NavigateFunction;
const Location = () => {
  const { pathname, search } = useLocation();
  location = pathname + search;
  navigate = useNavigate();
  return null;
};

const meter = (name: string) => screen.getByRole('meter', { name: `Used capacity of ${name}` });

// PageBasic measures its content against the nav, so the page needs a nav context.
const nav = { isNavOpen: true, toggleNav: () => undefined, setNavOpen: () => undefined };

const renderDetailPage = (path = '/') =>
  renderPage(
    <NavContext.Provider value={nav}>
      <NodeDetail />
      <Location />
    </NavContext.Provider>,
    path,
  );

const renderDetail = async (path?: string) => {
  const utils = renderDetailPage(path);
  await screen.findByRole('heading', { name: 'gui01' });
  return utils;
};

describe('NodeDetail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    uiMode = 'NORMAL';
    activeController = undefined;
    grafanaOn = true;
    vi.mocked(getNodes).mockResolvedValue({ data: [node] } as never);
    vi.mocked(getControllerVersion).mockResolvedValue({ data: { rest_api_version: '1.28.0' } } as never);
    vi.mocked(getNetWorkInterfaceByNode).mockResolvedValue({ data: interfaces } as never);
    vi.mocked(getStoragePool).mockResolvedValue({ data: storagePools } as never);
    vi.mocked(getAllResources).mockResolvedValue({ data: resources } as never);
    vi.mocked(deleteNetWorkInterface).mockResolvedValue(ok as never);
    vi.mocked(updateNetWorkInterface).mockResolvedValue(ok as never);
  });

  it('leads with the node name, its state, flags, type, OS and the active address', async () => {
    const { container } = await renderDetail();

    expect(screen.getByRole('heading', { name: 'Node Detail' })).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(container.querySelector('.anticon-check-circle')).not.toBeNull();
    expect(screen.getByText('EVACUATE')).toBeInTheDocument();
    expect(screen.getByText('Satellite')).toBeInTheDocument();
    expect(screen.getByText('Ubuntu 24.04.4 LTS')).toBeInTheDocument();
    // The active interface, not the first one listed.
    expect(container).toHaveTextContent('10.0.0.1:3366PLAIN');
  });

  it('tags the node that runs the active controller, and only that one', async () => {
    activeController = 'gui02';
    const { unmount } = await renderDetail();
    expect(screen.queryByText('Controller')).toBeNull();
    unmount();

    activeController = 'gui01';
    await renderDetail();
    const tag = screen.getByText('Controller');
    expect(tag.closest('.ant-tag')).toHaveAttribute('style', expect.stringContaining('var(--bg-chip-brand)'));
  });

  it('marks a node that is not online', async () => {
    vi.mocked(getNodes).mockResolvedValue({ data: [{ ...node, connection_status: 'OFFLINE' }] } as never);
    const { container } = await renderDetail();

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(container.querySelector('.anticon-close-circle')).not.toBeNull();
  });

  it('lists what the satellite supports and puts the rest, with its reasons, behind a count', async () => {
    const { container } = await renderDetail();
    const summary = container.querySelector('.ant-card') as HTMLElement;

    for (const name of ['DRBD', 'STORAGE', 'LVM', 'ZFS']) expect(within(summary).getByText(name)).toBeInTheDocument();
    expect(screen.queryByText('NVME')).toBeNull();
    expect(screen.getByRole('button', { name: '1 not available' })).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('button', { name: '2 not available' }));
    expect(await screen.findByText('SPDK')).toBeInTheDocument();
    expect(screen.getByText(/no spdk/)).toBeInTheDocument();
    expect(screen.getByText('EBS_INIT')).toBeInTheDocument();
  });

  it('shows the platform only once the controller is new enough', async () => {
    await renderDetail();
    expect(await screen.findByText('Linux')).toBeInTheDocument();
  });

  it('hides the platform on a controller older than 1.28.0', async () => {
    vi.mocked(getControllerVersion).mockResolvedValue({ data: { rest_api_version: '1.27.9' } } as never);
    await renderDetail();
    await waitFor(() => expect(getControllerVersion).toHaveBeenCalled());
    expect(screen.queryByText('Linux')).toBeNull();
  });

  it('meters every pool with storage, then all of them together, and flags a nearly full one', async () => {
    await renderDetail();
    await screen.findByRole('meter', { name: 'Used capacity of pool-a' });

    expect(meter('pool-a')).toHaveAttribute('aria-valuenow', '60');
    expect(meter('pool-b')).toHaveAttribute('aria-valuenow', '0');
    expect(meter('pool-c')).toHaveAttribute('aria-valuenow', '95');
    // 69.5 of 310 GiB
    expect(meter('All pools on gui01')).toHaveAttribute('aria-valuenow', '22');
    expect(screen.queryByRole('meter', { name: /DfltDisklessStorPool/ })).toBeNull();

    const card = screen.getByRole('tabpanel', { name: 'Storage pools' });
    expect(card).toHaveTextContent('60.00 GiB / 100.00 GiB');
    expect(card).toHaveTextContent('LVM_THIN');
    expect(screen.getAllByText('Nearly full')).toHaveLength(1);
    expect(within(card).getByRole('link', { name: 'pool-a' })).toHaveAttribute(
      'href',
      '/inventory/storage-pools?nodes=gui01&storage_pools=pool-a',
    );
  });

  it('counts the resources by role and lists each with its state', async () => {
    await renderDetail();
    const card = openTab('Resources');
    await within(card).findByRole('link', { name: 'res1' });

    expect(card).toHaveTextContent('3Resources1Primary2Diskful1Diskless');
    const row = (name: string) => within(card).getByRole('link', { name }).closest('tr') as HTMLElement;
    expect(within(row('res1')).getByText('Primary')).toBeInTheDocument();
    // A Primary holds its device open anyway; only a Secondary gets the tag.
    expect(within(row('res1')).queryByText('Open')).toBeNull();
    expect(within(row('res2')).getByText('Open')).toBeInTheDocument();
    expect(within(row('res3')).getByText('TieBreaker')).toBeInTheDocument();
    expect(row('res1')).toHaveTextContent('pool-a');
    expect(row('res3')).toHaveTextContent('DfltDisklessStorPool');
    expect(row('res3')).toHaveTextContent('/dev/drbd1002');
    expect(within(card).getByRole('link', { name: 'res2' })).toHaveAttribute(
      'href',
      '/storage-configuration/resource-overview?resource=res2',
    );
  });

  it('links into the HCI pages in HCI mode', async () => {
    uiMode = 'HCI';
    await renderDetail();

    expect(await screen.findByRole('link', { name: 'pool-a' })).toHaveAttribute(
      'href',
      '/hci/inventory/storage-pools?nodes=gui01&storage_pools=pool-a',
    );
    openTab('Resources');
    expect(await screen.findByRole('link', { name: 'res1' })).toHaveAttribute(
      'href',
      '/hci/storage-configuration/resource-overview?resource=res1',
    );
  });

  it('says so when the node has neither pools with storage nor resources', async () => {
    vi.mocked(getStoragePool).mockResolvedValue({ data: [storagePools[0]] } as never);
    vi.mocked(getAllResources).mockResolvedValue({ data: [] } as never);
    await renderDetail();

    expect(await screen.findByText('No storage pools with storage on this node')).toBeInTheDocument();
    openTab('Resources');
    expect(await screen.findByText('No resources on this node')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).toBeNull();
  });

  it('labels the satellite port of each interface', async () => {
    const { container } = await renderDetail();
    openTab('Network interfaces');
    const item = Array.from(container.querySelectorAll('li')).find((el) =>
      el.textContent?.includes('backup'),
    ) as HTMLElement;
    expect(item).toHaveTextContent('TCP Port 3367');
  });

  it('deletes an interface on this node and reloads the list', async () => {
    const { container } = await renderDetail();
    openTab('Network interfaces');

    const item = Array.from(container.querySelectorAll('li')).find((el) =>
      el.textContent?.includes('backup'),
    ) as HTMLElement;
    fireEvent.click(within(item).getByRole('button', { name: 'Delete' }));
    await confirmPopover();

    await waitFor(() => expect(deleteNetWorkInterface).toHaveBeenCalledWith('gui01', 'backup'));
    await waitFor(() => expect(getNetWorkInterfaceByNode).toHaveBeenCalledTimes(2));
  });

  it('activates an interface by re-sending it with is_active', async () => {
    const { container } = await renderDetail();
    openTab('Network interfaces');

    const item = Array.from(container.querySelectorAll('li')).find((el) =>
      el.textContent?.includes('backup'),
    ) as HTMLElement;
    fireEvent.click(within(item).getByRole('button', { name: 'Set as active' }));
    await confirmPopover();

    await waitFor(() =>
      expect(updateNetWorkInterface).toHaveBeenCalledWith('gui01', {
        ...interfaces[1],
        is_active: true,
      }),
    );
  });

  it('hands the node name to the create form and the Grafana charts', async () => {
    await renderDetail();

    openTab('Network interfaces');
    expect(screen.getByTestId('create-interface')).toHaveAttribute('data-node', 'gui01');
    openTab('Performance Metrics');
    expect(screen.getByTestId('grafana')).toHaveAttribute('data-hostname', 'gui01');
  });

  it('puts the sections under tabs below the summary, opening on the storage pools', async () => {
    await renderDetail();

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Storage pools',
      'Resources',
      'Network interfaces',
      'Performance Metrics',
    ]);
    expect(screen.getByRole('tab', { name: 'Storage pools' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByTestId('grafana')).toBeNull();
  });

  it('leaves out the performance tab while Grafana is off', async () => {
    grafanaOn = false;
    await renderDetail();

    expect(screen.queryByRole('tab', { name: 'Performance Metrics' })).toBeNull();
  });

  it('keeps the open tab in the URL and opens the one the URL names', async () => {
    const { unmount } = await renderDetail();
    openTab('Network interfaces');
    expect(location).toBe('/?tab=network-interfaces');
    unmount();

    await renderDetail('/?tab=resources');
    expect(screen.getByRole('tab', { name: 'Resources' })).toHaveAttribute('aria-selected', 'true');
    // AppLayout strips the query string on every page change; the tab stays.
    act(() => navigate('/', { replace: true }));
    expect(location).toBe('/');
    expect(screen.getByRole('tab', { name: 'Resources' })).toHaveAttribute('aria-selected', 'true');
  });

  it('opens the first tab when the URL names one that is not there', async () => {
    grafanaOn = false;
    await renderDetail('/?tab=performance');

    expect(screen.getByRole('tab', { name: 'Storage pools' })).toHaveAttribute('aria-selected', 'true');
  });

  it('pages the resources ten at a time', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      name: `res${String(i + 1).padStart(2, '0')}`,
      flags: [],
      state: { in_use: false },
      volumes: [drbdVolume('UpToDate')],
    }));
    vi.mocked(getAllResources).mockResolvedValue({ data: many } as never);
    await renderDetail();
    const panel = openTab('Resources');
    await within(panel).findByRole('link', { name: 'res01' });

    expect(tableRows(panel)).toHaveLength(10);
    expect(panel).toHaveTextContent('Total 12 items');
    fireEvent.click(within(panel).getByTitle('2'));
    expect(await within(panel).findByRole('link', { name: 'res12' })).toBeInTheDocument();
    expect(tableRows(panel)).toHaveLength(2);
  });

  it('renders without a node instead of throwing on an empty node list', async () => {
    vi.mocked(getNodes).mockResolvedValue({ data: [] } as never);
    renderDetailPage();

    await waitFor(() => expect(getNodes).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'Node Detail' })).toBeInTheDocument();
    openTab('Network interfaces');
    expect(screen.getByTestId('create-interface')).toHaveAttribute('data-node', '');
  });
});
