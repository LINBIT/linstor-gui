// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  getRemoteList: vi.fn(),
  deleteRemote: vi.fn(),
  getBackup: vi.fn(),
  createS3Remote: vi.fn(),
  createLINSTORRemote: vi.fn(),
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

import { getRemoteList, deleteRemote, getBackup } from '../../api';
import { List } from '../List';

const remotes = {
  s3_remotes: [{ remote_name: 's3-a', region: 'eu-central', endpoint: 'http://minio:9000', bucket: 'linstor' }],
  linstor_remotes: [{ remote_name: 'lin-b', url: 'http://other:3370' }],
};

const renderList = (initialEntry = '/remote') => {
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

describe('remote List', () => {
  const windowOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    vi.stubGlobal('open', windowOpen);
    vi.mocked(getRemoteList).mockResolvedValue({ data: remotes } as never);
    vi.mocked(getBackup).mockResolvedValue({ data: { linstor: { b1: {}, b2: {} } } } as never);
    vi.mocked(deleteRemote).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists both kinds with their info and counts S3 backups', async () => {
    renderList();
    const s3 = (await screen.findByText('s3-a')).closest('tr') as HTMLElement;
    expect(within(s3).getByText('s3_remotes')).toBeInTheDocument();
    expect(within(s3).getByText('eu-central.http://minio:9000/linstor')).toBeInTheDocument();
    expect(within(s3).getByText('2').closest('a')).toHaveAttribute('href', '/remote/s3-a/backups');

    const lin = rowOf('lin-b');
    expect(within(lin).getByText('http://other:3370')).toBeInTheDocument();
    expect(within(lin).getByText('N/A')).toBeInTheDocument();

    expect(getBackup).toHaveBeenCalledWith('s3-a');
    expect(getBackup).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Total 2 items')).toBeInTheDocument();
  });

  it('counts zero when the backup listing fails', async () => {
    vi.mocked(getBackup).mockRejectedValue(new Error('bucket gone'));
    renderList();
    const s3 = (await screen.findByText('s3-a')).closest('tr') as HTMLElement;
    expect(within(s3).getByText('0')).toBeInTheDocument();
  });

  it('filters by type and name from the search form and writes them to the URL', async () => {
    renderList();
    await screen.findByText('s3-a');
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByText('LINSTOR', { selector: '.ant-select-item-option-content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(screen.queryByText('s3-a')).not.toBeInTheDocument());
    expect(await screen.findByText('lin-b')).toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/remote?type=linstor_remotes');
  });

  it('seeds the filters from the URL', async () => {
    renderList('/remote?name=lin-b&type=linstor_remotes');
    expect(await screen.findByText('lin-b')).toBeInTheDocument();
    expect(screen.queryByText('s3-a')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toHaveValue('lin-b');
  });

  it('reset clears the filters and the URL', async () => {
    renderList('/remote?type=linstor_remotes');
    await screen.findByText('lin-b');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(await screen.findByText('s3-a')).toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/remote');
  });

  it('"Backups" opens the backup page for S3, and the other cluster\'s GUI for LINSTOR', async () => {
    renderList();
    await screen.findByText('s3-a');
    let menu = await openRowMenu('s3-a');
    fireEvent.click(within(menu).getByText('Backups'));
    expect(navigate).toHaveBeenCalledWith('/remote/s3-a/backups');

    fireEvent.mouseLeave(within(rowOf('s3-a')).getByRole('img', { name: 'more' }));
    menu = await openRowMenu('lin-b');
    fireEvent.click(within(menu).getByText('Backups'));
    expect(windowOpen).toHaveBeenCalledWith(
      expect.stringContaining('http://other:3370/ui/#!/storage-configuration/resources'),
    );
  });

  it('uses the HCI backup route in HCI mode', async () => {
    uiMode = 'HCI';
    renderList();
    const s3 = (await screen.findByText('s3-a')).closest('tr') as HTMLElement;
    expect(within(s3).getByText('2').closest('a')).toHaveAttribute('href', '/hci/remote/s3-a/backups');
  });

  it('deletes a remote after confirm and refetches', async () => {
    renderList();
    await screen.findByText('s3-a');
    const menu = await openRowMenu('s3-a');
    fireEvent.click(within(menu).getByText('Delete'));
    expect(await screen.findByText('Delete this remote object?')).toBeInTheDocument();
    expect(deleteRemote).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteRemote).toHaveBeenCalledWith('s3-a'));
    await waitFor(() => expect(getRemoteList).toHaveBeenCalledTimes(2));
  });

  it('shows an empty table when there are no remotes', async () => {
    vi.mocked(getRemoteList).mockResolvedValue({ data: {} } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
  });
});
