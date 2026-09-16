// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The DRBD Reactor page on real antd and a real query client; the LINSTOR
// transport and the drbd-reactorctl exec calls are mocked at the api module.

vi.mock('../api', () => ({
  getHAResourceDefinitions: vi.fn(),
  listFiles: vi.fn(),
  getFileContent: vi.fn(),
  createFile: vi.fn(),
  deployFile: vi.fn(),
  getResources: vi.fn(),
  getDrbdReactorStatus: vi.fn(),
  evictDrbdReactor: vi.fn(),
  disableDrbdReactor: vi.fn(),
  enableDrbdReactor: vi.fn(),
  restartDrbdReactor: vi.fn(),
  deleteFile: vi.fn(),
  undeployFile: vi.fn(),
}));

vi.mock('@app/features/node/hooks/useNode', () => ({
  useNodes: () => ({ data: [{ name: 'node-a' }, { name: 'node-b' }], isLoading: false }),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

import {
  getHAResourceDefinitions,
  listFiles,
  getFileContent,
  deployFile,
  getResources,
  getDrbdReactorStatus,
  evictDrbdReactor,
  disableDrbdReactor,
  enableDrbdReactor,
  deleteFile,
  undeployFile,
} from '../api';
import type { DrbdReactorStatus } from '../api';
import { List } from '../List';

const MYSQL_KEY = 'files/etc/drbd-reactor.d/mysql.toml';
const MYSQL_PATH = '/etc/drbd-reactor.d/mysql.toml';
const STOPPED_KEY = 'files/etc/drbd-reactor.d/stopped.toml';

const resourceDefinitions = [
  { name: 'ha-mysql', uuid: 'u-mysql', props: { [MYSQL_KEY]: '' } },
  { name: 'ha-stopped', uuid: 'u-stopped', props: { [STOPPED_KEY]: '' } },
  { name: 'plain-rd', uuid: 'u-plain', props: { 'Aux/x': '1' } },
];

const mysqlPromoter = (status: 'active' | 'inactive') => ({
  drbd_resource: 'ha-mysql',
  path: MYSQL_PATH,
  primary_on: 'node-a',
  status,
  target: { name: 'drbd-services@ha-mysql.target', status, freezer: 'running' },
  dependencies: [
    { name: 'var-lib-mysql.mount', status, freezer: 'running' },
    { name: 'mysql.service', status, freezer: 'running' },
  ],
});

const runningStatus: Record<string, DrbdReactorStatus> = {
  'node-a': { promoter: [mysqlPromoter('active')] },
  'node-b': { promoter: [mysqlPromoter('inactive')] },
};

const stoppedStatus: Record<string, DrbdReactorStatus> = {
  'node-a': { promoter: [] },
  'node-b': { promoter: [] },
};

const resourcesView: Record<string, unknown[]> = {
  'ha-mysql': [
    { name: 'ha-mysql', node_name: 'node-a', state: { in_use: true } },
    { name: 'ha-mysql', node_name: 'node-b', state: { in_use: false } },
  ],
  'ha-stopped': [{ name: 'ha-stopped', node_name: 'node-a', state: { in_use: false } }],
};

const renderList = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
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

// Modal.confirm renders into its own container; its custom footer buttons are
// plain project Buttons.
const confirmDialogButton = async (name: string) => {
  const dialog = await screen.findByRole('dialog');
  return within(dialog).getByRole('button', { name });
};

// Resolve on the next tick so react-query's dataUpdatedAt lands after the
// timestamp the page records when it starts waiting for a status change.
const later =
  <T,>(value: T) =>
  () =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value), 15));

describe('DRBD Reactor List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getHAResourceDefinitions).mockResolvedValue({ data: resourceDefinitions } as never);
    vi.mocked(listFiles).mockResolvedValue({
      data: [{ path: MYSQL_PATH }, { path: '/etc/drbd-reactor.d/orphan.toml' }, { path: '/etc/other.conf' }],
    } as never);
    vi.mocked(getFileContent).mockResolvedValue({ data: { path: MYSQL_PATH, content: btoa('[[promoter]]') } } as never);
    vi.mocked(getResources).mockImplementation(
      async (name?: string) => ({ data: resourcesView[name ?? ''] ?? [] }) as never,
    );
    vi.mocked(getDrbdReactorStatus).mockImplementation(later(runningStatus));
    vi.mocked(evictDrbdReactor).mockResolvedValue([{ node: 'node-a', exit_code: 0, active_node: 'node-b' }] as never);
    vi.mocked(disableDrbdReactor).mockResolvedValue([{ node: 'node-a', exit_code: 0 }] as never);
    vi.mocked(enableDrbdReactor).mockResolvedValue([{ node: 'node-a', exit_code: 0 }] as never);
    for (const fn of [deployFile, deleteFile, undeployFile]) {
      vi.mocked(fn).mockResolvedValue({ data: [] } as never);
    }
  });

  it('lists only resources with a reactor config, with status, nodes and config file', async () => {
    renderList();
    const mysql = (await screen.findByText('ha-mysql')).closest('tr') as HTMLElement;
    expect(screen.queryByText('plain-rd')).not.toBeInTheDocument();

    expect(await within(mysql).findByText('Running')).toBeInTheDocument();
    expect(within(rowOf('ha-stopped')).getByText('Stopped')).toBeInTheDocument();

    // Both nodes carry the resource; the active one is the highlighted link.
    expect(await within(mysql).findByText('node-a')).toHaveAttribute('href', '/inventory/nodes/node-a');
    expect(within(mysql).getByText('node-b')).toHaveAttribute('href', '/inventory/nodes/node-b');
    // setupTests stubs getComputedStyle, so read the inline style directly.
    const tagStyle = (node: string) => (within(mysql).getByText(node).closest('.ant-tag') as HTMLElement).style;
    expect(tagStyle('node-a').backgroundColor).toBe('rgb(255, 204, 156)');
    expect(tagStyle('node-b').backgroundColor).toBe('');

    expect(within(mysql).getByText(MYSQL_PATH)).toBeInTheDocument();
    expect(getDrbdReactorStatus).toHaveBeenCalledWith(['node-a', 'node-b']);
  });

  it('shows the promoter tree on the status tag', async () => {
    renderList();
    const mysql = (await screen.findByText('ha-mysql')).closest('tr') as HTMLElement;
    fireEvent.mouseEnter(await within(mysql).findByText('Running'));
    expect(
      await screen.findByText("Promoter: Resource ha-mysql currently active on node 'node-a'"),
    ).toBeInTheDocument();
    expect(screen.getByText('drbd-services@ha-mysql.target')).toBeInTheDocument();
    expect(screen.getByText(/└─ mysql\.service/)).toBeInTheDocument();
  });

  it('offers to manage reactor files LINSTOR knows but no resource uses', async () => {
    renderList();
    fireEvent.click(await screen.findByRole('button', { name: 'Manage (1 unmanaged)' }));
    expect(await screen.findByText('Manage HA Configuration')).toBeInTheDocument();

    const [fileSelect, rdSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(fileSelect);
    const files = await screen.findAllByText(/^\/etc\//, { selector: '.ant-select-item-option-content' });
    expect(files.map((f) => f.textContent)).toEqual(['/etc/drbd-reactor.d/orphan.toml']);
    fireEvent.click(files[0]);

    fireEvent.mouseDown(rdSelect);
    fireEvent.click(await screen.findByText('plain-rd', { selector: '.ant-select-item-option-content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));

    await waitFor(() => expect(deployFile).toHaveBeenCalledWith('plain-rd', '/etc/drbd-reactor.d/orphan.toml'));
    expect(
      await screen.findByText('"/etc/drbd-reactor.d/orphan.toml" is now managed under resource "plain-rd"'),
    ).toBeInTheDocument();
  });

  it('the eye icon shows the decoded config', async () => {
    renderList();
    const mysql = (await screen.findByText('ha-mysql')).closest('tr') as HTMLElement;
    fireEvent.click(within(mysql).getByRole('img', { name: 'eye' }));
    expect(await screen.findByText('[[promoter]]')).toBeInTheDocument();
    expect(getFileContent).toHaveBeenCalledWith(MYSQL_PATH);
    // The modal's X button is also named Close; the footer one is last.
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' }).at(-1) as HTMLElement);
  });

  it('edit navigates to the editor with the config file', async () => {
    renderList();
    await screen.findByText('ha-mysql');
    const menu = await openRowMenu('ha-mysql');
    fireEvent.click(within(menu).getByText('Edit'));
    expect(navigate).toHaveBeenCalledWith(`/reactor/edit/ha-mysql?filePath=${encodeURIComponent(MYSQL_KEY)}`);
  });

  it('evicts from the active node after confirm and reports the new node', async () => {
    renderList();
    const mysql = (await screen.findByText('ha-mysql')).closest('tr') as HTMLElement;
    await within(mysql).findByText('Running');
    const menu = await openRowMenu('ha-mysql');
    fireEvent.click(within(menu).getByText('Evict'));

    expect(
      await screen.findByText('Evict configuration "mysql" from active node "node-a"? This will trigger failover.'),
    ).toBeInTheDocument();
    expect(evictDrbdReactor).not.toHaveBeenCalled();
    fireEvent.click(await confirmDialogButton('Evict'));

    await waitFor(() => expect(evictDrbdReactor).toHaveBeenCalledWith(['node-a'], 'mysql', true));
    expect(await screen.findByText('"ha-mysql" migrated to node-b')).toBeInTheDocument();
  });

  it('reports an evict the node refused', async () => {
    vi.mocked(evictDrbdReactor).mockResolvedValue([
      { node: 'node-a', exit_code: 1, stderr_utf8: 'resource is not active' },
    ] as never);
    renderList();
    const mysql = (await screen.findByText('ha-mysql')).closest('tr') as HTMLElement;
    await within(mysql).findByText('Running');
    const menu = await openRowMenu('ha-mysql');
    fireEvent.click(within(menu).getByText('Evict'));
    fireEvent.click(await confirmDialogButton('Evict'));
    expect(await screen.findByText('Evict failed: resource is not active')).toBeInTheDocument();
  });

  it('evict is not offered for a resource that runs nowhere', async () => {
    renderList();
    await screen.findByText('ha-stopped');
    await within(rowOf('ha-stopped')).findByText('Stopped');
    const menu = await openRowMenu('ha-stopped');
    expect(within(menu).getByText('Evict').closest('li')).toHaveClass('ant-dropdown-menu-item-disabled');
  });

  it('stop disables the standby nodes first, then the active one with --now', async () => {
    vi.mocked(getDrbdReactorStatus)
      .mockImplementationOnce(later(runningStatus))
      .mockImplementation(later(stoppedStatus));
    renderList();
    const mysql = (await screen.findByText('ha-mysql')).closest('tr') as HTMLElement;
    await within(mysql).findByText('Running');
    const menu = await openRowMenu('ha-mysql');
    fireEvent.click(within(menu).getByText('Stop'));
    expect(
      await screen.findByText('Stop configuration "mysql"? This will disable the HA service on all nodes.'),
    ).toBeInTheDocument();
    fireEvent.click(await confirmDialogButton('Stop'));

    await waitFor(() => expect(disableDrbdReactor).toHaveBeenCalledTimes(2));
    expect(vi.mocked(disableDrbdReactor).mock.calls).toEqual([
      [['node-b'], 'mysql', false],
      [['node-a'], 'mysql', true],
    ]);
    expect(await screen.findByText('"ha-mysql" stopped successfully')).toBeInTheDocument();
    expect(await within(rowOf('ha-mysql')).findByText('Stopped')).toBeInTheDocument();
  });

  it('start enables the config on every cluster node when the reactor does not list it', async () => {
    const startedStatus: Record<string, DrbdReactorStatus> = {
      'node-a': {
        promoter: [
          mysqlPromoter('active'),
          { drbd_resource: 'ha-stopped', path: '', primary_on: 'node-a', status: 'active' },
        ],
      },
      'node-b': { promoter: [mysqlPromoter('inactive')] },
    };
    vi.mocked(getDrbdReactorStatus)
      .mockImplementationOnce(later(runningStatus))
      .mockImplementation(later(startedStatus));
    renderList();
    await screen.findByText('ha-stopped');
    await within(rowOf('ha-stopped')).findByText('Stopped');
    const menu = await openRowMenu('ha-stopped');
    fireEvent.click(within(menu).getByText('Start'));
    fireEvent.click(await confirmDialogButton('Start'));

    await waitFor(() => expect(enableDrbdReactor).toHaveBeenCalledWith(['node-a', 'node-b'], 'stopped'));
    expect(await screen.findByText('"ha-stopped" started successfully')).toBeInTheDocument();
    expect(await within(rowOf('ha-stopped')).findByText('Running')).toBeInTheDocument();
  });

  it('unmanage undeploys the file but keeps it', async () => {
    renderList();
    await screen.findByText('ha-mysql');
    const menu = await openRowMenu('ha-mysql');
    fireEvent.click(within(menu).getByText('Unmanage'));
    fireEvent.click(await confirmDialogButton('Unmanage'));
    await waitFor(() => expect(undeployFile).toHaveBeenCalledWith('ha-mysql', MYSQL_PATH));
    expect(deleteFile).not.toHaveBeenCalled();
    expect(await screen.findByText('"ha-mysql" is no longer managed by LINSTOR')).toBeInTheDocument();
  });

  it('delete undeploys and then removes the file', async () => {
    renderList();
    await screen.findByText('ha-mysql');
    const menu = await openRowMenu('ha-mysql');
    fireEvent.click(within(menu).getByText('Delete'));
    expect(
      await screen.findByText(
        'Are you sure you want to delete "ha-mysql"? This will remove the HA configuration file from all nodes.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(await confirmDialogButton('Delete'));
    await waitFor(() => expect(deleteFile).toHaveBeenCalledWith(MYSQL_PATH));
    expect(undeployFile).toHaveBeenCalledWith('ha-mysql', MYSQL_PATH);
    expect(await screen.findByText('HA configuration for "ha-mysql" deleted successfully')).toBeInTheDocument();
  });

  it('shows an empty table when nothing is HA-managed', async () => {
    vi.mocked(getHAResourceDefinitions).mockResolvedValue({ data: [resourceDefinitions[2]] } as never);
    vi.mocked(listFiles).mockResolvedValue({ data: [] } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /unmanaged/ })).not.toBeInTheDocument();
  });
});
