// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Real antd and a real query client; only the transports and the router's
// navigate are replaced.

vi.mock('../../api', () => ({
  getSnapshots: vi.fn(),
  deleteSnapshot: vi.fn(),
  rollbackSnapshot: vi.fn(),
  restoreSnapshot: vi.fn(),
  restoreVolumeDefinition: vi.fn(),
}));

vi.mock('@app/features/node', () => ({
  useNodes: () => ({ data: [{ name: 'node-1' }, { name: 'node-2' }], isLoading: false }),
}));

vi.mock('@app/features/resource', () => ({
  getResources: vi.fn(),
}));
vi.mock('@app/features/resource/api', () => ({
  getResources: vi.fn(),
}));
vi.mock('@app/features/resourceDefinition/api', () => ({
  createResourceDefinition: vi.fn(),
}));

// CreateForm has its own suite; here it only needs to mount.
vi.mock('@app/features/snapshot/hooks', () => ({
  useResources: () => ({ data: [], isLoading: false }),
}));
vi.mock('../../hooks', () => ({
  useResources: () => ({ data: [], isLoading: false }),
}));
vi.mock('@app/features/storagePool', () => ({
  getStoragePool: vi.fn(),
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

import { getSnapshots, deleteSnapshot, rollbackSnapshot } from '../../api';
import { getResources } from '@app/features/resource';
import { List } from '../List';

const GIB = 1024 * 1024;

const snapshots = [
  {
    uuid: 'u-old',
    name: 'snap-old',
    resource_name: 'res-a',
    nodes: ['node-1', 'node-2'],
    volume_definitions: [{ volume_number: 0, size_kib: 1 * GIB }],
    snapshots: [{ create_timestamp: 1700000000000 }],
    flags: ['SUCCESSFUL'],
  },
  {
    uuid: 'u-new',
    name: 'snap-new',
    resource_name: 'res-a',
    nodes: ['node-1'],
    volume_definitions: [
      { volume_number: 0, size_kib: 1 * GIB },
      { volume_number: 1, size_kib: 2 * GIB },
    ],
    snapshots: [{ create_timestamp: 1700000060000 }],
    flags: ['SUCCESSFUL'],
  },
  {
    uuid: 'u-b',
    name: 'snap-b',
    resource_name: 'res-b',
    nodes: ['node-2'],
    volume_definitions: [{ volume_number: 0, size_kib: 512 * 1024 }],
    snapshots: [{ create_timestamp: 1700000120000 }],
    flags: [],
  },
];

const renderList = (initialEntry = '/snapshot') => {
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

const rowOf = (snapshotName: string) => screen.getByText(snapshotName).closest('tr') as HTMLElement;

// antd keeps a closed dropdown in the DOM (hidden), so after a second row's
// menu opens there are two; the open one is the one whose popup is not hidden.
const openRowMenu = async (snapshotName: string) => {
  const trigger = within(rowOf(snapshotName)).getByRole('img', { name: 'more' });
  fireEvent.mouseEnter(trigger);
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

describe('snapshot List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    vi.mocked(getSnapshots).mockResolvedValue({ data: snapshots } as never);
    vi.mocked(deleteSnapshot).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(rollbackSnapshot).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(getResources).mockResolvedValue({
      data: [{ name: 'res-a' }, { name: 'res-a' }, { name: 'res-b' }],
    } as never);
  });

  it('renders every snapshot with nodes, volumes, creation time and state', async () => {
    renderList();
    const old = (await screen.findByText('snap-old')).closest('tr') as HTMLElement;
    expect(within(old).getByText('node-1,node-2')).toBeInTheDocument();
    expect(within(old).getByText('0: 1.00 GiB')).toBeInTheDocument();
    // TZ is pinned to UTC in setupTests.
    expect(within(old).getByText('2023-11-14 22:13:20')).toBeInTheDocument();
    expect(old.querySelector('.anticon-check-circle')).not.toBeNull();

    const multi = rowOf('snap-new');
    expect(within(multi).getByText('0: 1.00 GiB, 1: 2.00 GiB')).toBeInTheDocument();

    const failed = rowOf('snap-b');
    expect(failed.querySelector('.anticon-close-circle')).not.toBeNull();
    expect(failed.querySelector('.anticon-check-circle')).toBeNull();

    expect(screen.getByText('Total 3 items')).toBeInTheDocument();
    expect(getSnapshots).toHaveBeenCalledWith({});
  });

  it('seeds the query from ?nodes= and ?resources= in the URL', async () => {
    renderList('/snapshot?nodes=node-1&resources=res-a');
    await screen.findByText('snap-old');
    expect(getSnapshots).toHaveBeenCalledWith({ nodes: ['node-1'], resources: ['res-a'] });
  });

  it('search writes the chosen node and resource to the query and the URL', async () => {
    renderList();
    await screen.findByText('snap-old');

    const [nodeSelect, resourceSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(nodeSelect);
    fireEvent.click(await screen.findByText('node-2', { selector: '.ant-select-item-option-content' }));
    fireEvent.mouseDown(resourceSelect);
    fireEvent.click(await screen.findByText('res-b', { selector: '.ant-select-item-option-content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() =>
      expect(getSnapshots).toHaveBeenLastCalledWith(expect.objectContaining({ nodes: 'node-2', resources: 'res-b' })),
    );
    expect(navigate).toHaveBeenCalledWith('/snapshot?nodes=node-2&resources=res-b');
  });

  it('offers each resource once in the resource filter', async () => {
    renderList();
    await screen.findByText('snap-old');
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    const options = await screen.findAllByText(/^res-/, { selector: '.ant-select-item-option-content' });
    expect(options.map((o) => o.textContent)).toEqual(['res-a', 'res-b']);
  });

  it('reset clears the query and returns to the list route', async () => {
    renderList('/snapshot?nodes=node-1');
    await screen.findByText('snap-old');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(getSnapshots).toHaveBeenLastCalledWith({}));
    expect(navigate).toHaveBeenCalledWith('/snapshot');
  });

  it('reset returns to the HCI list route in HCI mode', async () => {
    uiMode = 'HCI';
    renderList();
    await screen.findByText('snap-old');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(navigate).toHaveBeenLastCalledWith('/hci/snapshot');
  });

  it('deletes from the row menu and refetches', async () => {
    renderList();
    await screen.findByText('snap-old');
    const menu = await openRowMenu('snap-old');
    fireEvent.click(within(menu).getByText('Delete'));
    await waitFor(() => expect(deleteSnapshot).toHaveBeenCalledWith('res-a', 'snap-old'));
    await waitFor(() => expect(getSnapshots).toHaveBeenCalledTimes(2));
  });

  it('bulk delete needs a selection, confirms, then deletes each and clears the selection', async () => {
    renderList();
    await screen.findByText('snap-old');
    const bulkDelete = screen.getByRole('button', { name: 'Delete' });
    expect(bulkDelete).toBeDisabled();

    const [, oldBox, , bBox] = screen.getAllByRole('checkbox');
    fireEvent.click(oldBox);
    fireEvent.click(bBox);
    expect(bulkDelete).toBeEnabled();

    fireEvent.click(bulkDelete);
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteSnapshot).toHaveBeenCalledTimes(2));
    expect(deleteSnapshot).toHaveBeenCalledWith('res-a', 'snap-old');
    expect(deleteSnapshot).toHaveBeenCalledWith('res-b', 'snap-b');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled());
  });

  it('only the newest snapshot of a resource can be rolled back', async () => {
    renderList();
    await screen.findByText('snap-old');

    let menu = await openRowMenu('snap-old');
    fireEvent.click(within(menu).getByText('Rollback'));
    expect(screen.queryByText('Rollback Snapshot')).not.toBeInTheDocument();
    fireEvent.mouseLeave(within(rowOf('snap-old')).getByRole('img', { name: 'more' }));

    menu = await openRowMenu('snap-new');
    fireEvent.click(within(menu).getByText('Rollback'));
    expect(await screen.findByText('Rollback Snapshot')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to rollback resource res-a to snapshot snap-new?'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Rollback' }).at(-1) as HTMLElement);
    await waitFor(() => expect(rollbackSnapshot).toHaveBeenCalledWith('res-a', 'snap-new'));
    await waitFor(() => expect(getSnapshots).toHaveBeenCalledTimes(2));
  });

  it('opens the restore dialog for the chosen snapshot', async () => {
    renderList();
    await screen.findByText('snap-b');
    const menu = await openRowMenu('snap-b');
    fireEvent.click(within(menu).getByText('Restore'));
    expect(await screen.findByText('Restore Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Resource: res-b')).toBeInTheDocument();
    expect(screen.getByText('Snapshot: snap-b')).toBeInTheDocument();
  });

  it('shows an empty table when there are no snapshots', async () => {
    vi.mocked(getSnapshots).mockResolvedValue({ data: [] } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
  });
});
