// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CloneModal } from '../Clone';

const { cloneResourceDefinition } = vi.hoisted(() => ({ cloneResourceDefinition: vi.fn() }));

vi.mock('@app/features/resourceDefinition', () => ({ cloneResourceDefinition }));

// What openapi-fetch resolves with: a reply and its status.
const reply = (status: number, body: unknown) => ({
  data: status < 400 ? body : undefined,
  error: status < 400 ? undefined : body,
  response: new Response(null, { status }),
});

const renderModal = (props: Partial<React.ComponentProps<typeof CloneModal>> = {}) => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <CloneModal open resource="demo" onClose={onClose} onSuccess={onSuccess} {...props} />
    </QueryClientProvider>,
  );
  return { onClose, onSuccess };
};

const cloneAs = (name: string) => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Clone' }));
};

describe('CloneModal', () => {
  beforeEach(() => {
    cloneResourceDefinition.mockReset();
  });

  it('clones the definition under the new name, then closes and refreshes the list', async () => {
    cloneResourceDefinition.mockResolvedValue(reply(201, [{ ret_code: 1, message: 'cloned' }]));
    const { onClose, onSuccess } = renderModal();

    cloneAs('demo-clone');

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(cloneResourceDefinition).toHaveBeenCalledWith('demo', { name: 'demo-clone', use_zfs_clone: undefined });
    expect(onClose).toHaveBeenCalled();
  });

  it('stays open when the controller refuses the clone', async () => {
    cloneResourceDefinition.mockResolvedValue(reply(500, [{ ret_code: -1, message: 'name taken' }]));
    const { onClose, onSuccess } = renderModal();

    cloneAs('demo');

    await waitFor(() => expect(cloneResourceDefinition).toHaveBeenCalled());
    // Let the rejected mutation settle before asserting nothing followed it.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Clone' })).not.toHaveClass('ant-btn-loading'));
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveValue('demo');
  });

  it('offers a ZFS clone only for a definition on ZFS', () => {
    renderModal({ isUsingZFS: false });
    expect(screen.getByRole('checkbox', { name: 'Use ZFS Clone' })).toBeDisabled();
  });

  it('closes on cancel without cloning', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(cloneResourceDefinition).not.toHaveBeenCalled();
  });
});
