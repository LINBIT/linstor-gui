// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CreateNodeForm } from '../CreateNodeForm';
import { createNode, getNodes, updateNetwork, updateNode } from '../../api';

const hoisted = vi.hoisted(() => ({ navigate: vi.fn(), params: { node: undefined as string | undefined } }));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => hoisted.navigate,
  useParams: () => hoisted.params,
}));

vi.mock('../../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api')>()),
  getNodes: vi.fn(),
  createNode: vi.fn(),
  updateNode: vi.fn(),
  updateNetwork: vi.fn(),
}));

const ok = { data: [{ ret_code: 1, message: 'ok' }] };
const failed = { data: [{ ret_code: -1, message: 'nope' }] };

const existingNode = {
  name: 'gui01',
  type: 'SATELLITE',
  net_interfaces: [
    { name: 'default', address: '10.0.0.1', satellite_port: 3366, is_active: true },
    { name: 'backup', address: '10.0.1.1', satellite_port: 3367, is_active: false },
  ],
};

const renderForm = (editing = false) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CreateNodeForm editing={editing} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const field = (label: string) => screen.getByLabelText(new RegExp(label));
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

const fillCreateForm = () => {
  fireEvent.change(field('^Name$'), { target: { value: 'gui04' } });
  fireEvent.change(field('^IP$'), { target: { value: '10.0.0.4' } });
};

describe('CreateNodeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.params.node = undefined;
    vi.mocked(getNodes).mockResolvedValue({ data: [existingNode] } as never);
    vi.mocked(createNode).mockResolvedValue(ok as never);
    vi.mocked(updateNode).mockResolvedValue(ok as never);
    vi.mocked(updateNetwork).mockResolvedValue(ok as never);
  });

  it('opens on the usual defaults for a new node', () => {
    renderForm();

    expect(field('^Name$')).toHaveValue('');
    expect(field('^Name$')).toBeEnabled();
    expect(field('^Port$')).toHaveValue(3366);
    expect(screen.getByTitle('Satellite')).toBeInTheDocument();
    expect(getNodes).not.toHaveBeenCalled();
  });

  it('creates a node with a single active PLAIN interface', async () => {
    renderForm();
    fillCreateForm();
    submit();

    await waitFor(() =>
      expect(createNode).toHaveBeenCalledWith({
        name: 'gui04',
        type: 'Satellite',
        net_interfaces: [
          {
            name: 'default',
            address: '10.0.0.4',
            satellite_port: 3366,
            satellite_encryption_type: 'PLAIN',
            is_active: true,
          },
        ],
      }),
    );
    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
  });

  it('sends the node type that was picked', async () => {
    const { container } = renderForm();
    fillCreateForm();

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as HTMLElement);
    fireEvent.click(await screen.findByTitle('Combined'));
    submit();

    await waitFor(() => expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ type: 'Combined' })));
  });

  it('refuses to submit without a name or an address', async () => {
    renderForm();
    submit();

    expect(await screen.findByText('Node name is required!')).toBeInTheDocument();
    expect(screen.getByText('IP address is required!')).toBeInTheDocument();
    expect(createNode).not.toHaveBeenCalled();
  });

  it('refuses an address that is not an IP and a port outside the range', async () => {
    renderForm();
    fireEvent.change(field('^Name$'), { target: { value: 'gui04' } });
    fireEvent.change(field('^IP$'), { target: { value: 'not-an-ip' } });
    fireEvent.change(field('^Port$'), { target: { value: '70000' } });
    submit();

    expect(await screen.findByText('Please input valid IP address')).toBeInTheDocument();
    expect(screen.getByText('Please input valid port, 0-65535')).toBeInTheDocument();
    expect(createNode).not.toHaveBeenCalled();
  });

  it('goes back without creating anything on cancel', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(hoisted.navigate).toHaveBeenCalledWith(-1);
    expect(createNode).not.toHaveBeenCalled();
  });

  it('loads the node under edit and locks its name', async () => {
    hoisted.params.node = 'gui01';
    renderForm(true);

    await waitFor(() => expect(field('^Name$')).toHaveValue('gui01'));
    expect(getNodes).toHaveBeenCalledWith({ nodes: ['gui01'] });
    // Renaming a node is not something the controller supports.
    expect(field('^Name$')).toBeDisabled();
    expect(field('^IP$')).toHaveValue('10.0.0.1');
    expect(field('^Port$')).toHaveValue(3366);
    // The API answers SATELLITE; the select offers Satellite.
    expect(screen.getByTitle('Satellite')).toBeInTheDocument();
  });

  it('updates the active interface and the node type together', async () => {
    hoisted.params.node = 'gui01';
    renderForm(true);
    await waitFor(() => expect(field('^IP$')).toHaveValue('10.0.0.1'));

    fireEvent.change(field('^IP$'), { target: { value: '10.0.0.9' } });
    submit();

    await waitFor(() =>
      expect(updateNetwork).toHaveBeenCalledWith({
        node: 'gui01',
        // The inactive "backup" interface is left alone.
        netinterface: 'default',
        body: {
          name: 'default',
          address: '10.0.0.9',
          satellite_port: 3366,
          is_active: true,
        },
      }),
    );
    expect(updateNode).toHaveBeenCalledWith({ node: 'gui01', body: { node_type: 'Satellite' } });
    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith(-1));
    expect(createNode).not.toHaveBeenCalled();
  });

  it('stays on the form when the update is rejected', async () => {
    hoisted.params.node = 'gui01';
    vi.mocked(updateNode).mockResolvedValue(failed as never);
    renderForm(true);
    await waitFor(() => expect(field('^IP$')).toHaveValue('10.0.0.1'));

    submit();

    await waitFor(() => expect(updateNode).toHaveBeenCalled());
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it('stays on the form when the interface update is rejected', async () => {
    hoisted.params.node = 'gui01';
    vi.mocked(updateNetwork).mockResolvedValue(failed as never);
    renderForm(true);
    await waitFor(() => expect(field('^IP$')).toHaveValue('10.0.0.1'));

    submit();

    await waitFor(() => expect(updateNetwork).toHaveBeenCalled());
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });
});
