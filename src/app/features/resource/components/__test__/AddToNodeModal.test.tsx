// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  createResourceOnNode: vi.fn(),
}));
vi.mock('@app/features/node/api', () => ({
  getNodes: vi.fn(),
}));
const useStoragePools = vi.fn();
vi.mock('@app/features/storagePool', () => ({
  useStoragePools: (query?: unknown) => useStoragePools(query),
}));

import { createResourceOnNode } from '../../api';
import { getNodes } from '@app/features/node/api';
import { AddToNodeModal } from '../AddToNodeModal';

const renderModal = (props: Partial<React.ComponentProps<typeof AddToNodeModal>> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <AddToNodeModal
        open
        resourceName="res-a"
        usedNodes={['node-1', 'node-2']}
        onClose={onClose}
        onSuccess={onSuccess}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onClose, onSuccess };
};

const pick = async (combobox: HTMLElement, label: string) => {
  fireEvent.mouseDown(combobox);
  fireEvent.click(await screen.findByText(label, { selector: '.ant-select-item-option-content' }));
};

describe('AddToNodeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getNodes).mockResolvedValue({
      data: [{ name: 'node-1' }, { name: 'node-2' }, { name: 'node-3' }, { name: 'node-4' }],
    } as never);
    useStoragePools.mockImplementation((query?: { nodes?: string[] }) => ({
      isLoading: false,
      data: query?.nodes
        ? [
            { storage_pool_name: 'pool-a', node_name: query.nodes[0], provider_kind: 'LVM_THIN' },
            { storage_pool_name: 'pool-a', node_name: query.nodes[0], provider_kind: 'LVM_THIN' },
            { storage_pool_name: 'DfltDisklessStorPool', node_name: query.nodes[0], provider_kind: 'DISKLESS' },
          ]
        : [],
    }));
    vi.mocked(createResourceOnNode).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('offers only nodes that do not carry the resource yet', async () => {
    renderModal();
    expect(await screen.findByText('Add Resource to Node - res-a')).toBeInTheDocument();
    await waitFor(() => expect(getNodes).toHaveBeenCalled());
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    const nodes = await screen.findAllByText(/^node-/, { selector: '.ant-select-item-option-content' });
    expect(nodes.map((n) => n.textContent)).toEqual(['node-3', 'node-4']);
  });

  it('requires a node', async () => {
    const { onClose } = renderModal();
    await screen.findByText('Add Resource to Node - res-a');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Please select a node')).toBeInTheDocument();
    expect(createResourceOnNode).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("lists the chosen node's pools without the diskless one, then creates diskful on that pool", async () => {
    const { onClose, onSuccess } = renderModal();
    await screen.findByText('Add Resource to Node - res-a');
    await waitFor(() => expect(getNodes).toHaveBeenCalled());
    const [nodeSelect] = screen.getAllByRole('combobox');
    await pick(nodeSelect, 'node-3');
    await waitFor(() => expect(useStoragePools).toHaveBeenCalledWith({ nodes: ['node-3'] }));

    const poolSelect = screen.getAllByRole('combobox')[1];
    fireEvent.mouseDown(poolSelect);
    const pools = await screen.findAllByText(/pool/i, { selector: '.ant-select-item-option-content' });
    expect(pools.map((p) => p.textContent)).toEqual(['pool-a']);
    fireEvent.click(pools[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(createResourceOnNode).toHaveBeenCalledWith('res-a', 'node-3', false, 'pool-a'));
    expect(await screen.findByText('Success')).toBeInTheDocument();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalled();
  });

  it('DRBD diskless hides the pool and sends the flag', async () => {
    renderModal();
    await screen.findByText('Add Resource to Node - res-a');
    await waitFor(() => expect(getNodes).toHaveBeenCalled());
    await pick(screen.getAllByRole('combobox')[0], 'node-4');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(createResourceOnNode).toHaveBeenCalledWith('res-a', 'node-4', true, undefined));
  });

  it('cancel closes without creating', async () => {
    const { onClose } = renderModal();
    await screen.findByText('Add Resource to Node - res-a');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(createResourceOnNode).not.toHaveBeenCalled();
  });
});
