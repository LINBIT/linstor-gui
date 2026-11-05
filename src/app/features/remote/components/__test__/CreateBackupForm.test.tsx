// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  createBackup: vi.fn(),
}));
vi.mock('@app/features/resource', () => ({
  getResources: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ remote_name: 's3-a' }),
}));

import { createBackup } from '../../api';
import { getResources } from '@app/features/resource';
import { CreateBackupForm } from '../CreateBackupForm';
import { captureConsoleError } from '@app/testing/console';

const renderForm = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const refetch = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <CreateBackupForm refetch={refetch} />
    </QueryClientProvider>,
  );
  return refetch;
};

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
  await screen.findByText('Create');
};

const pickResource = async (name: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(await screen.findByText(name, { selector: '.ant-select-item-option-content' }));
};

describe('CreateBackupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The same resource on two nodes must show once.
    vi.mocked(getResources).mockResolvedValue({
      data: [{ name: 'res-a' }, { name: 'res-a' }, { name: 'res-b' }],
    } as never);
    vi.mocked(createBackup).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('requires a resource', async () => {
    const refetch = renderForm();
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Please select a resource')).toBeInTheDocument();
    expect(createBackup).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('opens again without the resource picked before it was cancelled', async () => {
    renderForm();
    await open();
    await pickResource('res-b');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Please select a resource')).toBeInTheDocument();
    expect(createBackup).not.toHaveBeenCalled();
  });

  it('offers each resource once and backs it up incrementally by default', async () => {
    const refetch = renderForm();
    await open();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const options = await screen.findAllByText(/^res-/, { selector: '.ant-select-item-option-content' });
    expect(options.map((o) => o.textContent)).toEqual(['res-a', 'res-b']);
    fireEvent.click(options[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(createBackup).toHaveBeenCalledWith('s3-a', { rsc_name: 'res-b', incremental: true }));
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it('sends a full backup when incremental is switched off', async () => {
    renderForm();
    await open();
    await pickResource('res-a');
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(createBackup).toHaveBeenCalledWith('s3-a', { rsc_name: 'res-a', incremental: false }));
  });

  it('keeps the dialog when the controller refuses, and reports a transport failure itself', async () => {
    vi.mocked(createBackup).mockResolvedValue({ error: [{ ret_code: -1, message: 'no snapshot support' }] } as never);
    const refetch = renderForm();
    await open();
    await pickResource('res-a');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(createBackup).toHaveBeenCalledTimes(1));
    // The request layer showed the controller's reason; the form adds no second toast.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).not.toHaveClass('ant-btn-loading'));
    expect(screen.queryByText('no snapshot support')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();

    vi.mocked(createBackup).mockRejectedValue(new Error('offline'));
    const errors = captureConsoleError();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Create backup error')).toBeInTheDocument();
    expect(errors).toHaveBeenCalledWith('create backup error', expect.any(Error));
    expect(refetch).not.toHaveBeenCalled();
  });
});
