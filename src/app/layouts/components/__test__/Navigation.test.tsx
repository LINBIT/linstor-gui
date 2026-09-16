// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Navigation from '../Navigation';
import { getControllerVersion } from '@app/features/node/api';

vi.mock('@app/features/node/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node/api')>()),
  getControllerVersion: vi.fn(),
}));

const mockedVersion = vi.mocked(getControllerVersion);

const version = (restApi: string) => ({ data: { rest_api_version: restApi } }) as never;

type Props = React.ComponentProps<typeof Navigation>;

const renderNav = (path = '/', props: Props = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Navigation {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const link = (name: string) => screen.getByRole('link', { name });
const openGroup = (title: string) => fireEvent.click(screen.getByText(title));
const waitForVersion = () => waitFor(() => expect(mockedVersion).toHaveBeenCalled());

describe('Navigation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedVersion.mockResolvedValue(version('1.30.0'));
  });

  it('renders the normal-mode menu with settings when authentication is off', async () => {
    renderNav('/', { authenticationEnabled: false });
    await waitForVersion();

    expect(link('Dashboard')).toHaveAttribute('href', '/');
    expect(link('Snapshots')).toHaveAttribute('href', '/snapshot');
    expect(link('Error Reports')).toHaveAttribute('href', '/error-reports');
    expect(link('Settings')).toHaveAttribute('href', '/settings');
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Storage Configuration')).toBeInTheDocument();
    expect(screen.getByText('Backup / DR')).toBeInTheDocument();
    expect(screen.getByText('High Availability')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.queryByText('Gateway')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Grafana' })).toBeNull();

    openGroup('Inventory');
    expect(await screen.findByRole('link', { name: 'Nodes' })).toHaveAttribute('href', '/inventory/nodes');
    expect(link('Controller')).toHaveAttribute('href', '/inventory/controller');
    expect(link('Storage Pools')).toHaveAttribute('href', '/inventory/storage-pools');

    openGroup('Authentication');
    expect(await screen.findByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users');
    expect(link('Auth Tokens')).toHaveAttribute('href', '/auth-tokens');
  });

  it('hides settings and users from non-admins when authentication is on', async () => {
    renderNav('/', { authenticationEnabled: true, isAdmin: false });
    await waitForVersion();

    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull();
    expect(screen.queryByText('Authentication')).toBeNull();
  });

  it('shows settings and users to admins when authentication is on', async () => {
    renderNav('/', { authenticationEnabled: true, isAdmin: true });
    await waitForVersion();

    expect(link('Settings')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
  });

  it('adds Grafana and Gateway entries when they are configured and available', async () => {
    renderNav('/', {
      grafanaConfig: { baseUrl: 'https://grafana.test' } as never,
      KVS: { gatewayEnabled: true },
      gatewayAvailable: true,
    });
    await waitForVersion();

    expect(link('Grafana')).toHaveAttribute('href', '/grafana');
    openGroup('Gateway');
    expect(await screen.findByRole('link', { name: 'NFS' })).toHaveAttribute('href', '/gateway/nfs');
    expect(link('iSCSI')).toHaveAttribute('href', '/gateway/iscsi');
    expect(link('NVMe-oF')).toHaveAttribute('href', '/gateway/nvme-of');
  });

  it('keeps the gateway hidden when it is enabled but not reachable', async () => {
    renderNav('/', { KVS: { gatewayEnabled: true }, gatewayAvailable: false });
    await waitForVersion();
    expect(screen.queryByText('Gateway')).toBeNull();
  });

  it('hides the version-gated entries on an old controller', async () => {
    mockedVersion.mockResolvedValue(version('1.20.0'));
    renderNav('/', { authenticationEnabled: false });

    await waitFor(() => expect(screen.queryByText('High Availability')).toBeNull());
    openGroup('Authentication');
    expect(await screen.findByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Auth Tokens' })).toBeNull();
  });

  it('shows the gated entries optimistically while the version is unknown', () => {
    mockedVersion.mockReturnValue(new Promise(() => undefined) as never);
    renderNav('/', { authenticationEnabled: false });

    expect(screen.getByText('High Availability')).toBeInTheDocument();
  });

  it('opens the group of the current route and selects its entry', async () => {
    renderNav('/inventory/nodes');

    const nodes = await screen.findByRole('link', { name: 'Nodes' });
    expect(nodes.closest('.ant-menu-item')).toHaveClass('ant-menu-item-selected');
    expect(screen.getByText('Inventory').closest('.ant-menu-submenu')).toHaveClass('ant-menu-submenu-open');
  });

  it('selects a top-level route without opening any group', async () => {
    renderNav('/snapshot');
    await waitForVersion();

    expect(link('Snapshots').closest('.ant-menu-item')).toHaveClass('ant-menu-item-selected');
    expect(document.querySelector('.ant-menu-submenu-open')).toBeNull();
  });

  it('does not expand the current group while the sidebar is collapsed', async () => {
    const { container } = renderNav('/inventory/nodes', { isNavOpen: true });
    await waitForVersion();

    expect(container.querySelector('.ant-menu-inline-collapsed')).not.toBeNull();
    expect(document.querySelector('.ant-menu-submenu-open')).toBeNull();
  });

  it('renders the VSAN menu in VSAN mode', async () => {
    renderNav('/vsan/dashboard', { vsanModeFromSetting: true });
    await waitForVersion();

    expect(link('Dashboard')).toHaveAttribute('href', '/vsan/dashboard');
    expect(link('Physical Storage')).toHaveAttribute('href', '/vsan/physical-storage');
    expect(link('iSCSI')).toHaveAttribute('href', '/vsan/iscsi');
    expect(link('NVMe-oF')).toHaveAttribute('href', '/vsan/nvmeof');
    expect(link('NFS')).toHaveAttribute('href', '/vsan/nfs');
    expect(link('Users')).toHaveAttribute('href', '/vsan/users');
    expect(link('About')).toHaveAttribute('href', '/vsan/about');
    expect(screen.queryByText('Inventory')).toBeNull();
  });

  it('renders the HCI menu with prefixed routes and no HA group', async () => {
    renderNav('/hci/dashboard', {
      hciModeFromSetting: true,
      authenticationEnabled: false,
      grafanaConfig: { baseUrl: 'https://grafana.test' } as never,
      KVS: { gatewayEnabled: true },
      gatewayAvailable: true,
    });
    await waitForVersion();

    expect(link('Dashboard')).toHaveAttribute('href', '/hci/dashboard');
    expect(link('Snapshots')).toHaveAttribute('href', '/hci/snapshot');
    expect(link('Files')).toHaveAttribute('href', '/hci/files');
    expect(link('Grafana')).toHaveAttribute('href', '/hci/grafana');
    expect(link('Settings')).toHaveAttribute('href', '/hci/settings');
    expect(screen.queryByText('High Availability')).toBeNull();

    openGroup('Inventory');
    expect(await screen.findByRole('link', { name: 'Nodes' })).toHaveAttribute('href', '/hci/inventory/nodes');
    openGroup('Gateway');
    expect(await screen.findByRole('link', { name: 'NFS' })).toHaveAttribute('href', '/hci/gateway/nfs');
  });
});
