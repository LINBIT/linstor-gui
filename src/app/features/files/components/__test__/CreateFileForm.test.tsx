// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  getFiles: vi.fn(),
  getFile: vi.fn(),
  createOrUpdateFile: vi.fn(),
  deleteFile: vi.fn(),
  deployFile: vi.fn(),
  undeployFile: vi.fn(),
}));
vi.mock('@app/features/resourceDefinition/api', () => ({
  getResourceDefinition: vi.fn(),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

import { createOrUpdateFile } from '../../api';
import { CreateFileForm } from '../CreateFileForm';

const renderForm = () => {
  const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CreateFileForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('CreateFileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createOrUpdateFile).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('requires a path and content', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('File path is required')).toBeInTheDocument();
    expect(screen.getByText('File content is required')).toBeInTheDocument();
    expect(createOrUpdateFile).not.toHaveBeenCalled();
  });

  it('sends the content base64-encoded under the path, then returns to the list', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText('/etc/linstor.d/my-file.conf'), {
      target: { value: '/etc/systemd/system/var-lib-x.mount' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter file content...'), {
      target: { value: '[Mount]\nWhat=/dev/drbd1000\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(createOrUpdateFile).toHaveBeenCalledWith('/etc/systemd/system/var-lib-x.mount', {
        path: '/etc/systemd/system/var-lib-x.mount',
        content: btoa('[Mount]\nWhat=/dev/drbd1000\n'),
      }),
    );
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/files'));
  });

  it('stays on the form when the request fails', async () => {
    vi.mocked(createOrUpdateFile).mockRejectedValue(new Error('denied'));
    renderForm();
    fireEvent.change(screen.getByPlaceholderText('/etc/linstor.d/my-file.conf'), { target: { value: '/etc/x' } });
    fireEvent.change(screen.getByPlaceholderText('Enter file content...'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(createOrUpdateFile).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('cancel returns to the list without saving', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(navigate).toHaveBeenCalledWith('/files');
    expect(createOrUpdateFile).not.toHaveBeenCalled();
  });
});
