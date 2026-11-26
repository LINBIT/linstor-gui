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
  getResourceDefinition: vi.fn(),
  getVolumeDefinitionListByResource: vi.fn(),
}));

import { restoreSnapshot, restoreVolumeDefinition } from '../../api';
import { getResources } from '@app/features/resource/api';
import {
  createResourceDefinition,
  getResourceDefinition,
  getVolumeDefinitionListByResource,
} from '@app/features/resourceDefinition/api';
import RestoreFrom from '../RestoreFrom';

const ok = { data: [{ ret_code: 1 }] };

// What the controller knows about the target: resource definitions by name and
// how many volume definitions each has. res-b is deployed, so it has both.
let definitions: Record<string, number>;

const renderRestore = (props: Partial<React.ComponentProps<typeof RestoreFrom>> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

// Typing a name that is not one of the suggestions targets a new resource.
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
    definitions = { 'res-a': 1, 'res-b': 1 };
    vi.mocked(getResourceDefinition).mockImplementation(
      async (query) =>
        ({
          data: (query?.resource_definitions ?? []).filter((name) => name in definitions).map((name) => ({ name })),
        }) as never,
    );
    vi.mocked(getVolumeDefinitionListByResource).mockImplementation(
      async (name) =>
        ({ data: Array.from({ length: definitions[name] ?? 0 }, (_, volume_number) => ({ volume_number })) }) as never,
    );
  });

  const restoreTo = async (name: string) => {
    await waitFor(() => expect(getResources).toHaveBeenCalled());
    typeNew(name);
    await waitFor(() => expect(restoreButton()).toBeEnabled());
    fireEvent.click(restoreButton());
  };

  const callOrder = (...fns: unknown[]) => fns.map((fn) => vi.mocked(fn as () => unknown).mock.invocationCallOrder[0]);

  it('shows the source and keeps Restore disabled until a target is chosen', async () => {
    renderRestore();
    expect(screen.getByText('Resource: res-a')).toBeInTheDocument();
    expect(screen.getByText('Snapshot: snap-1')).toBeInTheDocument();
    expect(restoreButton()).toBeDisabled();
    await waitFor(() => expect(getResources).toHaveBeenCalled());
    await chooseExisting('res-b');
    expect(restoreButton()).toBeEnabled();
  });

  it('picking the same suggestion again keeps it chosen', async () => {
    renderRestore();
    await waitFor(() => expect(getResources).toHaveBeenCalled());
    await chooseExisting('res-b');
    await chooseExisting('res-b');
    expect(screen.getByRole('combobox')).toHaveValue('res-b');
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

    expect(await screen.findByText('Restore failed: exists')).toBeInTheDocument();
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
    expect(await screen.findByText('Restore failed: busy')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('treats an error reply as a failure, not as a restore (openapi-fetch does not throw)', async () => {
    vi.mocked(createResourceDefinition).mockResolvedValue({
      error: [{ ret_code: -1, message: 'name taken' }],
    } as never);
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await waitFor(() => expect(getResources).toHaveBeenCalled());
    typeNew('res-taken');
    await waitFor(() => expect(restoreButton()).toBeEnabled());
    fireEvent.click(restoreButton());
    expect(await screen.findByText('Restore failed: name taken')).toBeInTheDocument();
    expect(restoreVolumeDefinition).not.toHaveBeenCalled();
    expect(restoreSnapshot).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('continues a restore whose definition exists without volumes (volume definition restore failed)', async () => {
    definitions['res-half'] = 0;
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await restoreTo('res-half');

    await waitFor(() => expect(restoreSnapshot).toHaveBeenCalledWith('res-a', 'snap-1', { to_resource: 'res-half' }));
    expect(getResourceDefinition).toHaveBeenCalledWith({ resource_definitions: ['res-half'] });
    expect(createResourceDefinition).not.toHaveBeenCalled();
    expect(restoreVolumeDefinition).toHaveBeenCalledWith('res-a', 'snap-1', { to_resource: 'res-half' });
    const order = callOrder(restoreVolumeDefinition, restoreSnapshot);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('only restores the data into a definition that has its volumes but no resources', async () => {
    definitions['res-undeployed'] = 2;
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await restoreTo('res-undeployed');

    await waitFor(() =>
      expect(restoreSnapshot).toHaveBeenCalledWith('res-a', 'snap-1', { to_resource: 'res-undeployed' }),
    );
    expect(createResourceDefinition).not.toHaveBeenCalled();
    expect(restoreVolumeDefinition).not.toHaveBeenCalled();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('a retry after a failed volume definition restore finishes the restore', async () => {
    vi.mocked(createResourceDefinition).mockImplementation(async (body) => {
      definitions[body.resource_definition.name] = 0;
      return ok as never;
    });
    vi.mocked(restoreVolumeDefinition).mockResolvedValueOnce({
      error: [{ ret_code: -1, message: 'no space' }],
    } as never);
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await restoreTo('res-retry');
    expect(await screen.findByText('Restore failed: no space')).toBeInTheDocument();
    expect(restoreSnapshot).not.toHaveBeenCalled();

    fireEvent.click(restoreButton());
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(createResourceDefinition).toHaveBeenCalledTimes(1);
    expect(restoreVolumeDefinition).toHaveBeenCalledTimes(2);
    expect(restoreSnapshot).toHaveBeenCalledTimes(1);
    expect(restoreSnapshot).toHaveBeenCalledWith('res-a', 'snap-1', { to_resource: 'res-retry' });
  });

  it('stops before restoring data when the volume definitions cannot be restored', async () => {
    vi.mocked(restoreVolumeDefinition).mockResolvedValue({
      error: [{ ret_code: -1, message: 'no space' }],
    } as never);
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await restoreTo('res-fresh');
    expect(await screen.findByText('Restore failed: no space')).toBeInTheDocument();
    expect(createResourceDefinition).toHaveBeenCalled();
    expect(restoreSnapshot).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('restores nothing when the target cannot be looked up', async () => {
    vi.mocked(getResourceDefinition).mockResolvedValue({
      error: [{ ret_code: -1, message: 'controller offline' }],
    } as never);
    const onSuccess = vi.fn();
    renderRestore({ onSuccess });
    await restoreTo('res-fresh');
    expect(await screen.findByText('Restore failed: controller offline')).toBeInTheDocument();
    expect(createResourceDefinition).not.toHaveBeenCalled();
    expect(restoreVolumeDefinition).not.toHaveBeenCalled();
    expect(restoreSnapshot).not.toHaveBeenCalled();
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
