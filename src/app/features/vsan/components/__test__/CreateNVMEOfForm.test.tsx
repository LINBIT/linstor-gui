// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { CreateNVMEOfForm } from '../CreateNVMEOfForm';
import { createNVMEExport, getResourceGroups, getNetWorkInterfaces } from '../../api';
import { renderWithClient, selectOption, expectModalClosed, openDialog, dialogButton, apiError } from './helpers';

vi.mock('../../api', () => ({
  createNVMEExport: vi.fn(),
  getResourceGroups: vi.fn(),
  getNetWorkInterfaces: vi.fn(),
}));

const GIB = 1024 * 1024;

const prefixes = [
  { prefix: '10.0.0.', mask: 24 },
  { prefix: '172.16.0.', mask: 12 },
];

const groups = [
  { name: 'rg1', max_volume_size: 10 * GIB },
  { name: 'rg2', max_volume_size: 20 * GIB },
];

const openForm = async () => {
  const refetch = vi.fn();
  const utils = renderWithClient(<CreateNVMEOfForm refetch={refetch} />);
  await waitFor(() => expect(getNetWorkInterfaces).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  const dialog = await openDialog();
  return { ...utils, dialog, refetch };
};

const combos = (dialog: HTMLElement) => within(dialog).getAllByRole('combobox');

const fillNqn = (dialog: HTMLElement, time = '2024-01', domain = 'com.linbit', name = 'vol1') => {
  fireEvent.change(within(dialog).getByPlaceholderText('yyyy-mm'), { target: { value: time } });
  fireEvent.change(within(dialog).getByPlaceholderText('com.company'), { target: { value: domain } });
  fireEvent.change(within(dialog).getByPlaceholderText('unique-name'), { target: { value: name } });
};

describe('CreateNVMEOfForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getNetWorkInterfaces).mockResolvedValue({ data: { prefixes } } as never);
    vi.mocked(getResourceGroups).mockResolvedValue({ data: groups } as never);
  });

  it('validates the required fields', async () => {
    const { dialog } = await openForm();

    fireEvent.click(dialogButton(dialog, 'Create'));

    expect(await screen.findByText('Please select resource group!')).toBeInTheDocument();
    expect(await screen.findByText('IP prefix is required!')).toBeInTheDocument();
    expect(await screen.findByText('IP address is required!')).toBeInTheDocument();
    expect(createNVMEExport).not.toHaveBeenCalled();
  });

  it('uses all available space by default and posts the NQN with the nvme infix', async () => {
    vi.mocked(createNVMEExport).mockResolvedValue({} as never);
    const { dialog, refetch } = await openForm();

    expect(within(dialog).getByRole('checkbox', { name: 'Use all available' })).toBeChecked();
    fillNqn(dialog);
    await selectOption(combos(dialog)[0], /^rg1 /);
    await selectOption(combos(dialog)[1], '172.16.0.');
    fireEvent.change(within(dialog).getByPlaceholderText('0'), { target: { value: '9' } });

    const size = within(dialog).getByPlaceholderText('Please input size') as HTMLInputElement;
    await waitFor(() => expect(size.value).toBe(String(10 * GIB - 64 * 1024)));
    expect(size).toBeDisabled();

    fireEvent.click(dialogButton(dialog, 'Create'));

    await waitFor(() =>
      expect(createNVMEExport).toHaveBeenCalledWith({
        nqn: 'nqn.2024-01.com.linbit:nvme:vol1',
        service_ip: '172.16.0.9/12',
        resource_group: 'rg1',
        volumes: [{ number: 1, size_kib: 10 * GIB - 64 * 1024 }],
        gross_size: true,
      }),
    );
    expect(await screen.findByText('Create NVMe-oF Export successfully')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
    await expectModalClosed();
  });

  it('accepts an explicit size once "Use all available" is unticked', async () => {
    vi.mocked(createNVMEExport).mockResolvedValue({} as never);
    const { dialog } = await openForm();

    fillNqn(dialog);
    await selectOption(combos(dialog)[0], /^rg2 /);
    await selectOption(combos(dialog)[1], '10.0.0.');
    fireEvent.change(within(dialog).getByPlaceholderText('0'), { target: { value: '5' } });
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Use all available' }));

    const size = within(dialog).getByPlaceholderText('Please input size') as HTMLInputElement;
    await waitFor(() => expect(size).toBeEnabled());
    // The unit picker fell back to KiB while the input was disabled.
    await selectOption(combos(dialog)[2], 'GiB');
    fireEvent.change(size, { target: { value: '3' } });
    fireEvent.click(dialogButton(dialog, 'Create'));

    await waitFor(() =>
      expect(createNVMEExport).toHaveBeenCalledWith(
        expect.objectContaining({
          service_ip: '10.0.0.5/24',
          volumes: [{ number: 1, size_kib: 3 * GIB }],
          gross_size: false,
        }),
      ),
    );
  });

  it('rejects a malformed NQN', async () => {
    const { dialog } = await openForm();

    vi.mocked(createNVMEExport).mockResolvedValue({} as never);
    fillNqn(dialog, '2024-13', 'com.linbit', 'vol1');
    await selectOption(combos(dialog)[0], /^rg1 /);
    await selectOption(combos(dialog)[1], '10.0.0.');
    fireEvent.change(within(dialog).getByPlaceholderText('0'), { target: { value: '5' } });
    fireEvent.click(dialogButton(dialog, 'Create'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(createNVMEExport).not.toHaveBeenCalled();

    fillNqn(dialog, '2024-12', 'com.linbit', 'vol1');
    fireEvent.click(dialogButton(dialog, 'Create'));
    await waitFor(() =>
      expect(createNVMEExport).toHaveBeenCalledWith(
        expect.objectContaining({ nqn: 'nqn.2024-12.com.linbit:nvme:vol1' }),
      ),
    );
  });

  it('shows the error when the export fails', async () => {
    vi.mocked(createNVMEExport).mockRejectedValue(apiError('Create failed', undefined, 'nqn exists'));
    const { dialog } = await openForm();

    fillNqn(dialog);
    await selectOption(combos(dialog)[0], /^rg1 /);
    await selectOption(combos(dialog)[1], '10.0.0.');
    fireEvent.change(within(dialog).getByPlaceholderText('0'), { target: { value: '5' } });
    fireEvent.click(dialogButton(dialog, 'Create'));

    expect(await screen.findByText('Create failed')).toBeInTheDocument();
    expect(screen.getByText('nqn exists')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('resets on cancel', async () => {
    const { dialog } = await openForm();

    fillNqn(dialog);
    fireEvent.click(dialogButton(dialog, 'Cancel'));
    await expectModalClosed();

    fireEvent.click(screen.getAllByRole('button', { name: 'Create' })[0]);
    const reopened = await openDialog();
    expect((within(reopened).getByPlaceholderText('unique-name') as HTMLInputElement).value).toBe('');
  });
});
