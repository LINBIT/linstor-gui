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
  createVolumeDefinition: vi.fn(),
  getResourceDefinition: vi.fn(),
  getVolumeDefinitionListByResource: vi.fn(),
}));

import { createVolumeDefinition, getResourceDefinition, getVolumeDefinitionListByResource } from '../../api';
import { CreateForm } from '../CreateForm';

const GIB = 1024 * 1024;

const renderForm = (props: Partial<React.ComponentProps<typeof CreateForm>> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  const refetch = vi.fn();
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <CreateForm refetch={refetch} {...props} />
    </QueryClientProvider>,
  );
  return { refetch, unmount };
};

const openModal = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  await screen.findByText('Create Volume Definition');
};

const pickResource = async (name: string) => {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
  fireEvent.click(await screen.findByText(name, { selector: '.ant-select-item-option-content' }));
};

const expectModalClosed = () =>
  waitFor(() => {
    const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
    expect(!wrap || wrap.style.display === 'none').toBe(true);
  });

describe('volume definition CreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getResourceDefinition).mockResolvedValue({ data: [{ name: 'res-a' }, { name: 'res-b' }] } as never);
    vi.mocked(getVolumeDefinitionListByResource).mockResolvedValue({ data: [] } as never);
    vi.mocked(createVolumeDefinition).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('renders a button, or plain text in simple mode', () => {
    const { unmount } = renderForm();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    unmount();
    renderForm({ simple: true });
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    expect(screen.getByText('Create Volume Definition')).toBeInTheDocument();
  });

  it('offers the resource definitions from the api', async () => {
    renderForm();
    await openModal();
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    const options = await screen.findAllByText(/^res-/, { selector: '.ant-select-item-option-content' });
    expect(options.map((o) => o.textContent)).toEqual(['res-a', 'res-b']);
  });

  it('refuses to spawn without a resource definition and a size', async () => {
    const { refetch } = renderForm();
    await openModal();
    fireEvent.click(screen.getByRole('button', { name: 'Spawn' }));
    expect(await screen.findByText('Please select resource definition!')).toBeInTheDocument();
    expect(screen.getByText('Please input size!')).toBeInTheDocument();
    expect(createVolumeDefinition).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('creates the volume with the size in KiB, then refreshes and closes', async () => {
    const { refetch } = renderForm();
    await openModal();
    await pickResource('res-b');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Spawn' }));

    await waitFor(() =>
      expect(createVolumeDefinition).toHaveBeenCalledWith('res-b', { volume_definition: { size_kib: 2 * GIB } }),
    );
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    await expectModalClosed();
  });

  it('stays open without refreshing when the create fails', async () => {
    vi.mocked(createVolumeDefinition).mockRejectedValue(new Error('no space'));
    const { refetch } = renderForm();
    await openModal();
    await pickResource('res-a');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Spawn' }));

    await waitFor(() => expect(createVolumeDefinition).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(refetch).not.toHaveBeenCalled();
    expect(screen.getByText('Create Volume Definition')).toBeInTheDocument();
  });

  it('cancel closes without creating', async () => {
    renderForm();
    await openModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expectModalClosed();
    expect(createVolumeDefinition).not.toHaveBeenCalled();
  });
});
