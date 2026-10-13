// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { GatewayConnectionHelp } from '../GatewayConnectionHelp';

const renderAt = (path: string, ui: React.ReactElement) =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

describe('GatewayConnectionHelp', () => {
  it('names the gateway and the origin to allow', () => {
    renderAt('/gateway/nfs', <GatewayConnectionHelp host="http://10.0.0.1:8337/" />);

    expect(screen.getByText('Cannot reach LINSTOR Gateway at http://10.0.0.1:8337/')).toBeInTheDocument();
    expect(screen.getByText(window.location.origin)).toBeInTheDocument();
    expect(screen.getByText(/is running and that its port can be reached/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('links an https gateway to its status page to accept the certificate', () => {
    renderAt('/gateway/nfs', <GatewayConnectionHelp host="https://10.0.0.1:8337/" />);

    const link = screen.getByRole('link', { name: 'https://10.0.0.1:8337/api/v2/status' });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('links to the gateway settings, under /hci in HCI mode', () => {
    const { unmount } = renderAt('/gateway/nfs', <GatewayConnectionHelp host="http://g/" showSettingsLink />);
    expect(screen.getByRole('link', { name: 'Gateway settings' })).toHaveAttribute('href', '/settings');
    unmount();

    renderAt('/hci/gateway/nfs', <GatewayConnectionHelp host="http://g/" showSettingsLink />);
    expect(screen.getByRole('link', { name: 'Gateway settings' })).toHaveAttribute('href', '/hci/settings');
  });
});
