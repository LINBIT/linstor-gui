// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { SpawnForm } from '../SpawnForm';
import { autoPlace } from '../../api';
import { renderWithClient, expectModalClosed, ok } from './helpers';

vi.mock('../../api', () => ({
  autoPlace: vi.fn(),
}));

describe('SpawnForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(autoPlace).mockResolvedValue(ok as never);
  });

  it('places one replica by default', async () => {
    renderWithClient(<SpawnForm resource="rd1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Spawn' }));
    const dialog = await screen.findByRole('dialog');
    expect((within(dialog).getByRole('spinbutton') as HTMLInputElement).value).toBe('1');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Spawn' }));
    await waitFor(() =>
      expect(autoPlace).toHaveBeenCalledWith('rd1', {
        diskless_on_remaining: undefined,
        select_filter: { place_count: 1 },
      }),
    );
    await expectModalClosed();
  });

  it('sends the entered place count and the diskless flag', async () => {
    renderWithClient(<SpawnForm resource="rd1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Spawn' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('spinbutton'), { target: { value: '3' } });
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Diskless on remaining' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Spawn' }));

    await waitFor(() =>
      expect(autoPlace).toHaveBeenCalledWith('rd1', { diskless_on_remaining: true, select_filter: { place_count: 3 } }),
    );
  });

  it('closes on cancel without placing', async () => {
    renderWithClient(<SpawnForm resource="rd1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Spawn' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await expectModalClosed();
    expect(autoPlace).not.toHaveBeenCalled();
  });

  it('closes from the dialog corner as well', async () => {
    renderWithClient(<SpawnForm resource="rd1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Spawn' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog.closest('.ant-modal') as HTMLElement).getByRole('button', { name: 'Close' }));

    await expectModalClosed();
    expect(autoPlace).not.toHaveBeenCalled();
  });
});
