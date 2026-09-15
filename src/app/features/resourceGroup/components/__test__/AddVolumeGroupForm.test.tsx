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
  const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
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

  it('renders as text inside a dropdown, as a button otherwise', () => {
    const { unmount } = renderForm({ isInDropdown: true });
    expect(screen.queryByRole('button', { name: 'Add Volume Group' })).not.toBeInTheDocument();
    expect(screen.getByText('Add Volume Group')).toBeInTheDocument();
    unmount();
    renderForm();
    expect(screen.getByRole('button', { name: 'Add Volume Group' })).toBeInTheDocument();
  });

  it('sends an empty body so LINSTOR picks the next volume number', async () => {
    const refetch = vi.fn();
    renderForm({ refetch });
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

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
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(addVolumeToResourceGroup).toHaveBeenCalledWith('rg-a', { volume_number: 7 }));
  });

  it('keeps the modal open and shows the error when the request fails', async () => {
    vi.mocked(addVolumeToResourceGroup).mockRejectedValue(new Error('volume number in use'));
    const refetch = vi.fn();
    renderForm({ refetch });
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('volume number in use')).toBeInTheDocument();
    expect(screen.getByText('Add Volume Group — rg-a')).toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();
  });
});
