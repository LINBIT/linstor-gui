// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import NodeDetail from '../detail';
import { getNodes, getControllerVersion } from '@app/features/node/api';
import { getNetWorkInterfaceByNode, deleteNetWorkInterface, updateNetWorkInterface } from '@app/features/ip';
import { getStoragePool } from '@app/features/storagePool/api';
import { getAllResources } from '@app/features/snapshot/api';
import { NavContext } from '@app/hooks/useNav';
import { renderPage, confirmPopover, ok } from '../../__test__/helpers';

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

// apexcharts needs a real layout engine; the series is what the page computes.
vi.mock('react-apexcharts', () => ({
  default: ({ series, options }: { series: unknown; options: unknown }) => (
    <div data-testid="chart">{JSON.stringify({ series, options })}</div>
  ),
}));

const node = {
  name: 'gui01',
  platform: 'LINUX',
  os_variant: 'Ubuntu',
  type: 'SATELLITE',
  connection_status: 'ONLINE',
  resource_layers: ['drbd', 'storage'],
  unsupported_layers: { nvme: ['no nvme kernel module'] },
  storage_providers: ['LVM', 'ZFS'],
  unsupported_providers: { openflex: ['no openflex'] },
};

const interfaces = [
  { name: 'default', address: '10.0.0.1', satellite_port: 3366, is_active: true, uuid: 'u1' },
  { name: 'backup', address: '10.0.1.1', satellite_port: 3367, is_active: false, uuid: 'u2' },
];

const storagePools = [
  // The diskless pool is dropped before plotting.
  { storage_pool_name: 'DfltDisklessStorPool', total_capacity: 0, free_capacity: 0 },
  { storage_pool_name: 'pool-a', total_capacity: 100, free_capacity: 40 },
  { storage_pool_name: 'pool-b', total_capacity: 200, free_capacity: 200 },
];

const resources = [
  { name: 'res1', state: { in_use: true } },
  { name: 'res2', state: { in_use: false } },
  { name: 'res3', state: { in_use: false } },
];

const cardByTitle = (container: HTMLElement, title: string) => {
  const card = Array.from(container.querySelectorAll('.ant-card')).find(
    (el) => el.querySelector('.ant-card-head-title')?.textContent === title,
  ) as HTMLElement | undefined;
  expect(card).toBeDefined();
  return card as HTMLElement;
};

// PageBasic measures its content against the nav, so the page needs a nav context.
const nav = { isNavOpen: true, toggleNav: () => undefined, setNavOpen: () => undefined };

const renderDetailPage = () =>
  renderPage(
    <NavContext.Provider value={nav}>
      <NodeDetail />
    </NavContext.Provider>,
  );

const renderDetail = async () => {
  const utils = renderDetailPage();
  await screen.findByText('gui01');
  return utils;
};

describe('NodeDetail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getNodes).mockResolvedValue({ data: [node] } as never);
    vi.mocked(getControllerVersion).mockResolvedValue({ data: { rest_api_version: '1.28.0' } } as never);
    vi.mocked(getNetWorkInterfaceByNode).mockResolvedValue({ data: interfaces } as never);
    vi.mocked(getStoragePool).mockResolvedValue({ data: storagePools } as never);
    vi.mocked(getAllResources).mockResolvedValue({ data: resources } as never);
    vi.mocked(deleteNetWorkInterface).mockResolvedValue(ok as never);
    vi.mocked(updateNetWorkInterface).mockResolvedValue(ok as never);
  });

  it('shows the node identity, lowercased, with a tick for an online node', async () => {
    const { container } = await renderDetail();

    expect(screen.getByRole('heading', { name: 'Node Detail' })).toBeInTheDocument();
    expect(container).toHaveTextContent('Ubuntu');
    expect(container).toHaveTextContent('satellite');
    expect(container).toHaveTextContent('online');
    expect(container.querySelector('.anticon-check-circle')).not.toBeNull();
  });

  it('tags supported layers and providers green and unsupported ones red', async () => {
    const { container } = await renderDetail();

    // Scoped to the info card: the interface list has an "Active" tag of its own.
    const infoCard = container.querySelector('.ant-card') as HTMLElement;
    const green = Array.from(infoCard.querySelectorAll('.ant-tag-success')).map((el) => el.textContent);
    const red = Array.from(infoCard.querySelectorAll('.ant-tag-error')).map((el) => el.textContent);

    expect(green).toEqual(['drbd', 'storage', 'LVM', 'ZFS']);
    expect(red).toEqual(['nvme', 'openflex']);
  });

  it('shows the platform only once the controller is new enough', async () => {
    const { container } = await renderDetail();

    expect(container).toHaveTextContent('Platform');
    expect(container).toHaveTextContent('linux');
  });

  it('hides the platform on a controller older than 1.28.0', async () => {
    vi.mocked(getControllerVersion).mockResolvedValue({ data: { rest_api_version: '1.27.9' } } as never);
    const { container } = await renderDetail();

    await waitFor(() => expect(getControllerVersion).toHaveBeenCalled());
    expect(container).not.toHaveTextContent('Platform');
  });

  it('plots every storage pool but the diskless one, plus the node total', async () => {
    const { container } = await renderDetail();

    const chart = await within(cardByTitle(container, 'Storage pool info')).findByTestId('chart');
    const { series, options } = JSON.parse(chart.textContent as string);

    expect(options.xaxis.categories).toEqual(['pool-a', 'pool-b', 'Total on gui01']);
    expect(series.map((s: { name: string }) => s.name)).toEqual([
      'pool-a - Used',
      'pool-a - Free',
      'pool-b - Used',
      'pool-b - Free',
      'Total Used on gui01',
      'Total Free on gui01',
    ]);
    // pool-a: 100 total, 40 free -> 60 used; node total 300, 240 free -> 60 used.
    expect(series[0].data).toEqual([60, 0, 0]);
    expect(series[4].data).toEqual([0, 0, 60]);
  });

  it('counts resources by whether they are in use', async () => {
    const { container } = await renderDetail();

    const chart = await within(cardByTitle(container, 'Resource info')).findByTestId('chart');
    const { series, options } = JSON.parse(chart.textContent as string);

    expect(options.labels).toEqual(['in use', 'not in use']);
    expect(series).toEqual([1, 2]);
  });

  it('leaves both charts out when the node has neither pools nor resources', async () => {
    vi.mocked(getStoragePool).mockResolvedValue({ data: [storagePools[0]] } as never);
    vi.mocked(getAllResources).mockResolvedValue({ data: [] } as never);
    const { container } = await renderDetail();

    await waitFor(() => expect(getAllResources).toHaveBeenCalled());
    expect(screen.queryByTestId('chart')).toBeNull();
    expect(cardByTitle(container, 'Storage pool info')).toBeInTheDocument();
  });

  it('deletes an interface on this node and reloads the list', async () => {
    const { container } = await renderDetail();

    const item = Array.from(container.querySelectorAll('.ant-list-item')).find((el) =>
      el.textContent?.includes('backup'),
    ) as HTMLElement;
    fireEvent.click(within(item).getByRole('button', { name: 'Delete' }));
    await confirmPopover();

    await waitFor(() => expect(deleteNetWorkInterface).toHaveBeenCalledWith('gui01', 'backup'));
    await waitFor(() => expect(getNetWorkInterfaceByNode).toHaveBeenCalledTimes(2));
  });

  it('activates an interface by re-sending it with is_active', async () => {
    const { container } = await renderDetail();

    const item = Array.from(container.querySelectorAll('.ant-list-item')).find((el) =>
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

    expect(screen.getByTestId('create-interface')).toHaveAttribute('data-node', 'gui01');
    expect(screen.getByTestId('grafana')).toHaveAttribute('data-hostname', 'gui01');
  });

  it('renders without a node instead of throwing on an empty node list', async () => {
    vi.mocked(getNodes).mockResolvedValue({ data: [] } as never);
    renderDetailPage();

    await waitFor(() => expect(getNodes).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'Node Detail' })).toBeInTheDocument();
    expect(screen.getByTestId('create-interface')).toHaveAttribute('data-node', '');
  });
});
