// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import { NetInterfaceDetail } from '../NetInterfaceDetail';
import type { NetWorkInterface } from '@app/features/ip';
import { getNetWorkInterfaceByNode } from '@app/features/ip';
import { getNodes } from '@app/features/node/api';
import { getResourceGroups } from '@app/features/resourceGroup';
import { UIMode } from '@app/models/setting';
import { renderPage } from '../../../__test__/helpers';

vi.mock('@app/features/ip', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/ip')>()),
  getNetWorkInterfaceByNode: vi.fn(),
}));

vi.mock('@app/features/node/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node/api')>()),
  getNodes: vi.fn(),
}));

vi.mock('@app/features/resourceGroup', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/resourceGroup')>()),
  getResourceGroups: vi.fn(),
}));

const mode = vi.hoisted(() => ({ value: 'NORMAL' as string }));
vi.mock('react-redux', () => ({
  useSelector: (selector: (s: unknown) => unknown) => selector({ setting: { mode: mode.value } }),
}));

const item = { name: 'default', address: '10.0.0.1', satellite_port: 3366, is_active: true } as NetWorkInterface;

// gui02 carries an interface with the same name but a different address, so the
// dialog must mark only gui01 as the current node.
const interfacesByNode: Record<string, NetWorkInterface[]> = {
  gui01: [{ name: 'default', address: '10.0.0.1', uuid: 'a1' } as NetWorkInterface],
  gui02: [
    { name: 'default', address: '10.0.0.2', uuid: 'a2' } as NetWorkInterface,
    { name: 'backup', address: '10.0.1.2', uuid: 'a3' } as NetWorkInterface,
  ],
};

const openDetail = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Detail' }));
  return screen.findByRole('dialog');
};

describe('NetInterfaceDetail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getNodes).mockResolvedValue({ data: [{ name: 'gui01' }, { name: 'gui02' }] } as never);
    vi.mocked(getNetWorkInterfaceByNode).mockImplementation(
      (node: string) => Promise.resolve({ data: interfacesByNode[node] ?? [] }) as never,
    );
    vi.mocked(getResourceGroups).mockResolvedValue({ data: [] } as never);
    mode.value = UIMode.NORMAL;
  });

  it('waits for the nodes and their interfaces before offering the dialog', async () => {
    vi.mocked(getNodes).mockReturnValue(new Promise(() => undefined) as never);
    renderPage(<NetInterfaceDetail item={item} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Detail' })).toBeNull();
  });

  it('lists every node carrying an interface of that name and marks the current one', async () => {
    renderPage(<NetInterfaceDetail item={item} />);
    const dialog = await openDetail();

    expect(dialog).toHaveTextContent('Network interface default is used by:');
    const gui01 = within(dialog).getByRole('link', { name: 'gui01' });
    expect(gui01).toHaveAttribute('href', '/inventory/nodes/gui01');
    expect(gui01.parentElement).toHaveTextContent('(current node)');

    const gui02 = within(dialog).getByRole('link', { name: 'gui02' });
    expect(gui02.parentElement).not.toHaveTextContent('(current node)');
    // gui02's other interface has a different name and must not be listed.
    expect(dialog).not.toHaveTextContent('backup');
  });

  it('links into the VSAN node pages in VSAN mode', async () => {
    mode.value = UIMode.VSAN;
    renderPage(<NetInterfaceDetail item={item} />);
    const dialog = await openDetail();

    expect(within(dialog).getByRole('link', { name: 'gui01' })).toHaveAttribute('href', '/vsan/nodes/gui01');
  });

  it('says so when no resource group prefers the interface', async () => {
    renderPage(<NetInterfaceDetail item={item} />);
    const dialog = await openDetail();

    expect(dialog).toHaveTextContent('Not used by any resource group');
  });

  it('lists only the resource groups whose PrefNic is the interface', async () => {
    vi.mocked(getResourceGroups).mockResolvedValue({
      data: [
        { name: 'rg-pref', uuid: 'rg1', props: { PrefNic: 'default' } },
        { name: 'rg-other', uuid: 'rg2', props: { PrefNic: 'backup' } },
        { name: 'rg-none', uuid: 'rg3', props: {} },
      ],
    } as never);
    renderPage(<NetInterfaceDetail item={item} />);
    const dialog = await openDetail();

    expect(dialog).toHaveTextContent('rg-pref');
    expect(dialog).not.toHaveTextContent('rg-other');
    expect(dialog).not.toHaveTextContent('rg-none');
    expect(dialog).not.toHaveTextContent('Not used by any resource group');
  });

  it('closes again', async () => {
    renderPage(<NetInterfaceDetail item={item} />);
    await openDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
  });
});
