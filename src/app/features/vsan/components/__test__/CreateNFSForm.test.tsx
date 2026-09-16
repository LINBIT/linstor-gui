// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { CreateNFSForm } from '../CreateNFSForm';
import { createNFSExport, getResourceGroups, getNetWorkInterfaces } from '../../api';
import { renderWithClient, selectOption, expectModalClosed, openDialog, dialogButton, apiError } from './helpers';

vi.mock('../../api', () => ({
  createNFSExport: vi.fn(),
  getResourceGroups: vi.fn(),
  getNetWorkInterfaces: vi.fn(),
}));

const GIB = 1024 * 1024;

const prefixes = [{ prefix: '10.0.0.', mask: 24 }];
const groups = [{ name: 'rg1', max_volume_size: 10 * GIB }];

const openForm = async (disabled?: boolean) => {
  const refetch = vi.fn();
  const utils = renderWithClient(<CreateNFSForm refetch={refetch} disabled={disabled} />);
  await waitFor(() => expect(getNetWorkInterfaces).toHaveBeenCalled());
  if (disabled) {
    return { ...utils, dialog: null as unknown as HTMLElement, refetch };
  }
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  const dialog = await openDialog();
  return { ...utils, dialog, refetch };
};

// Comboboxes in DOM order: resource group, IP prefix, size unit, file system.
const combos = (dialog: HTMLElement) => within(dialog).getAllByRole('combobox');

const fillRequired = async (dialog: HTMLElement) => {
  fireEvent.change(within(dialog).getByPlaceholderText('Please input name: my_export'), {
    target: { value: 'share1' },
  });
  await selectOption(combos(dialog)[0], /^rg1 /);
  await selectOption(combos(dialog)[1], '10.0.0.');
  fireEvent.change(within(dialog).getByPlaceholderText('0'), { target: { value: '20' } });
  fireEvent.change(within(dialog).getByPlaceholderText('Please input size'), { target: { value: '1' } });
  fireEvent.change(within(dialog).getByPlaceholderText('/'), { target: { value: '/data' } });
};

describe('CreateNFSForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getNetWorkInterfaces).mockResolvedValue({ data: { prefixes } } as never);
    vi.mocked(getResourceGroups).mockResolvedValue({ data: groups } as never);
  });

  it('can be disabled from the outside', async () => {
    await openForm(true);
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('validates the required fields', async () => {
    const { dialog } = await openForm();

    fireEvent.click(dialogButton(dialog, 'Create'));

    expect(await screen.findByText('Name is required!')).toBeInTheDocument();
    expect(await screen.findByText('Please select resource group!')).toBeInTheDocument();
    expect(await screen.findByText('IP prefix is required!')).toBeInTheDocument();
    expect(await screen.findByText('IP address is required!')).toBeInTheDocument();
    expect(await screen.findByText('Size is required!')).toBeInTheDocument();
    expect(await screen.findByText('Export path is required!')).toBeInTheDocument();
    expect(createNFSExport).not.toHaveBeenCalled();
  });

  it('posts a single ext4 volume with the service IP and no allowed IPs by default', async () => {
    vi.mocked(createNFSExport).mockResolvedValue({} as never);
    const { dialog, refetch } = await openForm();

    await fillRequired(dialog);
    fireEvent.click(dialogButton(dialog, 'Create'));

    await waitFor(() =>
      expect(createNFSExport).toHaveBeenCalledWith({
        name: 'share1',
        service_ip: '10.0.0.20/24',
        resource_group: 'rg1',
        volumes: [{ number: 1, export_path: '/data', size_kib: GIB, file_system: 'ext4' }],
        allowed_ips: [],
        gross_size: undefined,
      }),
    );
    expect(await screen.findByText('Create NFS Export successfully')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
    await expectModalClosed();
  });

  it('fills the size with the free space of the group when "Use all available" is ticked', async () => {
    vi.mocked(createNFSExport).mockResolvedValue({} as never);
    const { dialog } = await openForm();

    await fillRequired(dialog);
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Use all available' }));

    const size = within(dialog).getByPlaceholderText('Please input size') as HTMLInputElement;
    await waitFor(() => expect(size.value).toBe(String(10 * GIB - 64 * 1024)));
    expect(size).toBeDisabled();

    fireEvent.click(dialogButton(dialog, 'Create'));
    await waitFor(() =>
      expect(createNFSExport).toHaveBeenCalledWith(
        expect.objectContaining({
          gross_size: true,
          volumes: [{ number: 1, export_path: '/data', size_kib: 10 * GIB - 64 * 1024, file_system: 'ext4' }],
        }),
      ),
    );
  });

  it('numbers additional volumes after the first and lets them be removed', async () => {
    vi.mocked(createNFSExport).mockResolvedValue({} as never);
    const { dialog } = await openForm();

    await fillRequired(dialog);
    await selectOption(combos(dialog)[3], 'xfs');

    fireEvent.click(within(dialog).getByRole('button', { name: /^Volumes/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /^Volumes/ }));
    const paths = within(dialog).getAllByPlaceholderText('Please input export path: /');
    expect(paths).toHaveLength(2);

    const sizes = within(dialog).getAllByPlaceholderText('Please input size');
    fireEvent.change(sizes[1], { target: { value: '2' } });
    fireEvent.change(paths[0], { target: { value: '/logs' } });
    fireEvent.change(sizes[2], { target: { value: '3' } });
    fireEvent.change(paths[1], { target: { value: '/tmp' } });

    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Delete' })[1]);
    await waitFor(() => expect(within(dialog).getAllByPlaceholderText('Please input export path: /')).toHaveLength(1));

    fireEvent.click(dialogButton(dialog, 'Create'));
    await waitFor(() =>
      expect(createNFSExport).toHaveBeenCalledWith(
        expect.objectContaining({
          volumes: [
            { number: 1, export_path: '/data', size_kib: GIB, file_system: 'xfs' },
            { number: 2, export_path: '/logs', size_kib: 2 * GIB, file_system: undefined },
          ],
        }),
      ),
    );
  });

  it('collects allowed IPs and refuses empty entries', async () => {
    vi.mocked(createNFSExport).mockResolvedValue({} as never);
    const { dialog } = await openForm();

    await fillRequired(dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: /^Allowed IPs/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /^Allowed IPs/ }));
    const ips = within(dialog).getAllByPlaceholderText('192.168.0.0/16');
    expect(ips).toHaveLength(2);

    fireEvent.change(ips[0], { target: { value: '10.0.0.0/24' } });
    fireEvent.click(dialogButton(dialog, 'Create'));
    expect(await screen.findByText('Please input something like 192.168.0.0/16')).toBeInTheDocument();
    expect(createNFSExport).not.toHaveBeenCalled();

    fireEvent.click(dialog.querySelectorAll('.dynamic-delete-button')[1] as HTMLElement);
    await waitFor(() => expect(within(dialog).getAllByPlaceholderText('192.168.0.0/16')).toHaveLength(1));

    fireEvent.click(dialogButton(dialog, 'Create'));
    await waitFor(() =>
      expect(createNFSExport).toHaveBeenCalledWith(expect.objectContaining({ allowed_ips: ['10.0.0.0/24'] })),
    );
  });

  it('shows the error when the export fails', async () => {
    vi.mocked(createNFSExport).mockRejectedValue(apiError('Create failed', 'name exists'));
    const { dialog, refetch } = await openForm();

    await fillRequired(dialog);
    fireEvent.click(dialogButton(dialog, 'Create'));

    expect(await screen.findByText('Create failed')).toBeInTheDocument();
    expect(screen.getByText('name exists')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('resets on cancel', async () => {
    const { dialog } = await openForm();

    fireEvent.change(within(dialog).getByPlaceholderText('Please input name: my_export'), {
      target: { value: 'share1' },
    });
    fireEvent.click(dialogButton(dialog, 'Cancel'));
    await expectModalClosed();

    fireEvent.click(screen.getAllByRole('button', { name: 'Create' })[0]);
    const reopened = await openDialog();
    expect((within(reopened).getByPlaceholderText('Please input name: my_export') as HTMLInputElement).value).toBe('');
  });
});
