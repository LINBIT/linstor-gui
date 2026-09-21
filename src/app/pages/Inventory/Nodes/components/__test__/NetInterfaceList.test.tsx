// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

import NetInterfaceList from '../NetInterfaceList';
import type { NetWorkInterface } from '@app/features/ip';
import { renderPage, confirmPopover } from '../../../__test__/helpers';

// The detail dialog has its own suite and pulls in queries of its own.
vi.mock('../NetInterfaceDetail', () => ({
  NetInterfaceDetail: ({ item }: { item: NetWorkInterface }) => <span>detail-{item.name}</span>,
}));

const interfaces = [
  { name: 'default', address: '10.0.0.1', satellite_port: 3366, is_active: true, uuid: 'u1' },
  { name: 'backup', address: '10.0.1.1', satellite_port: 3367, is_active: false, uuid: 'u2' },
] as NetWorkInterface[];

const renderList = (list: NetWorkInterface[] = interfaces) => {
  const handleDeleteNetWorkInterface = vi.fn();
  const handleSetActiveNetWorkInterface = vi.fn();
  const utils = renderPage(
    <NetInterfaceList
      list={list}
      handleDeleteNetWorkInterface={handleDeleteNetWorkInterface}
      handleSetActiveNetWorkInterface={handleSetActiveNetWorkInterface}
    />,
  );
  return { ...utils, handleDeleteNetWorkInterface, handleSetActiveNetWorkInterface };
};

const itemByText = (container: HTMLElement, text: string) => {
  const item = Array.from(container.querySelectorAll('.ant-list-item')).find((el) => el.textContent?.includes(text)) as
    HTMLElement | undefined;
  expect(item).toBeDefined();
  return item as HTMLElement;
};

describe('NetInterfaceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows each interface with its address, port and active tag', () => {
    const { container } = renderList();

    const active = itemByText(container, 'default');
    expect(active).toHaveTextContent('10.0.0.1');
    expect(active).toHaveTextContent('3366');
    expect(within(active).getByText('Active')).toHaveClass('ant-tag');
    expect(within(active).getByText('detail-default')).toBeInTheDocument();

    const other = itemByText(container, 'backup');
    expect(within(other).queryByText('Active')).toBeNull();
  });

  it('refuses to delete or re-activate the active interface', () => {
    const { container } = renderList();
    const active = itemByText(container, 'default');

    expect(within(active).getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(within(active).getByRole('button', { name: 'Set as active' })).toBeDisabled();
  });

  it('refuses to delete the only interface a node has', () => {
    const { container } = renderList([interfaces[1]]);

    expect(within(itemByText(container, 'backup')).getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('deletes an inactive interface after confirmation', async () => {
    const { container, handleDeleteNetWorkInterface } = renderList();

    fireEvent.click(within(itemByText(container, 'backup')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Are you sure to delete this network interface?')).toBeInTheDocument();
    await confirmPopover();

    await waitFor(() => expect(handleDeleteNetWorkInterface).toHaveBeenCalledWith('backup'));
  });

  it('activates an inactive interface after confirmation', async () => {
    const { container, handleSetActiveNetWorkInterface } = renderList();

    fireEvent.click(within(itemByText(container, 'backup')).getByRole('button', { name: 'Set as active' }));
    expect(await screen.findByText('Are you sure to set this network interface as active?')).toBeInTheDocument();
    await confirmPopover();

    await waitFor(() => expect(handleSetActiveNetWorkInterface).toHaveBeenCalledWith(interfaces[1]));
  });

  it('renders nothing but the empty state without interfaces', () => {
    const { container } = renderList([]);

    expect(container.querySelectorAll('.ant-list-item')).toHaveLength(0);
    // antd renders the empty text twice (visible + screen-reader copy).
    expect(container.querySelector('.ant-empty')).not.toBeNull();
  });
});
