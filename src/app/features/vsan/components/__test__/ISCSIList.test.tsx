// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { ISCSIList } from '../ISCSIList';
import { getISCSITarget, deleteISCISExport, getResourceGroups, getNetWorkInterfaces, resizeTarget } from '../../api';
import { renderWithClient, confirmPopover, openDialog, dialogButton, tableRows, rowByText, apiError } from './helpers';

vi.mock('../../api', () => ({
  getISCSITarget: vi.fn(),
  deleteISCISExport: vi.fn(),
  getResourceGroups: vi.fn(),
  getNetWorkInterfaces: vi.fn(),
  createISCSIExport: vi.fn(),
  resizeTarget: vi.fn(),
}));

const GIB = 1024 * 1024;

const targets = [
  {
    iqn: 'iqn.2024-01.com.linbit:tgt1',
    resource_group: 'rg1',
    service_ips: ['10.0.0.5/24'],
    volumes: [
      { number: 0, size_kib: 65536 },
      { number: 1, size_kib: GIB },
    ],
    status: {
      state: 'OK',
      service: 'Started',
      nodes: ['n1', 'n2'],
      primary: 'n1',
      volumes: [
        { number: 0, state: 'OK' },
        { number: 1, state: 'OK' },
      ],
    },
  },
  {
    iqn: 'iqn.2024-01.com.linbit:pending',
    resource_group: 'rg1',
    service_ips: ['10.0.0.6/24'],
    volumes: [
      { number: 0, size_kib: 65536 },
      { number: 1, size_kib: GIB },
    ],
  },
  {
    iqn: 'iqn.2024-01.com.linbit:tgt3',
    resource_group: 'rg1',
    service_ips: [],
    volumes: [
      { number: 0, size_kib: 65536 },
      { number: 1, size_kib: 2 * GIB },
    ],
    status: {
      state: 'Degraded',
      service: 'Stopped',
      nodes: ['n1'],
      volumes: [
        { number: 0, state: 'OK' },
        { number: 1, state: 'Degraded' },
      ],
    },
  },
];

const renderList = async (complex?: boolean) => {
  const utils = renderWithClient(<ISCSIList complex={complex} />);
  await waitFor(() => expect(tableRows(utils.container).length).toBeGreaterThan(0));
  return utils;
};

describe('ISCSIList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getISCSITarget).mockResolvedValue({ data: targets } as never);
    vi.mocked(getResourceGroups).mockResolvedValue({ data: [{ name: 'rg1', max_volume_size: 10 * GIB }] } as never);
    vi.mocked(getNetWorkInterfaces).mockResolvedValue({ data: { prefixes: [] } } as never);
  });

  it('shows one row per LUN of every target that has a status', async () => {
    const { container } = await renderList();

    expect(tableRows(container)).toHaveLength(2);
    const tgt1 = rowByText(container, 'tgt1');
    expect(tgt1).toHaveTextContent('n1');
    expect(tgt1).toHaveTextContent('10.0.0.5/24');
    expect(tgt1).toHaveTextContent('1.00 GiB');
    expect(within(tgt1).getByText('OK')).toHaveClass('ant-tag');

    const tgt3 = rowByText(container, 'tgt3');
    expect(tgt3).toHaveTextContent('-');
    expect(tgt3).toHaveTextContent('2.00 GiB');
    expect(within(tgt3).getByText('Degraded')).toHaveClass('ant-tag');

    expect(screen.queryByText(/pending/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
  });

  it('adds the description, create button and actions in complex mode', async () => {
    const { container } = await renderList(true);

    expect(screen.getByText(/exposed as an iSCSI target/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(within(rowByText(container, 'tgt1')).getByRole('button', { name: 'Grow' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    await waitFor(() => expect(getISCSITarget).toHaveBeenCalledTimes(2));
  });

  it('deletes a target after confirmation', async () => {
    vi.mocked(deleteISCISExport).mockResolvedValue({} as never);
    const { container } = await renderList(true);

    fireEvent.click(within(rowByText(container, 'tgt1')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Are you sure to delete this ISCSI target?')).toBeInTheDocument();
    await confirmPopover();

    await waitFor(() => expect(deleteISCISExport).toHaveBeenCalledWith('iqn.2024-01.com.linbit:tgt1'));
    expect(await screen.findByText('Delete ISCSI target successfully')).toBeInTheDocument();
    await waitFor(() => expect(getISCSITarget).toHaveBeenCalledTimes(2));
  });

  it('reports a failed delete', async () => {
    vi.mocked(deleteISCISExport).mockRejectedValue(apiError('Delete failed', undefined, 'target busy'));
    const { container } = await renderList(true);

    fireEvent.click(within(rowByText(container, 'tgt3')).getByRole('button', { name: 'Delete' }));
    await confirmPopover();

    expect(await screen.findByText('Delete failed')).toBeInTheDocument();
    expect(screen.getByText('target busy')).toBeInTheDocument();
  });

  it('grows the resource behind the IQN', async () => {
    vi.mocked(resizeTarget).mockResolvedValue({} as never);
    const { container } = await renderList(true);

    fireEvent.click(within(rowByText(container, 'tgt1')).getByRole('button', { name: 'Grow' }));
    const dialog = await openDialog();
    fireEvent.click(dialogButton(dialog, 'Grow'));

    await waitFor(() => expect(resizeTarget).toHaveBeenCalledWith('tgt1', { size: GIB }));
    await waitFor(() => expect(getISCSITarget).toHaveBeenCalledTimes(2));
  });
});
