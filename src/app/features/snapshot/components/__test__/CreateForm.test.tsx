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
  createSnapshot: vi.fn(),
}));

vi.mock('@app/features/node', () => ({
  useNodes: () => ({
    data: [{ name: 'node-1' }, { name: 'node-2' }, { name: 'node-3' }],
    isLoading: false,
  }),
}));

// res-a lives diskful on node-1 and diskless on node-2; res-b on node-3 in a
// pool that cannot snapshot.
vi.mock('../../hooks', () => ({
  useResources: () => ({
    isLoading: false,
    data: [
      { name: 'res-a', node_name: 'node-1', flags: [], props: { StorPoolName: 'pool-thin' } },
      { name: 'res-a', node_name: 'node-2', flags: ['DISKLESS', 'DRBD_DISKLESS'], props: {} },
      { name: 'res-b', node_name: 'node-3', flags: [], props: { StorPoolName: 'pool-thick' } },
    ],
  }),
}));

vi.mock('@app/features/storagePool', () => ({
  getStoragePool: vi.fn(),
}));

vi.mock('@app/utils/toast', () => ({
  notifyMessages: vi.fn(),
}));

import { createSnapshot } from '../../api';
import { getStoragePool } from '@app/features/storagePool';
import { notifyMessages } from '@app/utils/toast';
import { CreateSnapshotForm } from '../CreateForm';

const renderForm = (refetch = vi.fn()) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  render(
    <QueryClientProvider client={client}>
      <CreateSnapshotForm refetch={refetch} />
    </QueryClientProvider>,
  );
  return refetch;
};

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
  await screen.findByText('Create Snapshot');
};

const pickOption = async (combobox: HTMLElement, label: string) => {
  fireEvent.mouseDown(combobox);
  fireEvent.click(await screen.findByText(label, { selector: '.ant-select-item-option-content' }));
};

// Form order: name input, resource select, nodes select.
const resourceSelect = () => screen.getAllByRole('combobox')[0];
const nodesSelect = () => screen.getAllByRole('combobox')[1];

describe('CreateSnapshotForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSnapshot).mockResolvedValue({ data: [{ ret_code: 1, message: 'created' }] } as never);
    vi.mocked(getStoragePool).mockImplementation(
      async (query: { storage_pools?: string[] }) =>
        ({
          data: [{ storage_pool_name: query.storage_pools?.[0], supports_snapshots: query.storage_pools?.[0] === 'pool-thin' }],
        }) as never,
    );
  });

  it('requires a resource', async () => {
    renderForm();
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Please select nodes!')).toBeInTheDocument();
    expect(createSnapshot).not.toHaveBeenCalled();
  });

  it('offers each resource once, and only diskful nodes of the chosen resource', async () => {
    renderForm();
    await open();

    fireEvent.mouseDown(resourceSelect());
    const resources = await screen.findAllByText(/^res-/, { selector: '.ant-select-item-option-content' });
    expect(resources.map((r) => r.textContent)).toEqual(['res-a', 'res-b']);
    fireEvent.click(resources[0]);

    fireEvent.mouseDown(nodesSelect());
    const nodes = await screen.findAllByText(/^node-/, { selector: '.ant-select-item-option-content' });
    expect(nodes.map((n) => n.textContent)).toEqual(['node-1']);
  });

  it('creates the snapshot on the resource with the picked nodes, notifies and refetches', async () => {
    const refetch = renderForm();
    await open();

    fireEvent.change(screen.getByPlaceholderText('Please input snapshot name'), { target: { value: 'snap-1' } });
    await pickOption(resourceSelect(), 'res-a');
    await waitFor(() => expect(getStoragePool).toHaveBeenCalledWith({ storage_pools: ['pool-thin'] }));
    await pickOption(nodesSelect(), 'node-1');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(createSnapshot).toHaveBeenCalledWith('res-a', { name: 'snap-1', nodes: ['node-1'] }));
    await waitFor(() => expect(notifyMessages).toHaveBeenCalledWith([{ ret_code: 1, message: 'created' }]));
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it('blocks the submit when the storage pool cannot snapshot', async () => {
    renderForm();
    await open();
    await pickOption(resourceSelect(), 'res-b');
    expect(
      await screen.findByText('The storage pool does not support snapshots, please select another resource'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    expect(getStoragePool).toHaveBeenCalledWith({ storage_pools: ['pool-thick'] });
  });

  it('reports a failed create and keeps the dialog open', async () => {
    vi.mocked(createSnapshot).mockRejectedValue(new Error('boom'));
    const refetch = renderForm();
    await open();
    fireEvent.change(screen.getByPlaceholderText('Please input snapshot name'), { target: { value: 'snap-x' } });
    await pickOption(resourceSelect(), 'res-a');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Create Snapshot Failed')).toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();
    expect(screen.getByText('Create Snapshot')).toBeInTheDocument();
  });

  it('cancel resets the fields and closes', async () => {
    renderForm();
    await open();
    fireEvent.change(screen.getByPlaceholderText('Please input snapshot name'), { target: { value: 'gone' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
    expect(createSnapshot).not.toHaveBeenCalled();
  });
});
