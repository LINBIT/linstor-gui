// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within, act } from '@testing-library/react';

import { VSANNodeList } from '../VSANNodeList';
import { getNodesFromVSAN, getCloudStackNodes, setNodeStandBy, setNodeMaintenance } from '../../api';
import { UIMode } from '@app/models/setting';
import { renderWithClient, confirmPopover, tableRows, rowByText, apiError } from './helpers';

vi.mock('../../api', () => ({
  getNodesFromVSAN: vi.fn(),
  getCloudStackNodes: vi.fn(),
  setNodeStandBy: vi.fn(),
  setNodeMaintenance: vi.fn(),
}));

const hoisted = vi.hoisted(() => ({ mode: 'VSAN' as string, navigate: vi.fn() }));

vi.mock('react-redux', () => ({
  useSelector: (selector: (s: unknown) => unknown) => selector({ setting: { mode: hoisted.mode } }),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => hoisted.navigate,
}));

type Listener = (event: { data?: string }) => void;

class FakeSocket {
  static instances: FakeSocket[] = [];
  url: string;
  private listeners: Record<string, Listener[]> = {};
  constructor(url: string) {
    this.url = url;
    FakeSocket.instances.push(this);
  }
  addEventListener(type: string, listener: Listener) {
    (this.listeners[type] ||= []).push(listener);
  }
  emit(type: string, event: { data?: string } = {}) {
    act(() => {
      this.listeners[type]?.forEach((listener) => listener(event));
    });
  }
  message(payload: Record<string, unknown>) {
    this.emit('message', { data: JSON.stringify(payload) });
  }
}

const vsanNodes = [
  { hostname: 'n1', service_ip: '10.0.0.1', online: true, standby: false, has_linstor_controller: true },
  { hostname: 'n2', service_ip: '10.0.0.2', online: true, standby: true, has_linstor_controller: false },
  {
    hostname: 'n3',
    service_ip: '10.0.0.3',
    online: false,
    standby: false,
    has_linstor_controller: false,
    has_cloudstack_db: true,
    has_cloudstack_nfs: true,
  },
];

const renderList = async () => {
  const utils = renderWithClient(<VSANNodeList />);
  await waitFor(() => expect(tableRows(utils.container)).toHaveLength(3));
  return utils;
};

const standbySwitch = (row: HTMLElement) => within(row).getByRole('switch');

describe('VSANNodeList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    hoisted.mode = UIMode.VSAN;
    FakeSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeSocket);
    vi.mocked(getNodesFromVSAN).mockResolvedValue({ data: vsanNodes } as never);
    vi.mocked(getCloudStackNodes).mockResolvedValue({ data: [{ name: 'n1', num_vms: 3 }] } as never);
    vi.mocked(setNodeStandBy).mockResolvedValue({} as never);
    vi.mocked(setNodeMaintenance).mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the nodes with their status tags in VSAN mode', async () => {
    const { container } = await renderList();

    const n1 = rowByText(container, 'n1');
    expect(within(n1).getByText('Online')).toHaveClass('ant-tag');
    expect(within(n1).getByText('Controller')).toHaveClass('ant-tag');
    expect(within(rowByText(container, 'n2')).getByText('Standby')).toHaveClass('ant-tag');
    const n3 = rowByText(container, 'n3');
    expect(within(n3).getByText('Error')).toHaveClass('ant-tag');
    expect(within(n3).queryByText('CS Manager')).toBeNull();

    expect(screen.queryByText('VM Count')).toBeNull();
    expect(getCloudStackNodes).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Add Nodes' })).toHaveAttribute(
      'href',
      `https://${window.location.hostname}/addnode.html`,
    );
    expect(screen.getByRole('link', { name: 'Delete Nodes' })).toHaveAttribute(
      'href',
      `https://${window.location.hostname}/delnode.html`,
    );
  });

  it('merges the CloudStack VM counts and HCI tags in HCI mode', async () => {
    hoisted.mode = UIMode.HCI;
    const { container } = await renderList();

    expect(screen.getByText('VM Count')).toBeInTheDocument();
    await waitFor(() => expect(getCloudStackNodes).toHaveBeenCalled());
    const n1 = rowByText(container, 'n1');
    await waitFor(() => expect(n1).toHaveTextContent('3'));
    expect(within(n1).getByText('LINSTOR')).toHaveClass('ant-tag');
    const n3 = rowByText(container, 'n3');
    expect(within(n3).getByText('CS Manager')).toHaveClass('ant-tag');
    expect(within(n3).getByText('NFS')).toHaveClass('ant-tag');
  });

  it('navigates to the node detail page of the current mode', async () => {
    const { container, unmount } = await renderList();
    fireEvent.click(within(rowByText(container, 'n1')).getByRole('button', { name: 'View' }));
    expect(hoisted.navigate).toHaveBeenCalledWith('/vsan/nodes/n1');
    unmount();

    hoisted.mode = UIMode.HCI;
    const second = await renderList();
    fireEvent.click(within(rowByText(second.container, 'n2')).getByRole('button', { name: 'View' }));
    expect(hoisted.navigate).toHaveBeenCalledWith('/hci/inventory/nodes/n2');
  });

  it('asks before putting a node into standby and reloads afterwards', async () => {
    const { container } = await renderList();

    fireEvent.click(standbySwitch(rowByText(container, 'n1')));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Warning');
    expect(setNodeStandBy).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(setNodeStandBy).toHaveBeenCalledWith('n1', true));
    expect(setNodeMaintenance).not.toHaveBeenCalled();
    expect(await screen.findByText('Standby status changed!')).toBeInTheDocument();
    await waitFor(() => expect(getNodesFromVSAN).toHaveBeenCalledTimes(2));
  });

  it('does nothing when the standby warning is cancelled', async () => {
    const { container } = await renderList();

    fireEvent.click(standbySwitch(rowByText(container, 'n1')));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
    expect(setNodeStandBy).not.toHaveBeenCalled();
  });

  it('leaves standby without asking and also lifts maintenance in HCI mode', async () => {
    hoisted.mode = UIMode.HCI;
    const { container } = await renderList();

    fireEvent.click(standbySwitch(rowByText(container, 'n2')));

    await waitFor(() => expect(setNodeStandBy).toHaveBeenCalledWith('n2', false));
    expect(setNodeMaintenance).toHaveBeenCalledWith('n2', false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('reports a failed standby change', async () => {
    vi.mocked(setNodeStandBy).mockRejectedValue(apiError('Standby failed', 'resources busy'));
    const { container } = await renderList();

    fireEvent.click(standbySwitch(rowByText(container, 'n2')));

    expect(await screen.findByText('Standby failed')).toBeInTheDocument();
    expect(screen.getByText('resources busy')).toBeInTheDocument();
  });

  it('only updates nodes in standby and follows the update over the socket', async () => {
    const { container } = await renderList();

    expect(within(rowByText(container, 'n1')).getByRole('button', { name: 'Update' })).toBeDisabled();
    const n2 = rowByText(container, 'n2');
    fireEvent.click(within(n2).getByRole('button', { name: 'Update' }));
    expect(await screen.findByText('Are you sure you want to update this node?')).toBeInTheDocument();
    await confirmPopover();

    await waitFor(() => expect(FakeSocket.instances).toHaveLength(1));
    const socket = FakeSocket.instances[0];
    expect(socket.url).toBe(`wss://${window.location.hostname}/api/frontend/v1/system/update-with-reboot/n2`);
    expect(within(n2).getByText('Checking')).toBeInTheDocument();

    socket.message({ type: 'Downloading', number: 1, of: 4 });
    expect(within(n2).getByText('Downloading')).toBeInTheDocument();
    expect((n2.querySelector('.ant-progress-bg') as HTMLElement).style.width).toBe('25%');

    socket.message({ type: 'Downloading', number: 4, of: 4 });
    expect(within(n2).getByText('Download Finished')).toBeInTheDocument();

    socket.message({ type: 'Installing', number: 2, of: 2 });
    expect(within(n2).getByText('Rebooting')).toBeInTheDocument();

    socket.emit('close');
    // Once the socket closes the progress bar goes away and the toast reports the result.
    expect(n2.querySelector('.ant-progress')).toBeNull();
    expect(await screen.findByText('Update finished for node: n2')).toBeInTheDocument();
    expect(within(n2).getByRole('button', { name: 'Update' })).toBeEnabled();
  });

  it('shows the server error when an update fails', async () => {
    const { container } = await renderList();

    const n2 = rowByText(container, 'n2');
    fireEvent.click(within(n2).getByRole('button', { name: 'Update' }));
    await confirmPopover();
    await waitFor(() => expect(FakeSocket.instances).toHaveLength(1));

    FakeSocket.instances[0].message({ type: 'Error', error: 'disk full' });

    expect(await screen.findByText('Failed to update node!')).toBeInTheDocument();
    expect(screen.getByText('disk full')).toBeInTheDocument();
    expect(within(n2).getByText('Error')).toHaveClass('ant-tag');
    expect(within(n2).getByRole('button', { name: 'Update' })).toBeEnabled();
  });

  it('reloads on demand and lets the refresh interval be changed', async () => {
    await renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    await waitFor(() => expect(getNodesFromVSAN).toHaveBeenCalledTimes(2));

    fireEvent.click(document.querySelector('.ant-btn-circle') as HTMLElement);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Refresh Interval');
    fireEvent.change(within(dialog).getByRole('spinbutton'), { target: { value: '30' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
  });
});
