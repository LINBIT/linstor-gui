// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  addVolumeToResourceGroup: vi.fn(),
}));

import { addVolumeToResourceGroup } from '../../api';
import { AddVolumeGroupForm } from '../AddVolumeGroupForm';

const renderForm = (props: Partial<React.ComponentProps<typeof AddVolumeGroupForm>> = {}) => {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <AddVolumeGroupForm resource_group="rg-a" {...props} />
    </QueryClientProvider>,
  );
};

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add Volume Group' }));
  await screen.findByText('Add Volume Group — rg-a');
};

describe('AddVolumeGroupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addVolumeToResourceGroup).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('renders no button when its caller opens it, and a button otherwise', () => {
    const { unmount } = renderForm({ open: false, onOpenChange: vi.fn() });
    expect(screen.queryByRole('button', { name: 'Add Volume Group' })).not.toBeInTheDocument();
    unmount();
    renderForm();
    expect(screen.getByRole('button', { name: 'Add Volume Group' })).toBeInTheDocument();
  });

  it('sends an empty body so LINSTOR picks the next volume number', async () => {
    const refetch = vi.fn();
    renderForm({ refetch });
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(addVolumeToResourceGroup).toHaveBeenCalledWith('rg-a', {}));
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
  });

  it('sends the volume number when one is typed', async () => {
    renderForm();
    await open();
    fireEvent.change(screen.getByPlaceholderText('Auto'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(addVolumeToResourceGroup).toHaveBeenCalledWith('rg-a', { volume_number: 7 }));
  });

  it('a refused volume group keeps the dialog open with the number typed, and is not reported as added', async () => {
    vi.mocked(addVolumeToResourceGroup).mockResolvedValueOnce({
      error: [{ ret_code: -4611686018427387904, message: 'volume number in use' }],
      response: new Response(null, { status: 409 }),
    } as never);
    const refetch = vi.fn();
    renderForm({ refetch });
    await open();
    fireEvent.change(screen.getByPlaceholderText('Auto'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).not.toHaveClass('ant-btn-loading'));
    // Still visible while a close animates, so wait for a close that must not come.
    await expect(
      waitFor(
        () => {
          const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
          expect(!wrap || wrap.style.display === 'none').toBe(true);
        },
        { timeout: 500 },
      ),
    ).rejects.toThrow();
    expect(screen.getByPlaceholderText('Auto')).toHaveValue('7');
    expect(screen.queryByText('Volume group added')).not.toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('opened by its caller, Cancel asks the caller to close it', async () => {
    const onOpenChange = vi.fn();
    renderForm({ open: true, onOpenChange });

    await screen.findByText('Add Volume Group — rg-a');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(addVolumeToResourceGroup).not.toHaveBeenCalled();
  });

  it('closes from the dialog corner as well', async () => {
    renderForm();
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
  });
});
