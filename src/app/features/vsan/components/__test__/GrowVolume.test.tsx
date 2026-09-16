// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { GrowVolume } from '../GrowVolume';
import { getResourceGroups, resizeTarget } from '../../api';
import { renderWithClient, expectModalClosed, openDialog, dialogButton, apiError } from './helpers';

vi.mock('../../api', () => ({
  getResourceGroups: vi.fn(),
  resizeTarget: vi.fn(),
}));

const GIB = 1024 * 1024;

const renderGrow = () => {
  const refetch = vi.fn();
  const utils = renderWithClient(
    <GrowVolume resource="res1" resource_group="rg1" current_kib={GIB} refetch={refetch} />,
  );
  return { ...utils, refetch };
};

const sizeInput = (dialog: HTMLElement) => within(dialog).getByRole('spinbutton') as HTMLInputElement;

describe('GrowVolume', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getResourceGroups).mockResolvedValue({ data: [{ name: 'rg1', max_volume_size: 10 * GIB }] } as never);
  });

  it('opens with the current size in KiB and resizes to the entered value', async () => {
    vi.mocked(resizeTarget).mockResolvedValue({} as never);
    const { refetch } = renderGrow();

    fireEvent.click(screen.getByRole('button', { name: 'Grow' }));
    const dialog = await openDialog();
    expect(dialog).toHaveTextContent('Grow volume');
    expect(sizeInput(dialog).value).toBe(String(GIB));

    fireEvent.change(sizeInput(dialog), { target: { value: String(2 * GIB) } });
    fireEvent.click(dialogButton(dialog, 'Grow'));

    await waitFor(() => expect(resizeTarget).toHaveBeenCalledWith('res1', { size: 2 * GIB }));
    expect(await screen.findByText('Resize volume successfully')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
    await expectModalClosed();
  });

  it('fills in the largest possible size when "Use all available" is ticked', async () => {
    vi.mocked(resizeTarget).mockResolvedValue({} as never);
    renderGrow();

    fireEvent.click(screen.getByRole('button', { name: 'Grow' }));
    const dialog = await openDialog();
    await waitFor(() => expect(getResourceGroups).toHaveBeenCalled());

    fireEvent.click(within(dialog).getByRole('checkbox'));

    await waitFor(() => expect(sizeInput(dialog).value).toBe(String(10 * GIB - 64 * 1024)));
    expect(sizeInput(dialog)).toBeDisabled();

    fireEvent.click(dialogButton(dialog, 'Grow'));
    await waitFor(() => expect(resizeTarget).toHaveBeenCalledWith('res1', { size: 10 * GIB - 64 * 1024 }));
  });

  it('shows the error and stays open when the resize fails', async () => {
    vi.mocked(resizeTarget).mockRejectedValue(apiError('Resize failed', 'no space'));
    const { refetch } = renderGrow();

    fireEvent.click(screen.getByRole('button', { name: 'Grow' }));
    const dialog = await openDialog();
    fireEvent.click(dialogButton(dialog, 'Grow'));

    expect(await screen.findByText('Resize failed')).toBeInTheDocument();
    expect(screen.getByText('no space')).toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('closes without resizing on cancel', async () => {
    renderGrow();

    fireEvent.click(screen.getByRole('button', { name: 'Grow' }));
    const dialog = await openDialog();
    fireEvent.click(dialogButton(dialog, 'Cancel'));

    await expectModalClosed();
    expect(resizeTarget).not.toHaveBeenCalled();
  });
});
