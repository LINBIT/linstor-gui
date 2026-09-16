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

const renderForm = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
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

  it("shows the controller's errors, and a generic one on transport failure", async () => {
    vi.mocked(createBackup).mockResolvedValue({ error: [{ message: 'no snapshot support' }] } as never);
    renderForm();
    await open();
    await pickResource('res-a');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('no snapshot support')).toBeInTheDocument();

    vi.mocked(createBackup).mockRejectedValue(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
    await pickResource('res-b');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Create backup error')).toBeInTheDocument();
  });
});
