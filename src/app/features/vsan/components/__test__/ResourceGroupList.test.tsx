// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { ResourceGroupList } from '../ResourceGroupList';
import { getResourceGroups, deleteResourceGroup, getStoragePool, createResourceGroup } from '../../api';
import {
  renderWithClient,
  selectOption,
  confirmPopover,
  expectModalClosed,
  openDialog,
  dialogButton,
  tableRows,
  rowByText,
  apiError,
} from './helpers';

vi.mock('../../api', () => ({
  getResourceGroups: vi.fn(),
  deleteResourceGroup: vi.fn(),
  getStoragePool: vi.fn(),
  createResourceGroup: vi.fn(),
}));

const mocked = {
  groups: vi.mocked(getResourceGroups),
  remove: vi.mocked(deleteResourceGroup),
  pools: vi.mocked(getStoragePool),
  create: vi.mocked(createResourceGroup),
};

const groups = [
  { name: 'DfltDisklessStorPool', select_filter: { place_count: 1, storage_pool: 'DfltDisklessStorPool' } },
  { name: 'rg1', select_filter: { place_count: 2, storage_pool: 'pool1' } },
  { name: 'rg2', select_filter: { place_count: 3, storage_pool: 'pool2' } },
];

const pools = [
  { name: 'DfltDisklessStorPool', providerKind: 'DISKLESS' },
  { name: 'pool1', providerKind: 'LVM_THIN' },
];

const renderList = async () => {
  const utils = renderWithClient(<ResourceGroupList />);
  await waitFor(() => expect(tableRows(utils.container).length).toBeGreaterThan(0));
  return utils;
};

describe('ResourceGroupList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocked.groups.mockResolvedValue({ data: groups } as never);
    mocked.pools.mockResolvedValue({ data: pools } as never);
  });

  it('lists the resource groups except the default diskless one', async () => {
    const { container } = await renderList();

    const rows = tableRows(container);
    expect(rows).toHaveLength(2);
    expect(rowByText(container, 'rg1')).toHaveTextContent('pool1');
    expect(rowByText(container, 'rg1')).toHaveTextContent('2');
    expect(rowByText(container, 'rg2')).toHaveTextContent('pool2');
    expect(screen.queryByText('DfltDisklessStorPool')).toBeNull();
  });

  it('reloads on demand', async () => {
    await renderList();
    expect(mocked.groups).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    await waitFor(() => expect(mocked.groups).toHaveBeenCalledTimes(2));
  });

  it('deletes a group after confirmation and reloads', async () => {
    mocked.remove.mockResolvedValue({} as never);
    const { container } = await renderList();

    fireEvent.click(within(rowByText(container, 'rg1')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Are you sure to delete this resource group?')).toBeInTheDocument();
    await confirmPopover();

    await waitFor(() => expect(mocked.remove).toHaveBeenCalledWith('rg1'));
    expect(await screen.findByText('Delete resource group successfully')).toBeInTheDocument();
    await waitFor(() => expect(mocked.groups).toHaveBeenCalledTimes(2));
  });

  it('reports a failed delete with the server detail', async () => {
    mocked.remove.mockRejectedValue(apiError('Cannot delete', 'still in use'));
    const { container } = await renderList();

    fireEvent.click(within(rowByText(container, 'rg2')).getByRole('button', { name: 'Delete' }));
    await confirmPopover();

    expect(await screen.findByText('Cannot delete')).toBeInTheDocument();
    expect(screen.getByText('still in use')).toBeInTheDocument();
    expect(mocked.groups).toHaveBeenCalledTimes(1);
  });

  describe('create dialog', () => {
    it('requires a name and posts the defaults with any storage pool', async () => {
      mocked.create.mockResolvedValue({} as never);
      await renderList();

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
      const dialog = await openDialog();

      fireEvent.click(dialogButton(dialog, 'Create'));
      expect(await screen.findByText('Please input resource group name!')).toBeInTheDocument();
      expect(mocked.create).not.toHaveBeenCalled();

      fireEvent.change(within(dialog).getByPlaceholderText('Name'), { target: { value: 'rg3' } });
      fireEvent.click(dialogButton(dialog, 'Create'));

      await waitFor(() => expect(mocked.create).toHaveBeenCalledWith({ name: 'rg3', placeCount: 2, poolName: null }));
      expect(await screen.findByText('Create resource group successfully')).toBeInTheDocument();
      await expectModalClosed();
      await waitFor(() => expect(mocked.groups).toHaveBeenCalledTimes(2));
    });

    it('posts the chosen storage pool and replica count as a number', async () => {
      mocked.create.mockResolvedValue({} as never);
      await renderList();

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
      const dialog = await openDialog();

      fireEvent.change(within(dialog).getByPlaceholderText('Name'), { target: { value: 'rg3' } });
      await selectOption(within(dialog).getByRole('combobox'), 'pool1');
      expect(document.querySelector('.ant-select-item[title="DfltDisklessStorPool"]')).toBeNull();
      fireEvent.change(within(dialog).getByRole('spinbutton'), { target: { value: '3' } });
      fireEvent.click(dialogButton(dialog, 'Create'));

      await waitFor(() =>
        expect(mocked.create).toHaveBeenCalledWith({ name: 'rg3', placeCount: 3, poolName: 'pool1' }),
      );
    });

    it('keeps the dialog open and shows the error when creating fails', async () => {
      mocked.create.mockRejectedValue(apiError('Name taken', undefined, 'pick another'));
      await renderList();

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
      const dialog = await openDialog();
      fireEvent.change(within(dialog).getByPlaceholderText('Name'), { target: { value: 'rg1' } });
      fireEvent.click(dialogButton(dialog, 'Create'));

      expect(await screen.findByText('Name taken')).toBeInTheDocument();
      expect(screen.getByText('pick another')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeVisible();

      fireEvent.click(dialogButton(dialog, 'Cancel'));
      await expectModalClosed();
    });
  });
});
