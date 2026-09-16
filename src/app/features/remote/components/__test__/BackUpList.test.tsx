// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  getBackup: vi.fn(),
  deleteBackup: vi.fn(),
  createBackup: vi.fn(),
}));
vi.mock('@app/features/resource', () => ({
  getResources: vi.fn(),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate, useParams: () => ({ remote_name: 's3-a' }) };
});

import { getBackup, deleteBackup } from '../../api';
import { getResources } from '@app/features/resource';
import { List } from '../BackUpList';

// finished_timestamp is in ms; TZ is pinned to UTC in setupTests.
const backups = {
  'res-a_20231114': {
    origin_rsc: 'res-a',
    origin_snap: 'back_20231114_221320',
    finished_time: '20231114_221320',
    finished_timestamp: Date.UTC(2023, 10, 14, 22, 13, 20),
    success: true,
    shipping: false,
  },
  'res-a_20231115': {
    origin_rsc: 'res-a',
    origin_snap: 'back_20231115_000000',
    finished_time: '20231115_000000',
    finished_timestamp: Date.UTC(2023, 10, 15, 0, 0, 0),
    success: false,
    shipping: false,
  },
  'res-b_now': {
    origin_rsc: 'res-b',
    origin_snap: 'back_shipping',
    finished_time: '',
    finished_timestamp: 0,
    success: false,
    shipping: true,
  },
};

const renderList = (initialEntry = '/remote/s3-a/backups') => {
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

const rowOf = (snap: string) => screen.getByText(snap).closest('tr') as HTMLElement;

const openRowMenu = async (snap: string) => {
  fireEvent.mouseEnter(within(rowOf(snap)).getByRole('button', { name: 'more' }));
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

describe('backup List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBackup).mockResolvedValue({ data: { linstor: backups } } as never);
    vi.mocked(deleteBackup).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(getResources).mockResolvedValue({ data: [] } as never);
  });

  it("lists the remote's backups with finish time and status", async () => {
    renderList();
    const done = (await screen.findByText('back_20231114_221320')).closest('tr') as HTMLElement;
    expect(getBackup).toHaveBeenCalledWith('s3-a');
    expect(within(done).getByText('res-a')).toBeInTheDocument();
    expect(within(done).getByText('2023-11-14 22:13:20')).toBeInTheDocument();
    expect(within(done).getByText('Success')).toBeInTheDocument();
    expect(done.querySelector('.anticon-check-circle')).not.toBeNull();

    const failed = rowOf('back_20231115_000000');
    expect(within(failed).getByText('Failed')).toBeInTheDocument();
    expect(failed.querySelector('.anticon-close-circle')).not.toBeNull();

    expect(within(rowOf('back_shipping')).getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByText('Total 3 items')).toBeInTheDocument();
  });

  it('filters by resource from the search form and writes it to the URL', async () => {
    renderList();
    await screen.findByText('back_shipping');
    fireEvent.change(screen.getByPlaceholderText('Resource'), { target: { value: 'res-b' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.queryByText('back_20231114_221320')).not.toBeInTheDocument());
    expect(screen.getByText('back_shipping')).toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/remote/s3-a/backups?origin_rsc=res-b');
  });

  it('seeds the resource filter from the URL, and reset clears it', async () => {
    renderList('/remote/s3-a/backups?origin_rsc=res-a');
    expect(await screen.findByText('back_20231114_221320')).toBeInTheDocument();
    expect(screen.queryByText('back_shipping')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Resource')).toHaveValue('res-a');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(await screen.findByText('back_shipping')).toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/remote/s3-a/backups');
  });

  it('deletes a backup by its finish time after confirm and refetches', async () => {
    renderList();
    await screen.findByText('back_20231114_221320');
    const menu = await openRowMenu('back_20231114_221320');
    fireEvent.click(within(menu).getByText('Delete'));
    expect(await screen.findByText('Delete this backup?')).toBeInTheDocument();
    expect(deleteBackup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteBackup).toHaveBeenCalledWith('s3-a', { timestamp: '20231114_221320' }));
    await waitFor(() => expect(getBackup).toHaveBeenCalledTimes(2));
  });

  it('shows an empty table when the remote holds no backups', async () => {
    vi.mocked(getBackup).mockResolvedValue({ data: { linstor: {} } } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
  });
});
