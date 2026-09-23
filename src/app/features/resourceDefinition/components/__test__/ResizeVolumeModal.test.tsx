// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { message } from 'antd';

import { ResizeVolumeModal } from '../ResizeVolumeModal';
import { getVolumeDefinitionListByResource, updateVolumeDefinition } from '../../api';
import { logger } from '@app/utils/logger';
import { renderWithClient, ok } from './helpers';

vi.mock('../../api', () => ({
  getVolumeDefinitionListByResource: vi.fn(),
  updateVolumeDefinition: vi.fn(),
}));

vi.mock('@app/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const volumes = [
  { volume_number: 0, size_kib: 1024 * 1024 },
  { volume_number: 1, size_kib: 2048 },
  { volume_number: 2, size_kib: 100 },
];

const renderModal = (open = true) => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const utils = renderWithClient(
    <ResizeVolumeModal open={open} onClose={onClose} resourceName="rd1" onSuccess={onSuccess} />,
  );
  return { ...utils, onClose, onSuccess };
};

const dialog = () => screen.getByRole('dialog');
const sizes = () => within(dialog()).getAllByRole('spinbutton') as HTMLInputElement[];
const units = () => Array.from(dialog().querySelectorAll('.ant-select-selection-item')).map((el) => el.textContent);

describe('ResizeVolumeModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getVolumeDefinitionListByResource).mockResolvedValue({ data: volumes } as never);
    vi.mocked(updateVolumeDefinition).mockResolvedValue(ok as never);
  });

  afterEach(() => {
    message.destroy();
  });

  it('does not fetch while closed', () => {
    renderModal(false);
    expect(getVolumeDefinitionListByResource).not.toHaveBeenCalled();
  });

  it('shows each volume in its best unit', async () => {
    renderModal();

    expect(dialog()).toHaveTextContent('Resize rd1');
    // The values arrive one effect after the inputs, so wait for them too.
    await waitFor(() => expect(sizes().map((input) => input.value)).toEqual(['1', '2', '100']));
    expect(units()).toEqual(['GiB', 'MiB', 'KiB']);
    expect(within(dialog()).getByText('Volume 0')).toBeInTheDocument();
  });

  it('resizes only the volumes that changed and reports success', async () => {
    const { onClose, onSuccess } = renderModal();
    await waitFor(() => expect(sizes()).toHaveLength(3));

    fireEvent.change(sizes()[1], { target: { value: '4' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(updateVolumeDefinition).toHaveBeenCalledTimes(1));
    expect(updateVolumeDefinition).toHaveBeenCalledWith('rd1', 1, { size_kib: 4096 });
    expect(await screen.findByText('Operation Successful')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('sends the gross flag when asked', async () => {
    renderModal();
    await waitFor(() => expect(sizes()).toHaveLength(3));

    fireEvent.change(sizes()[0], { target: { value: '3' } });
    fireEvent.click(within(dialog()).getAllByRole('checkbox')[0]);
    fireEvent.click(within(dialog()).getByRole('button', { name: 'OK' }));

    await waitFor(() =>
      expect(updateVolumeDefinition).toHaveBeenCalledWith('rd1', 0, {
        size_kib: 3 * 1024 * 1024,
        flags: ['GROSS_SIZE'],
      }),
    );
  });

  it('requires a size for every volume', async () => {
    renderModal();
    await waitFor(() => expect(sizes()).toHaveLength(3));

    fireEvent.change(sizes()[2], { target: { value: '' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'OK' }));

    expect(await screen.findByText('Please input size')).toBeInTheDocument();
    expect(updateVolumeDefinition).not.toHaveBeenCalled();
  });

  it('logs a failed resize and stays open', async () => {
    vi.mocked(updateVolumeDefinition).mockRejectedValue(new Error('too small'));
    const { onClose } = renderModal();
    await waitFor(() => expect(sizes()).toHaveLength(3));

    fireEvent.change(sizes()[2], { target: { value: '50' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(logger.error).toHaveBeenCalledWith(expect.any(Error)));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText('Operation Successful')).toBeNull();
  });

  it('closes on cancel without resizing', async () => {
    const { onClose } = renderModal();
    await waitFor(() => expect(sizes()).toHaveLength(3));

    fireEvent.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(updateVolumeDefinition).not.toHaveBeenCalled();
  });

  it('shows an empty volume as zero KiB', async () => {
    vi.mocked(getVolumeDefinitionListByResource).mockResolvedValue({
      data: [{ volume_number: 0, size_kib: 0 }],
    } as never);
    renderModal();

    await waitFor(() => expect(sizes().map((input) => input.value)).toEqual(['0']));
    expect(units()).toEqual(['KiB']);
  });
});
