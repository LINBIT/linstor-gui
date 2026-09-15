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
  restoreSnapshot: vi.fn(),
  restoreVolumeDefinition: vi.fn(),
}));
vi.mock('@app/features/resource/api', () => ({
  getResources: vi.fn(),
}));
vi.mock('@app/features/resourceDefinition/api', () => ({
  createResourceDefinition: vi.fn(),
}));

import { restoreSnapshot, restoreVolumeDefinition } from '../../api';
import { getResources } from '@app/features/resource/api';
import { createResourceDefinition } from '@app/features/resourceDefinition/api';
import RestoreFrom from '../RestoreFrom';

const ok = { data: [{ ret_code: 1 }] };

const renderRestore = (props: Partial<React.ComponentProps<typeof RestoreFrom>> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  return render(
    <QueryClientProvider client={client}>
      <RestoreFrom sourceResource="res-a" sourceSnapshot="snap-1" {...props} />
    </QueryClientProvider>,
  );
};

const restoreButton = () => screen.getByRole('button', { name: 'Restore' });

const chooseExisting = async (name: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(await screen.findByText(name, { selector: '.ant-select-item-option-content' }));
};

// Tags mode: typing a name that is not an option and pressing Enter adds it.
const typeNew = (name: string) => {
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: name } });
  fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 });
};

describe('RestoreFrom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getResources).mockResolvedValue({
      data: [{ name: 'res-a' }, { name: 'res-b' }, { name: 'res-b' }],
    } as never);
    vi.mocked(restoreSnapshot).mockResolvedValue(ok as never);
    vi.mocked(restoreVolumeDefinition).mockResolvedValue(ok as never);
    vi.mocked(createResourceDefinition).mockResolvedValue(ok as never);
  });

  it('shows the source and keeps Restore disabled until a target is chosen', async () => {
    renderRestore();
    expect(screen.getByText('Resource: res-a')).toBeInTheDocument();
    expect(screen.getByText('Snapshot: snap-1')).toBeInTheDocument();
    expect(restoreButton()).toBeDisabled();
    await waitFor(() => expect(getResources).toHaveBeenCalled());
    await chooseExisting('res-b');
    expect(restoreButton()).toBeEnabled();
  });

  it('restores straight into an existing resource', async () => {
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await waitFor(() => expect(getResources).toHaveBeenCalled());
    await chooseExisting('res-b');
    fireEvent.click(restoreButton());

    await waitFor(() => expect(restoreSnapshot).toHaveBeenCalledWith('res-a', 'snap-1', { to_resource: 'res-b' }));
    expect(createResourceDefinition).not.toHaveBeenCalled();
    expect(restoreVolumeDefinition).not.toHaveBeenCalled();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(await screen.findByText('Restore succeeded')).toBeInTheDocument();
  });

  it('creates the definition and its volumes first for a new resource name', async () => {
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await waitFor(() => expect(getResources).toHaveBeenCalled());
    typeNew('res-fresh');
    await waitFor(() => expect(restoreButton()).toBeEnabled());
    fireEvent.click(restoreButton());

    await waitFor(() =>
      expect(createResourceDefinition).toHaveBeenCalledWith({ resource_definition: { name: 'res-fresh' } }),
    );
    await waitFor(() =>
      expect(restoreVolumeDefinition).toHaveBeenCalledWith('res-a', 'snap-1', { to_resource: 'res-fresh' }),
    );
    await waitFor(() => expect(restoreSnapshot).toHaveBeenCalledWith('res-a', 'snap-1', { to_resource: 'res-fresh' }));
    // Definition before volumes before data.
    const order = [createResourceDefinition, restoreVolumeDefinition, restoreSnapshot].map(
      (fn) => vi.mocked(fn).mock.invocationCallOrder[0],
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('stops before restoring data when the definition cannot be created', async () => {
    vi.mocked(createResourceDefinition).mockRejectedValue(new Error('exists'));
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await waitFor(() => expect(getResources).toHaveBeenCalled());
    typeNew('res-broken');
    await waitFor(() => expect(restoreButton()).toBeEnabled());
    fireEvent.click(restoreButton());

    expect(await screen.findByText('Failed to create resource definition')).toBeInTheDocument();
    expect(await screen.findByText('Restore failed')).toBeInTheDocument();
    expect(restoreVolumeDefinition).not.toHaveBeenCalled();
    expect(restoreSnapshot).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('reports a failed restore', async () => {
    vi.mocked(restoreSnapshot).mockRejectedValue(new Error('busy'));
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await waitFor(() => expect(getResources).toHaveBeenCalled());
    await chooseExisting('res-b');
    fireEvent.click(restoreButton());
    expect(await screen.findByText('Restore failed')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows Cancel only when the parent handles it', () => {
    const onCancel = vi.fn();
    const { unmount } = renderRestore();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    unmount();
    renderRestore({ onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
