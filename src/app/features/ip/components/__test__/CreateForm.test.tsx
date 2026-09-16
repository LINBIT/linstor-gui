// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  createNetWorkInterface: vi.fn(),
  updateNetWorkInterface: vi.fn(),
  deleteNetWorkInterface: vi.fn(),
  getNetWorkInterfaceByNode: vi.fn(),
}));
vi.mock('@app/features/requests', () => ({
  fullySuccess: (res?: { ret_code: number }[]) => !!res && res.every((r) => r.ret_code > 0),
}));

import { createNetWorkInterface } from '../../api';
import { CreateForm } from '../CreateForm';

const renderForm = () => {
  const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
  const refetch = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <CreateForm node="node-1" refetch={refetch} />
    </QueryClientProvider>,
  );
  return refetch;
};

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add Network Interface' }));
  await screen.findByText('Create network interface');
};
const type = (placeholder: string, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
const confirm = () => fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

const expectModalClosed = () =>
  waitFor(() => {
    const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
    expect(!wrap || wrap.style.display === 'none').toBe(true);
  });

describe('network interface CreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createNetWorkInterface).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('rejects a malformed address and an out-of-range port', async () => {
    renderForm();
    await open();
    type('Please input alias', 'eth1');
    type('Please input IP address', '10.0.0');
    type('Please input TCP port', '70000');
    confirm();
    expect(await screen.findByText('Please input valid IP address')).toBeInTheDocument();
    expect(screen.getByText('Please input valid port, 0-65535')).toBeInTheDocument();
    expect(createNetWorkInterface).not.toHaveBeenCalled();
  });

  it('creates the interface with the default port and encryption, honouring "Default IP", then closes and refreshes', async () => {
    const refetch = renderForm();
    await open();
    type('Please input alias', 'eth1');
    type('Please input IP address', '10.0.0.5');
    fireEvent.click(screen.getByRole('checkbox'));
    confirm();

    await waitFor(() =>
      expect(createNetWorkInterface).toHaveBeenCalledWith('node-1', {
        name: 'eth1',
        address: '10.0.0.5',
        satellite_port: 3366,
        satellite_encryption_type: 'PLAIN',
        is_active: true,
      }),
    );
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    await expectModalClosed();
  });

  it('SSL and a custom port travel with the body', async () => {
    renderForm();
    await open();
    type('Please input alias', 'eth2');
    type('Please input IP address', '10.0.0.6');
    type('Please input TCP port', '3367');
    fireEvent.click(screen.getByText('SSL'));
    confirm();
    await waitFor(() =>
      expect(createNetWorkInterface).toHaveBeenCalledWith(
        'node-1',
        expect.objectContaining({ satellite_port: '3367', satellite_encryption_type: 'SSL', is_active: false }),
      ),
    );
  });

  it('stays open without refreshing when the controller refuses', async () => {
    vi.mocked(createNetWorkInterface).mockResolvedValue({ data: [{ ret_code: -1, message: 'dup' }] } as never);
    const refetch = renderForm();
    await open();
    type('Please input alias', 'eth1');
    type('Please input IP address', '10.0.0.5');
    confirm();
    await waitFor(() => expect(createNetWorkInterface).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(refetch).not.toHaveBeenCalled();
    expect(screen.getByText('Create network interface')).toBeInTheDocument();
  });

  it('cancel closes without creating', async () => {
    renderForm();
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expectModalClosed();
    expect(createNetWorkInterface).not.toHaveBeenCalled();
  });
});
