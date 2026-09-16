// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { NVMeoFList } from '../NVMeoFList';
import { getNVMeoFTarget, deleteNVMeExport, getResourceGroups, getNetWorkInterfaces, resizeTarget } from '../../api';
import { renderWithClient, confirmPopover, openDialog, dialogButton, tableRows, rowByText, apiError } from './helpers';

vi.mock('../../api', () => ({
  getNVMeoFTarget: vi.fn(),
  deleteNVMeExport: vi.fn(),
  getResourceGroups: vi.fn(),
  getNetWorkInterfaces: vi.fn(),
  createNVMEExport: vi.fn(),
  resizeTarget: vi.fn(),
}));

const GIB = 1024 * 1024;

const targets = [
  {
    nqn: 'nqn.2024-01.com.linbit:nvme:vol1',
    service_ip: '10.0.0.7/24',
    resource_group: 'rg1',
    volumes: [
      { number: 0, size_kib: 65536 },
      { number: 1, size_kib: 3 * GIB },
    ],
    gross_size: false,
    status: {
      state: 'OK',
      service: 'Started',
      nodes: ['n1', 'n2'],
      primary: 'n2',
      volumes: [
        { number: 0, state: 'OK' },
        { number: 1, state: 'OK' },
      ],
    },
  },
  {
    nqn: 'nqn.2024-01.com.linbit:nvme:nostatus',
    service_ip: '10.0.0.8/24',
    resource_group: 'rg1',
    volumes: [
      { number: 0, size_kib: 65536 },
      { number: 1, size_kib: GIB },
    ],
    gross_size: false,
  },
];

const renderList = async (complex?: boolean) => {
  const utils = renderWithClient(<NVMeoFList complex={complex} />);
  await waitFor(() => expect(tableRows(utils.container).length).toBeGreaterThan(0));
  return utils;
};

describe('NVMeoFList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getNVMeoFTarget).mockResolvedValue({ data: targets } as never);
    vi.mocked(getResourceGroups).mockResolvedValue({ data: [{ name: 'rg1', max_volume_size: 10 * GIB }] } as never);
    vi.mocked(getNetWorkInterfaces).mockResolvedValue({ data: { prefixes: [] } } as never);
  });

  it('lists the targets with a status and hides the actions in simple mode', async () => {
    const { container } = await renderList();

    expect(tableRows(container)).toHaveLength(1);
    const row = rowByText(container, 'vol1');
    expect(row).toHaveTextContent('n2');
    expect(row).toHaveTextContent('10.0.0.7/24');
    expect(row).toHaveTextContent('3.00 GiB');
    expect(within(row).getByText('OK')).toHaveClass('ant-tag');
    expect(screen.queryByText(/nostatus/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByText(/via NVMe-oF/)).toBeNull();
  });

  it('shows the toolbar and reloads in complex mode', async () => {
    await renderList(true);

    expect(screen.getByText(/via NVMe-oF/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    await waitFor(() => expect(getNVMeoFTarget).toHaveBeenCalledTimes(2));
  });

  it('deletes a target after confirmation', async () => {
    vi.mocked(deleteNVMeExport).mockResolvedValue({} as never);
    const { container } = await renderList(true);

    fireEvent.click(within(rowByText(container, 'vol1')).getByRole('button', { name: 'Delete' }));
    await confirmPopover();

    await waitFor(() => expect(deleteNVMeExport).toHaveBeenCalledWith('nqn.2024-01.com.linbit:nvme:vol1'));
    expect(await screen.findByText('Delete NVMe-oF target successfully')).toBeInTheDocument();
    await waitFor(() => expect(getNVMeoFTarget).toHaveBeenCalledTimes(2));
  });

  it('reports a failed delete', async () => {
    vi.mocked(deleteNVMeExport).mockRejectedValue(apiError('Delete failed', 'in use'));
    const { container } = await renderList(true);

    fireEvent.click(within(rowByText(container, 'vol1')).getByRole('button', { name: 'Delete' }));
    await confirmPopover();

    expect(await screen.findByText('Delete failed')).toBeInTheDocument();
    expect(screen.getByText('in use')).toBeInTheDocument();
  });

  it('grows the resource named by the last NQN segment', async () => {
    vi.mocked(resizeTarget).mockResolvedValue({} as never);
    const { container } = await renderList(true);

    fireEvent.click(within(rowByText(container, 'vol1')).getByRole('button', { name: 'Grow' }));
    const dialog = await openDialog();
    fireEvent.click(dialogButton(dialog, 'Grow'));

    await waitFor(() => expect(resizeTarget).toHaveBeenCalledWith('vol1', { size: 3 * GIB }));
  });
});
