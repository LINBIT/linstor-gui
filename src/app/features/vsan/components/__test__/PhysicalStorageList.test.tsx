// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import { PhysicalStorageList } from '../PhysicalStorageList';
import { getStoragePool, getPhysicalStorage, getNodesFromVSAN } from '../../api';
import { renderWithClient, tableRows, rowByText } from './helpers';

vi.mock('../../api', () => ({
  getStoragePool: vi.fn(),
  getPhysicalStorage: vi.fn(),
  getNodesFromVSAN: vi.fn(),
  createPool: vi.fn(),
}));

const pools = [
  { name: 'DfltDisklessStorPool', providerKind: 'DISKLESS', capacities: {} },
  { name: 'pool1', providerKind: 'LVM_THIN', capacities: { node1: 1048576, node2: 2097152 } },
  { name: 'pool2', providerKind: 'LVM', capacities: { node1: 524288 } },
];

describe('PhysicalStorageList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getStoragePool).mockResolvedValue({ data: pools } as never);
    vi.mocked(getPhysicalStorage).mockResolvedValue({ data: [] } as never);
    vi.mocked(getNodesFromVSAN).mockResolvedValue({ data: [] } as never);
  });

  it('lists the pools with their type and per-node capacity, hiding the default pool', async () => {
    const { container } = renderWithClient(<PhysicalStorageList />);
    await waitFor(() => expect(tableRows(container)).toHaveLength(2));

    const pool1 = rowByText(container, 'pool1');
    expect(pool1).toHaveTextContent('LVM_THIN');
    expect(pool1).toHaveTextContent('node1: 1.00 GiB');
    expect(pool1).toHaveTextContent('node2: 2.00 GiB');
    expect(rowByText(container, 'pool2')).toHaveTextContent('node1: 512.00 MiB');
    expect(screen.queryByText('DfltDisklessStorPool')).toBeNull();
  });

  it('expands one row at a time by clicking it', async () => {
    const { container } = renderWithClient(<PhysicalStorageList />);
    await waitFor(() => expect(tableRows(container)).toHaveLength(2));

    expect(container.querySelector('.ant-table-expanded-row')).toBeNull();

    fireEvent.click(rowByText(container, 'pool1'));
    await waitFor(() => expect(container.querySelector('.ant-table-expanded-row')).not.toBeNull());
    expect(container.querySelectorAll('.ant-table-expanded-row')).toHaveLength(1);
    expect(container.querySelector('.ant-table-expanded-row')).toHaveTextContent('node2: 2.00 GiB');

    fireEvent.click(rowByText(container, 'pool2'));
    await waitFor(() => {
      const expanded = Array.from(container.querySelectorAll('.ant-table-expanded-row')).filter(
        (row) => (row as HTMLElement).style.display !== 'none',
      );
      expect(expanded).toHaveLength(1);
      expect(expanded[0]).toHaveTextContent('node1: 512.00 MiB');
    });
  });

  it('reloads on demand', async () => {
    const { container } = renderWithClient(<PhysicalStorageList />);
    await waitFor(() => expect(tableRows(container)).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    await waitFor(() => expect(getStoragePool).toHaveBeenCalledTimes(2));
  });
});
