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
  rollbackSnapshot: vi.fn(),
}));

import { rollbackSnapshot } from '../../api';
import { RollbackSnapshotForm } from '../RollbackForm';

const renderForm = (props: Partial<React.ComponentProps<typeof RollbackSnapshotForm>> = {}) => {
  const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <RollbackSnapshotForm
        visible
        resource="res-a"
        snapshot="snap-1"
        onClose={onClose}
        onSuccess={onSuccess}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onClose, onSuccess };
};

describe('RollbackSnapshotForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rollbackSnapshot).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('names the resource and snapshot and spells out both warnings', () => {
    renderForm();
    expect(screen.getByText('Rollback Snapshot')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to rollback resource res-a to snapshot snap-1?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Any data changes after the snapshot was created will be lost/)).toBeInTheDocument();
    expect(screen.getByText(/must not be mounted on any nodes/)).toBeInTheDocument();
  });

  it('renders nothing while hidden', () => {
    renderForm({ visible: false });
    expect(screen.queryByText('Rollback Snapshot')).not.toBeInTheDocument();
  });

  it('rolls back, then reports success and closes', async () => {
    const { onClose, onSuccess } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Rollback' }));
    await waitFor(() => expect(rollbackSnapshot).toHaveBeenCalledWith('res-a', 'snap-1'));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('stays open and re-enables the button when the rollback fails', async () => {
    vi.mocked(rollbackSnapshot).mockRejectedValue(new Error('in use'));
    const { onClose, onSuccess } = renderForm();
    const button = screen.getByRole('button', { name: 'Rollback' });
    fireEvent.click(button);
    await waitFor(() => expect(rollbackSnapshot).toHaveBeenCalled());
    await waitFor(() => expect(button.querySelector('.ant-btn-loading-icon')).toBeNull());
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cancel just closes', () => {
    const { onClose } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(rollbackSnapshot).not.toHaveBeenCalled();
  });
});
