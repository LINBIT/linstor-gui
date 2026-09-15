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
  spawnResourceGroup: vi.fn(),
  getResourceGroups: vi.fn(),
  getResourceGroupVolumeGroups: vi.fn(),
}));

import { spawnResourceGroup, getResourceGroups, getResourceGroupVolumeGroups } from '../../api';
import { SpawnForm } from '../SpawnForm';

const GIB = 1024 * 1024;

const renderSpawn = (props: React.ComponentProps<typeof SpawnForm> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  return render(
    <QueryClientProvider client={client}>
      <SpawnForm {...props} />
    </QueryClientProvider>,
  );
};

const openModal = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Spawn' }));
  await screen.findByPlaceholderText('Please input resource name');
};

// The trigger and the modal footer both say "Spawn"; the footer one is last.
const footerSpawn = () => screen.getAllByRole('button', { name: 'Spawn' }).at(-1) as HTMLElement;

// antd keeps a closed Modal in the DOM, hidden; "closed" means the wrap is
// display:none (or gone entirely).
const expectModalClosed = () =>
  waitFor(() => {
    const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
    expect(!wrap || wrap.style.display === 'none').toBe(true);
  });

describe('SpawnForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spawnResourceGroup).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(getResourceGroups).mockResolvedValue({ data: [{ name: 'rg-a' }, { name: 'rg-b' }] } as never);
    vi.mocked(getResourceGroupVolumeGroups).mockResolvedValue({ data: [{ volume_number: 0 }] } as never);
  });

  it('renders as a plain text entry inside a dropdown', () => {
    renderSpawn({ resource_group: 'rg-a', isInDropdown: true });
    expect(screen.queryByRole('button', { name: 'Spawn' })).not.toBeInTheDocument();
    expect(screen.getByText('Spawn')).toBeInTheDocument();
  });

  it('keeps the spawn button disabled until name and size are filled', async () => {
    renderSpawn({ resource_group: 'rg-a' });
    await openModal();
    expect(footerSpawn()).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Please input resource name'), { target: { value: 'res-1' } });
    await waitFor(() => expect(footerSpawn()).toBeDisabled());

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1' } });
    await waitFor(() => expect(footerSpawn()).toBeEnabled());
  });

  it('spawns one volume with the size converted to KiB (values entered back to back)', async () => {
    // No await between the two changes: the first validation run (name only,
    // rejects) must not overwrite the second (both set, resolves).
    renderSpawn({ resource_group: 'rg-a' });
    await openModal();
    expect(screen.queryByText('Partial')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Please input resource name'), { target: { value: 'res-1' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
    await waitFor(() => expect(footerSpawn()).toBeEnabled());
    fireEvent.click(footerSpawn());

    await waitFor(() =>
      expect(spawnResourceGroup).toHaveBeenCalledWith('rg-a', {
        resource_definition_name: 'res-1',
        resource_definition_external_name: undefined,
        volume_sizes: [4 * GIB],
        definitions_only: undefined,
        partial: false,
      }),
    );
    await expectModalClosed();
  });

  it('asks for one size per volume group and sends them in order', async () => {
    vi.mocked(getResourceGroupVolumeGroups).mockResolvedValue({
      data: [{ volume_number: 0 }, { volume_number: 1 }],
    } as never);
    renderSpawn({ resource_group: 'rg-a' });
    await openModal();

    expect(await screen.findByText('Volume 1 Size')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Please input resource name'), { target: { value: 'res-2' } });
    const [size0, size1] = screen.getAllByRole('spinbutton');
    fireEvent.change(size0, { target: { value: '1' } });
    // Without partial, both sizes are required.
    await waitFor(() => expect(footerSpawn()).toBeDisabled());
    fireEvent.change(size1, { target: { value: '2' } });
    await waitFor(() => expect(footerSpawn()).toBeEnabled());
    fireEvent.click(footerSpawn());

    await waitFor(() =>
      expect(spawnResourceGroup).toHaveBeenCalledWith(
        'rg-a',
        expect.objectContaining({ volume_sizes: [1 * GIB, 2 * GIB], partial: false }),
      ),
    );
  });

  it('with partial, only the first size is required and only filled sizes are sent', async () => {
    vi.mocked(getResourceGroupVolumeGroups).mockResolvedValue({
      data: [{ volume_number: 0 }, { volume_number: 1 }, { volume_number: 2 }],
    } as never);
    renderSpawn({ resource_group: 'rg-a' });
    await openModal();
    await screen.findByText('Volume 2 Size');

    fireEvent.change(screen.getByPlaceholderText('Please input resource name'), { target: { value: 'res-3' } });
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '1' } });
    // Partial is the first checkbox (Definition only is the second).
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => expect(footerSpawn()).toBeEnabled());
    fireEvent.click(footerSpawn());

    await waitFor(() =>
      expect(spawnResourceGroup).toHaveBeenCalledWith(
        'rg-a',
        expect.objectContaining({ volume_sizes: [1 * GIB], partial: true }),
      ),
    );
  });

  it('sends definitions_only when ticked', async () => {
    renderSpawn({ resource_group: 'rg-a' });
    await openModal();
    fireEvent.change(screen.getByPlaceholderText('Please input resource name'), { target: { value: 'res-4' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(footerSpawn()).toBeEnabled());
    fireEvent.click(footerSpawn());
    await waitFor(() =>
      expect(spawnResourceGroup).toHaveBeenCalledWith('rg-a', expect.objectContaining({ definitions_only: true })),
    );
  });

  it('lets the user pick the resource group when the caller fixes none', async () => {
    renderSpawn();
    await openModal();
    await waitFor(() => expect(getResourceGroups).toHaveBeenCalled());
    // No group picked yet, so no volume-group lookup either.
    expect(getResourceGroupVolumeGroups).not.toHaveBeenCalled();

    // The unit picker inside SizeInput is a combobox too; the group select comes first.
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByText('rg-b', { selector: '.ant-select-item-option-content' }));
    await waitFor(() => expect(getResourceGroupVolumeGroups).toHaveBeenCalledWith('rg-b'));

    fireEvent.change(screen.getByPlaceholderText('Please input resource name'), { target: { value: 'res-5' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1' } });
    await waitFor(() => expect(footerSpawn()).toBeEnabled());
    fireEvent.click(footerSpawn());
    await waitFor(() => expect(spawnResourceGroup).toHaveBeenCalledWith('rg-b', expect.anything()));
  });

  it('cancel closes without spawning', async () => {
    renderSpawn({ resource_group: 'rg-a' });
    await openModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expectModalClosed();
    expect(spawnResourceGroup).not.toHaveBeenCalled();
  });
});
