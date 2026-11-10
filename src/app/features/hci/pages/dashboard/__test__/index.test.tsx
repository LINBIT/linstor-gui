// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';

import HCIDashboard from '../index';
import { focusFaultyState } from '@app/features/resource/faultyFocus';

vi.mock('@app/components/PageBasic', () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock('@app/features/vsan', () => ({
  VSANNodeList: () => <div>node list</div>,
}));

vi.mock('@app/components/StoragePoolInfo', () => ({
  StoragePoolInfo: () => <div>storage pools</div>,
}));

vi.mock('@app/features/resource', async (orig) => ({
  ...(await orig<typeof import('@app/features/resource')>()),
  FaultyList: () => <div>faulty list</div>,
  useFaultyResources: () => ({ data: [{ name: 'r1' }] }),
}));

const renderDashboard = (state?: unknown) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/hci/dashboard', state }]}>
      <Link to="/hci/dashboard" state={focusFaultyState}>
        header icon
      </Link>
      <HCIDashboard />
    </MemoryRouter>,
  );

const selectedTab = () => screen.getByRole('tab', { selected: true });

describe('HCI dashboard', () => {
  it('opens on the nodes', () => {
    renderDashboard();
    expect(selectedTab()).toHaveTextContent('Nodes');
  });

  it('opens on the faulty resources when the header icon sent you', () => {
    renderDashboard(focusFaultyState);
    expect(selectedTab()).toHaveTextContent('Faulty Resources');
    expect(screen.getByText('faulty list')).toBeVisible();
  });

  it('switches to the faulty resources on a header click while another tab is open', () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('tab', { name: 'Storage Pools' }));
    expect(selectedTab()).toHaveTextContent('Storage Pools');

    fireEvent.click(screen.getByText('header icon'));
    expect(selectedTab()).toHaveTextContent('Faulty Resources');

    // And the tabs still change by hand afterwards.
    fireEvent.click(screen.getByRole('tab', { name: 'Nodes' }));
    expect(selectedTab()).toHaveTextContent('Nodes');
  });
});
