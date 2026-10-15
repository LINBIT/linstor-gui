// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ControllerOverview } from '../ControllerOverview';
import {
  getControllerConfig,
  getControllerProperties,
  getControllerVersion,
  getExternalFilesWithContent,
  getNodes,
  getResourceOnNodes,
} from '@app/features/node/api';

vi.mock('@app/features/node/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node/api')>()),
  getControllerConfig: vi.fn(),
  getControllerProperties: vi.fn(),
  getControllerVersion: vi.fn(),
  getExternalFilesWithContent: vi.fn(),
  getNodes: vi.fn(),
  getResourceOnNodes: vi.fn(),
}));

const config = {
  log: { directory: '/var/log/linstor-controller', level: 'INFO' },
  db: { connection_url: 'jdbc:h2:/var/lib/linstor/linstordb' },
  http: { enabled: true, listen_address: '::', port: 3370 },
  https: { enabled: true, listen_address: '::', port: 3371 },
  ldap: { enabled: false },
};

const reactorConfig = `[[promoter]]
[promoter.resources.linstor_db]
start = ["var-lib-linstor.mount", "ocf:heartbeat:IPaddr2 service_ip cidr_netmask=24 ip=192.0.2.10", "linstor-controller.service"]
`;

const copy = (node: string, inUse: boolean, flags: string[] = []) => ({
  name: 'linstor_db',
  node_name: node,
  flags,
  state: { in_use: inUse },
});

const renderOverview = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ControllerOverview />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('ControllerOverview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getControllerVersion).mockResolvedValue({
      data: { version: '1.99.0.9ed0515f', rest_api_version: '1.30.0', build_time: '2026-09-28T07:50:31+00:00' },
    } as never);
    vi.mocked(getControllerConfig).mockResolvedValue({ data: config } as never);
    vi.mocked(getControllerProperties).mockResolvedValue({
      data: { 'Auth/TokenAuthenticationEnabled': 'true', 'REST/AutoHTTPS': 'true', 'Cluster/LocalID': '9b508d7c-54bb' },
    } as never);
    vi.mocked(getNodes).mockResolvedValue({
      data: [
        { name: 'gui01', type: 'SATELLITE', connection_status: 'ONLINE' },
        { name: 'gui02', type: 'SATELLITE', connection_status: 'ONLINE' },
        { name: 'gui03', type: 'SATELLITE', connection_status: 'OFFLINE' },
      ],
    } as never);
    vi.mocked(getExternalFilesWithContent).mockResolvedValue({
      data: [{ path: '/etc/drbd-reactor.d/linstor_db.toml', content: btoa(reactorConfig) }],
    } as never);
    vi.mocked(getResourceOnNodes).mockResolvedValue({
      data: [
        copy('gui01', true),
        copy('gui02', false),
        copy('gui03', false),
        copy('gui04', false, ['DISKLESS', 'TIE_BREAKER']),
      ],
    } as never);
  });

  it('shows the version, where the controller runs and the satellites online', async () => {
    renderOverview();

    expect(await screen.findByText('1.99.0.9ed0515f')).toBeInTheDocument();
    expect(screen.getByText('REST API 1.30.0 · built 2026-09-28')).toBeInTheDocument();
    expect(await screen.findByText('Active on gui01')).toBeInTheDocument();
    // A tie-breaker holds no copy the controller could run from.
    expect(screen.getByText('Standby: gui02, gui03 · VIP 192.0.2.10')).toBeInTheDocument();
    expect(await screen.findByText('2 of 3 online')).toBeInTheDocument();
  });

  it('shows how the REST API is reached and protected', async () => {
    renderOverview();

    expect(await screen.findByText('HTTPS :3371')).toBeInTheDocument();
    expect(screen.getByText('HTTP :3370 · self-signed certificate (AutoHTTPS)')).toBeInTheDocument();
    expect(await screen.findByText('Token auth on')).toBeInTheDocument();
    expect(screen.getByText(/LDAP off/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage tokens' })).toHaveAttribute('href', '/auth-tokens');
  });

  it('lists the logs, not the cluster ID or the database', async () => {
    renderOverview();

    expect(await screen.findByText('/var/log/linstor-controller · INFO')).toBeInTheDocument();
    expect(screen.queryByText('9b508d7c-54bb')).toBeNull();
    expect(screen.queryByText('jdbc:h2:/var/lib/linstor/linstordb')).toBeNull();
  });

  it('shows skeletons until the controller has answered', async () => {
    vi.mocked(getControllerVersion).mockReturnValue(new Promise(() => {}) as never);
    vi.mocked(getControllerConfig).mockReturnValue(new Promise(() => {}) as never);
    vi.mocked(getNodes).mockReturnValue(new Promise(() => {}) as never);
    vi.mocked(getExternalFilesWithContent).mockReturnValue(new Promise(() => {}) as never);
    const { container } = renderOverview();

    // Version, HA, satellites, REST API, access and the logs row.
    expect(container.querySelectorAll('.ant-skeleton')).toHaveLength(6);
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.queryByText('-')).toBeNull();
    expect(screen.queryByText('Token auth off')).toBeNull();
  });

  it('says so when the controller is not highly available', async () => {
    vi.mocked(getExternalFilesWithContent).mockResolvedValue({ data: [] } as never);
    vi.mocked(getResourceOnNodes).mockResolvedValue({ data: [] } as never);
    renderOverview();

    expect(await screen.findByText('Single controller')).toBeInTheDocument();
    expect(screen.getByText('Not highly available')).toBeInTheDocument();
    expect(getResourceOnNodes).toHaveBeenCalledWith('linstor_db');
  });

  it('marks HA without an active node', async () => {
    vi.mocked(getResourceOnNodes).mockResolvedValue({ data: [copy('gui01', false), copy('gui02', false)] } as never);
    renderOverview();

    expect(await screen.findByText('No node active')).toBeInTheDocument();
  });

  it('shows plain HTTP when HTTPS is off, and token auth off', async () => {
    vi.mocked(getControllerConfig).mockResolvedValue({
      data: { ...config, https: { enabled: false, port: 3371 } },
    } as never);
    vi.mocked(getControllerProperties).mockResolvedValue({ data: {} } as never);
    renderOverview();

    expect(await screen.findByText('HTTP :3370')).toBeInTheDocument();
    expect(await screen.findByText('Token auth off')).toBeInTheDocument();
  });
});
