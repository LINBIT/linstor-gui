// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { NFSExportList } from '../NFSExportList';
import { getNFSExport, deleteNFSExport, getResourceGroups, getNetWorkInterfaces, resizeTarget } from '../../api';
import { renderWithClient, confirmPopover, openDialog, dialogButton, tableRows, rowByText, apiError } from './helpers';

vi.mock('../../api', () => ({
  getNFSExport: vi.fn(),
  deleteNFSExport: vi.fn(),
  getResourceGroups: vi.fn(),
  getNetWorkInterfaces: vi.fn(),
  createNFSExport: vi.fn(),
  resizeTarget: vi.fn(),
}));

const GIB = 1024 * 1024;

const status = { state: 'OK', service: 'Started', nodes: ['n1'], primary: 'n1', volumes: [] };

const exports = [
  {
    name: 'nfs1',
    service_ip: '10.0.0.9/24',
    allowed_ips: ['10.0.0.0/24'],
    resource_group: 'rg1',
    gross_size: false,
    volumes: [
      { number: 0, size_kib: 65536, file_system: 'ext4', export_path: '/' },
      { number: 1, size_kib: GIB, file_system: 'ext4', export_path: '/data' },
      { number: 2, size_kib: 2 * GIB, file_system: 'ext4', export_path: '/more' },
    ],
    status,
  },
  {
    name: 'onlyprivate',
    service_ip: '10.0.0.10/24',
    allowed_ips: [],
    resource_group: 'rg1',
    gross_size: false,
    volumes: [{ number: 0, size_kib: 65536, file_system: 'ext4', export_path: '/' }],
    status,
  },
  {
    name: 'nostatus',
    service_ip: '10.0.0.11/24',
    allowed_ips: [],
    resource_group: 'rg1',
    gross_size: false,
    volumes: [
      { number: 0, size_kib: 65536, file_system: 'ext4', export_path: '/' },
      { number: 1, size_kib: GIB, file_system: 'ext4', export_path: '/x' },
    ],
  },
];

const renderList = async (complex?: boolean) => {
  const utils = renderWithClient(<NFSExportList complex={complex} />);
  await waitFor(() => expect(getNFSExport).toHaveBeenCalled());
  return utils;
};

describe('NFSExportList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getNFSExport).mockResolvedValue({ data: exports } as never);
    vi.mocked(getResourceGroups).mockResolvedValue({ data: [{ name: 'rg1', max_volume_size: 10 * GIB }] } as never);
    vi.mocked(getNetWorkInterfaces).mockResolvedValue({ data: { prefixes: [] } } as never);
  });

  it('lists exports with a status and a data volume, with extra volumes as child rows', async () => {
    const { container } = await renderList();
    await waitFor(() => expect(tableRows(container)).toHaveLength(1));

    const row = rowByText(container, 'nfs1');
    expect(row).toHaveTextContent('/srv/gateway-exports/nfs1/data');
    expect(row).toHaveTextContent('n1');
    expect(row).toHaveTextContent('10.0.0.9/24');
    expect(row).toHaveTextContent('1.00 GiB');
    expect(within(row).getByText('OK')).toHaveClass('ant-tag');
    expect(screen.queryByText('onlyprivate')).toBeNull();
    expect(screen.queryByText('nostatus')).toBeNull();

    fireEvent.click(within(row).getByRole('button', { name: /expand/i }));
    await waitFor(() => expect(tableRows(container)).toHaveLength(2));
    const child = rowByText(container, '/srv/gateway-exports/nfs1/more');
    expect(child).toHaveTextContent('2.00 GiB');
  });

  it('disables creating a second export while one exists', async () => {
    await renderList(true);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled());
    expect(screen.getByText(/via an NFS export/)).toBeInTheDocument();
  });

  it('allows creating when there is no export yet', async () => {
    vi.mocked(getNFSExport).mockResolvedValue({ data: [] } as never);
    await renderList(true);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled());
  });

  it('shows the actions on the export row only and deletes after confirmation', async () => {
    vi.mocked(deleteNFSExport).mockResolvedValue({} as never);
    const { container } = await renderList(true);
    await waitFor(() => expect(tableRows(container)).toHaveLength(1));

    const row = rowByText(container, 'nfs1');
    fireEvent.click(within(row).getByRole('button', { name: /expand/i }));
    await waitFor(() => expect(tableRows(container)).toHaveLength(2));
    const child = rowByText(container, '/srv/gateway-exports/nfs1/more');
    expect(within(child).queryByRole('button', { name: 'Delete' })).toBeNull();

    fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Are you sure to delete this NFS target?')).toBeInTheDocument();
    await confirmPopover();

    await waitFor(() => expect(deleteNFSExport).toHaveBeenCalledWith('nfs1'));
    expect(await screen.findByText('Target has been deleted!')).toBeInTheDocument();
    await waitFor(() => expect(getNFSExport).toHaveBeenCalledTimes(2));
  });

  it('reports a failed delete', async () => {
    vi.mocked(deleteNFSExport).mockRejectedValue(apiError('Delete failed', 'mounted'));
    const { container } = await renderList(true);
    await waitFor(() => expect(tableRows(container)).toHaveLength(1));

    fireEvent.click(within(rowByText(container, 'nfs1')).getByRole('button', { name: 'Delete' }));
    await confirmPopover();

    expect(await screen.findByText('Delete failed')).toBeInTheDocument();
    expect(screen.getByText('mounted')).toBeInTheDocument();
  });

  it('grows the export resource', async () => {
    vi.mocked(resizeTarget).mockResolvedValue({} as never);
    const { container } = await renderList(true);
    await waitFor(() => expect(tableRows(container)).toHaveLength(1));

    fireEvent.click(within(rowByText(container, 'nfs1')).getByRole('button', { name: 'Grow' }));
    const dialog = await openDialog();
    fireEvent.click(dialogButton(dialog, 'Grow'));

    await waitFor(() => expect(resizeTarget).toHaveBeenCalledWith('nfs1', { size: GIB }));
  });

  it('reloads on demand', async () => {
    await renderList(true);
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    await waitFor(() => expect(getNFSExport).toHaveBeenCalledTimes(2));
  });
});
