// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { CreateISCSIForm } from '../CreateISCSIForm';
import { createISCSIExport, getResourceGroups, getNetWorkInterfaces } from '../../api';
import { renderWithClient, selectOption, expectModalClosed, openDialog, dialogButton, apiError } from './helpers';

vi.mock('../../api', () => ({
  createISCSIExport: vi.fn(),
  getResourceGroups: vi.fn(),
  getNetWorkInterfaces: vi.fn(),
}));

const GIB = 1024 * 1024;

const prefixes = [
  { prefix: '127.', mask: 8 },
  { prefix: '10.0.0.', mask: 24 },
  { prefix: '192.168.1.', mask: 16 },
];

const groups = [
  { name: 'rg1', max_volume_size: 10 * GIB },
  { name: 'rg2', max_volume_size: 20 * GIB },
];

const openForm = async () => {
  const refetch = vi.fn();
  const utils = renderWithClient(<CreateISCSIForm refetch={refetch} />);
  await waitFor(() => expect(getNetWorkInterfaces).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  const dialog = await openDialog();
  return { ...utils, dialog, refetch };
};

const fillIqn = (dialog: HTMLElement, time = '2024-01', domain = 'com.linbit', name = 'tgt1') => {
  fireEvent.change(within(dialog).getByPlaceholderText('yyyy-mm'), { target: { value: time } });
  fireEvent.change(within(dialog).getByPlaceholderText('com.company'), { target: { value: domain } });
  fireEvent.change(within(dialog).getByPlaceholderText('unique-name'), { target: { value: name } });
};

// Comboboxes in DOM order: resource group, service IP prefix, size unit.
const combos = (dialog: HTMLElement) => within(dialog).getAllByRole('combobox');

const fillRequired = async (dialog: HTMLElement) => {
  fillIqn(dialog);
  await selectOption(combos(dialog)[0], /^rg1 /);
  await selectOption(combos(dialog)[1], '10.0.0.');
  fireEvent.change(within(dialog).getByPlaceholderText('0'), { target: { value: '5' } });
  fireEvent.change(within(dialog).getByPlaceholderText('Please input size'), { target: { value: '2' } });
};

describe('CreateISCSIForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getNetWorkInterfaces).mockResolvedValue({ data: { prefixes } } as never);
    vi.mocked(getResourceGroups).mockResolvedValue({ data: groups } as never);
  });

  it('validates every required field before posting', async () => {
    const { dialog } = await openForm();

    fireEvent.click(dialogButton(dialog, 'Create'));

    expect(await screen.findByText('Please select resource group!')).toBeInTheDocument();
    expect(await screen.findByText('IP prefix is required!')).toBeInTheDocument();
    expect(await screen.findByText('IP address is required!')).toBeInTheDocument();
    expect(await screen.findByText('Size is required!')).toBeInTheDocument();
    expect(createISCSIExport).not.toHaveBeenCalled();
  });

  it('offers the resource groups with their free space and hides the loopback prefix', async () => {
    const { dialog } = await openForm();

    const option = (title: string) => document.querySelector(`.ant-select-item[title="${title}"]`);

    fireEvent.mouseDown(combos(dialog)[0]);
    await waitFor(() => expect(option('rg1 (10.00 GiB available)')).not.toBeNull());
    expect(option('rg2 (20.00 GiB available)')).not.toBeNull();

    fireEvent.mouseDown(combos(dialog)[1]);
    await waitFor(() => expect(option('192.168.1.')).not.toBeNull());
    expect(option('10.0.0.')).not.toBeNull();
    expect(option('127.')).toBeNull();
  });

  it('builds the IQN and service IP and posts the export', async () => {
    vi.mocked(createISCSIExport).mockResolvedValue({} as never);
    const { dialog, refetch } = await openForm();

    await fillRequired(dialog);
    fireEvent.click(dialogButton(dialog, 'Create'));

    await waitFor(() =>
      expect(createISCSIExport).toHaveBeenCalledWith({
        iqn: 'iqn.2024-01.com.linbit:tgt1',
        service_ips: ['10.0.0.5/24'],
        resource_group: 'rg1',
        volumes: [{ number: 1, size_kib: 2 * GIB }],
        username: '',
        password: '',
        gross_size: undefined,
        implementation: 'scst',
      }),
    );
    expect(await screen.findByText('Create iSCSI Export successfully')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
    await expectModalClosed();
  });

  it('rejects malformed IQN parts', async () => {
    const { dialog } = await openForm();

    vi.mocked(createISCSIExport).mockResolvedValue({} as never);
    await fillRequired(dialog);

    const submitInvalid = async (time: string, domain: string, name: string) => {
      fillIqn(dialog, time, domain, name);
      fireEvent.click(dialogButton(dialog, 'Create'));
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(createISCSIExport).not.toHaveBeenCalled();
    };
    await submitInvalid('24-1', 'com.linbit', 'tgt1');
    await submitInvalid('2024-13', 'com.linbit', 'tgt1');
    await submitInvalid('2024-01', 'nodomain', 'tgt1');
    await submitInvalid('2024-01', 'com.linbit', 'Bad Name');
    await submitInvalid('2024-01', 'com.linbit', '1starts-with-digit');

    // The same submit goes through once the parts are well formed.
    fillIqn(dialog, '2024-01', 'com.linbit', 'good_name-1');
    fireEvent.click(dialogButton(dialog, 'Create'));
    await waitFor(() =>
      expect(createISCSIExport).toHaveBeenCalledWith(
        expect.objectContaining({ iqn: 'iqn.2024-01.com.linbit:good_name-1' }),
      ),
    );
  });

  it('uses all available space of the chosen group when asked', async () => {
    vi.mocked(createISCSIExport).mockResolvedValue({} as never);
    const { dialog } = await openForm();

    fillIqn(dialog);
    await selectOption(combos(dialog)[0], /^rg2 /);
    await selectOption(combos(dialog)[1], '10.0.0.');
    fireEvent.change(within(dialog).getByPlaceholderText('0'), { target: { value: '5' } });
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Use all available' }));

    const size = within(dialog).getByPlaceholderText('Please input size') as HTMLInputElement;
    await waitFor(() => expect(size.value).toBe(String(20 * GIB - 64 * 1024)));
    expect(size).toBeDisabled();

    fireEvent.click(dialogButton(dialog, 'Create'));
    await waitFor(() =>
      expect(createISCSIExport).toHaveBeenCalledWith(
        expect.objectContaining({
          gross_size: true,
          volumes: [{ number: 1, size_kib: 20 * GIB - 64 * 1024 }],
        }),
      ),
    );
  });

  it('sends CHAP credentials only when CHAP is enabled', async () => {
    vi.mocked(createISCSIExport).mockResolvedValue({} as never);
    const { dialog } = await openForm();

    await fillRequired(dialog);
    expect(within(dialog).queryByLabelText('Username')).toBeNull();

    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Enable CHAP Authentication' }));
    fireEvent.change(within(dialog).getByLabelText('Username'), { target: { value: 'chapuser' } });
    fireEvent.change(within(dialog).getByLabelText('Password'), { target: { value: 'chappw' } });
    fireEvent.click(dialogButton(dialog, 'Create'));

    await waitFor(() =>
      expect(createISCSIExport).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'chapuser', password: 'chappw' }),
      ),
    );
  });

  it('shows the error and keeps the dialog open when the export fails', async () => {
    vi.mocked(createISCSIExport).mockRejectedValue(apiError('Create failed', 'iqn exists'));
    const { dialog, refetch } = await openForm();

    await fillRequired(dialog);
    fireEvent.click(dialogButton(dialog, 'Create'));

    expect(await screen.findByText('Create failed')).toBeInTheDocument();
    expect(screen.getByText('iqn exists')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('resets the form on cancel', async () => {
    const { dialog } = await openForm();

    fillIqn(dialog);
    fireEvent.click(dialogButton(dialog, 'Cancel'));
    await expectModalClosed();

    // The closed dialog keeps its footer in the DOM; the trigger comes first.
    fireEvent.click(screen.getAllByRole('button', { name: 'Create' })[0]);
    const reopened = await openDialog();
    expect((within(reopened).getByPlaceholderText('yyyy-mm') as HTMLInputElement).value).toBe('');
  });
});
