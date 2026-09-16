// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { CreateStoragePoolForm } from '../CreateStoragePoolForm';
import { createPool, getNodesFromVSAN, getPhysicalStorage, getStoragePool } from '../../api';
import {
  renderWithClient,
  selectOption,
  expectModalClosed,
  openDialog,
  dialogButton,
  tableRows,
  apiError,
} from './helpers';

vi.mock('../../api', () => ({
  createPool: vi.fn(),
  getNodesFromVSAN: vi.fn(),
  getPhysicalStorage: vi.fn(),
  getStoragePool: vi.fn(),
}));

const GIB_BYTES = Math.pow(2, 30);

const disks = [
  {
    size: 20 * GIB_BYTES,
    rotational: false,
    nodes: { n1: [{ device: '/dev/sdb' }, { device: '/dev/sdc' }], n2: [{ device: 'sdb' }] },
  },
  { size: 5 * GIB_BYTES, rotational: true, nodes: { n2: [{ device: '/dev/sdd' }] } },
];

const nodes = [
  { hostname: 'n1', service_ip: '10.0.0.1' },
  { hostname: 'n2', service_ip: '10.0.0.2' },
];

const pools = [
  { name: 'DfltDisklessStorPool', providerKind: 'DISKLESS' },
  { name: 'pool1', providerKind: 'LVM_THIN' },
  { name: 'pool2', providerKind: 'LVM' },
];

const openForm = async () => {
  const refetch = vi.fn();
  const utils = renderWithClient(<CreateStoragePoolForm refetch={refetch} />);
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  const dialog = await openDialog();
  return { ...utils, dialog, refetch };
};

const waitForMatrix = async (dialog: HTMLElement) => {
  await waitFor(() => expect(tableRows(dialog)).toHaveLength(3));
  return tableRows(dialog);
};

// Checkboxes per row in DOM order: all, n1, n2.
const boxes = (row: HTMLElement) => within(row).getAllByRole('checkbox');

const nameInput = (dialog: HTMLElement) => within(dialog).getByPlaceholderText('Please input pool name');

describe('CreateStoragePoolForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getPhysicalStorage).mockResolvedValue({ data: disks } as never);
    vi.mocked(getNodesFromVSAN).mockResolvedValue({ data: nodes } as never);
    vi.mocked(getStoragePool).mockResolvedValue({ data: pools } as never);
  });

  it('renders one row per disk instance with a checkbox per node that has it', async () => {
    const { dialog } = await openForm();
    const rows = await waitForMatrix(dialog);

    expect(rows[0]).toHaveTextContent('20.00 GiB SSD');
    expect(rows[1]).toHaveTextContent('20.00 GiB SSD');
    expect(rows[2]).toHaveTextContent('5.00 GiB HDD');
    expect(within(dialog).getByText('n1')).toBeInTheDocument();
    expect(within(dialog).getByText('n2')).toBeInTheDocument();

    expect(boxes(rows[0])[1]).toBeEnabled();
    expect(boxes(rows[0])[2]).toBeEnabled();
    expect(boxes(rows[1])[1]).toBeEnabled();
    expect(boxes(rows[1])[2]).toBeDisabled();
    expect(boxes(rows[2])[1]).toBeDisabled();
    expect(boxes(rows[2])[2]).toBeEnabled();

    fireEvent.mouseEnter(boxes(rows[0])[2].closest('label') as HTMLElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('/dev/sdb on n2');
  });

  it('creates a pool from the disks ticked through the row checkbox', async () => {
    vi.mocked(createPool).mockResolvedValue({} as never);
    const { dialog, refetch } = await openForm();
    const rows = await waitForMatrix(dialog);

    fireEvent.click(boxes(rows[0])[0]);
    expect(boxes(rows[0])[1]).toBeChecked();
    expect(boxes(rows[0])[2]).toBeChecked();
    expect(boxes(rows[0])[0]).toBeChecked();

    fireEvent.change(nameInput(dialog), { target: { value: 'pool_new' } });
    fireEvent.click(dialogButton(dialog, 'Create'));

    await waitFor(() =>
      expect(createPool).toHaveBeenCalledWith({
        poolName: 'pool_new',
        providerKind: 'LVM_THIN',
        diskPaths: { n1: ['/dev/sdb'], n2: ['/dev/sdb'] },
        nodes: ['n1', 'n2'],
      }),
    );
    expect(await screen.findByText('Create successfully')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
    await expectModalClosed();
  });

  it('drops a node again when its last disk is unticked', async () => {
    vi.mocked(createPool).mockResolvedValue({} as never);
    const { dialog } = await openForm();
    const rows = await waitForMatrix(dialog);

    fireEvent.click(boxes(rows[0])[1]);
    fireEvent.click(boxes(rows[1])[1]);
    fireEvent.click(boxes(rows[2])[2]);
    fireEvent.click(boxes(rows[2])[2]);
    expect(boxes(rows[0])[0]).not.toBeChecked();

    fireEvent.change(nameInput(dialog), { target: { value: 'pool_new' } });
    fireEvent.click(dialogButton(dialog, 'Create'));

    await waitFor(() =>
      expect(createPool).toHaveBeenCalledWith(
        expect.objectContaining({ diskPaths: { n1: ['/dev/sdb', '/dev/sdc'] }, nodes: ['n1'] }),
      ),
    );
  });

  it('validates the pool name', async () => {
    const { dialog } = await openForm();
    await waitForMatrix(dialog);

    fireEvent.click(dialogButton(dialog, 'Create'));
    expect(await screen.findByText('Name is required!')).toBeInTheDocument();

    fireEvent.change(nameInput(dialog), { target: { value: 'ab' } });
    expect(await screen.findByText('Name must be at least 3 characters!')).toBeInTheDocument();

    fireEvent.change(nameInput(dialog), { target: { value: '1abc' } });
    expect(await screen.findByText(/must start with a letter or an underscore/)).toBeInTheDocument();

    fireEvent.change(nameInput(dialog), { target: { value: 'a'.repeat(49) } });
    expect(await screen.findByText('Name must be at most 48 characters!')).toBeInTheDocument();
    expect(createPool).not.toHaveBeenCalled();
  });

  it('adds the disks to an existing pool instead when asked', async () => {
    vi.mocked(createPool).mockResolvedValue({} as never);
    const { dialog } = await openForm();
    const rows = await waitForMatrix(dialog);

    fireEvent.click(boxes(rows[2])[2]);
    fireEvent.click(within(dialog).getByText('Add to existing pool'));

    expect(await within(dialog).findByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText('Please input pool name')).toBeNull();
    await waitFor(() => expect(within(dialog).getByText('pool1')).toBeInTheDocument());

    const poolSelect = within(dialog).getAllByRole('combobox')[0];
    fireEvent.mouseDown(poolSelect);
    await waitFor(() => expect(document.querySelector('.ant-select-item[title="pool2"]')).not.toBeNull());
    expect(document.querySelector('.ant-select-item[title="DfltDisklessStorPool"]')).toBeNull();
    await selectOption(poolSelect, 'pool2');

    fireEvent.click(dialogButton(dialog, 'Add'));
    await waitFor(() =>
      expect(createPool).toHaveBeenCalledWith(
        expect.objectContaining({ poolName: 'pool2', diskPaths: { n2: ['/dev/sdd'] }, nodes: ['n2'] }),
      ),
    );
  });

  it('only allows VDO when every ticked disk has at least 10 GiB', async () => {
    vi.mocked(createPool).mockResolvedValue({} as never);
    const { dialog } = await openForm();
    const rows = await waitForMatrix(dialog);

    const typeSelect = () => within(dialog).getAllByRole('combobox').slice(-1)[0];
    const vdoOption = () => document.querySelector('.ant-select-item[title="LVM+VDO"]') as HTMLElement | null;

    fireEvent.mouseDown(typeSelect());
    await waitFor(() => expect(vdoOption()).not.toBeNull());
    expect(vdoOption()).toHaveClass('ant-select-item-option-disabled');
    fireEvent.mouseDown(typeSelect());

    fireEvent.click(boxes(rows[2])[2]);
    fireEvent.mouseDown(typeSelect());
    await waitFor(() => expect(vdoOption()).toHaveClass('ant-select-item-option-disabled'));
    fireEvent.mouseDown(typeSelect());

    fireEvent.click(boxes(rows[2])[2]);
    fireEvent.click(boxes(rows[0])[1]);
    await selectOption(typeSelect(), 'LVM+VDO');

    fireEvent.change(nameInput(dialog), { target: { value: 'vdo_pool' } });
    fireEvent.click(dialogButton(dialog, 'Create'));
    await waitFor(() =>
      expect(createPool).toHaveBeenCalledWith(expect.objectContaining({ providerKind: 'LVM+VDO', nodes: ['n1'] })),
    );
  });

  it('shows the error and keeps the dialog when creating fails', async () => {
    vi.mocked(createPool).mockRejectedValue(apiError('Create failed', 'device busy'));
    const { dialog, refetch } = await openForm();
    const rows = await waitForMatrix(dialog);

    fireEvent.click(boxes(rows[0])[1]);
    fireEvent.change(nameInput(dialog), { target: { value: 'pool_new' } });
    fireEvent.click(dialogButton(dialog, 'Create'));

    expect(await screen.findByText('Create failed')).toBeInTheDocument();
    expect(screen.getByText('device busy')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('still opens with an empty matrix when the node list cannot be loaded', async () => {
    vi.mocked(getNodesFromVSAN).mockRejectedValue(new Error('down'));
    const { dialog } = await openForm();

    await waitFor(() => expect(getNodesFromVSAN).toHaveBeenCalled());
    expect(dialog.querySelector('.ant-table')).not.toBeNull();
    expect(tableRows(dialog)).toHaveLength(0);
    expect(nameInput(dialog)).toBeInTheDocument();
  });

  it('clears the selection on cancel', async () => {
    const { dialog } = await openForm();
    const rows = await waitForMatrix(dialog);

    fireEvent.click(boxes(rows[0])[1]);
    fireEvent.change(nameInput(dialog), { target: { value: 'pool_new' } });
    fireEvent.click(dialogButton(dialog, 'Cancel'));
    await expectModalClosed();

    fireEvent.click(screen.getAllByRole('button', { name: 'Create' })[0]);
    const reopened = await openDialog();
    const again = await waitForMatrix(reopened);
    expect(boxes(again[0])[1]).not.toBeChecked();
    expect((nameInput(reopened) as HTMLInputElement).value).toBe('');
  });
});
