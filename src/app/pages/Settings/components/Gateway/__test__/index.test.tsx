// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import Gateway from '..';
import { renderSettings, switchByLabel } from '../../../__test__/helpers';
import type { SettingsContextValue } from '@app/features/settings/useSettings';
import { makeSettings } from '@app/__test__/helpers';

const settings = vi.hoisted(() => ({ current: undefined as SettingsContextValue | undefined }));

vi.mock('@app/features/settings/useSettings', async (orig) => ({
  ...(await orig()),
  useSettings: () => settings.current,
}));

// jsdom serves the page from localhost, so this is the host the form defaults to.
const ORIGIN_HOST = 'http://localhost:8337/';

const hostInput = () => screen.getByRole('textbox');
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('Settings gateway tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settings.current = makeSettings({
      KVS: { gatewayEnabled: false, gatewayHost: '', gatewayCustomHost: false },
      getGatewayStatus: vi.fn().mockResolvedValue(true),
    });
  });

  it('shows nothing but the mode switch while the gateway is off', () => {
    const { container } = renderSettings(<Gateway />);

    expect(switchByLabel(container, 'gateway-mode')).not.toBeChecked();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Test Connection' })).toBeNull();
  });

  it('probes the gateway on mount', async () => {
    renderSettings(<Gateway />);

    await waitFor(() => expect(settings.current!.getGatewayStatus).toHaveBeenCalledWith(ORIGIN_HOST));
  });

  it('reveals the host form once the gateway is switched on', async () => {
    const { container } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(container, 'gateway-mode'));

    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument());
    expect(hostInput()).toHaveValue(ORIGIN_HOST);
    // The default host is the controller's own, so the field stays read-only.
    expect(hostInput()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Test Connection' })).toBeEnabled();
  });

  it('opens the host field for editing on the custom-host switch', async () => {
    const { container } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(container, 'gateway-mode'));
    await screen.findByRole('textbox');

    fireEvent.click(switchByLabel(container, 'custom-host'));
    await waitFor(() => expect(hostInput()).toBeEnabled());
  });

  it('reports the gateway as unreachable until the probe succeeds', async () => {
    const { container } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(container, 'gateway-mode'));

    expect(await screen.findByText('Not Available')).toBeInTheDocument();

    settings.current!.gatewayAvailable = true;
    const { container: reachable } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(reachable, 'gateway-mode'));

    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it('re-probes the entered host on demand', async () => {
    const { container } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(container, 'gateway-mode'));
    await screen.findByRole('textbox');
    fireEvent.click(switchByLabel(container, 'custom-host'));

    fireEvent.change(hostInput(), { target: { value: 'http://192.168.123.200:8337/' } });
    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }));

    await waitFor(() =>
      expect(settings.current!.getGatewayStatus).toHaveBeenCalledWith('http://192.168.123.200:8337/'),
    );
  });

  it('saves the enabled gateway with the default host', async () => {
    const { container } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(container, 'gateway-mode'));
    await screen.findByRole('textbox');

    save();

    // The host field debounces validation by a second before the form submits.
    await waitFor(
      () =>
        expect(settings.current!.setGatewayMode).toHaveBeenCalledWith({
          gatewayEnabled: true,
          customHost: false,
          host: ORIGIN_HOST,
          showToast: false,
        }),
      { timeout: 3000 },
    );
  });

  it('appends the missing trailing slash to a custom host', async () => {
    const { container } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(container, 'gateway-mode'));
    await screen.findByRole('textbox');
    fireEvent.click(switchByLabel(container, 'custom-host'));

    fireEvent.change(hostInput(), { target: { value: 'http://192.168.123.200:8337' } });
    save();

    await waitFor(() =>
      expect(settings.current!.setGatewayMode).toHaveBeenCalledWith(
        expect.objectContaining({ host: 'http://192.168.123.200:8337/', customHost: true }),
      ),
    );
  });

  it('refuses to save a custom host the gateway does not answer on', async () => {
    vi.mocked(settings.current!.getGatewayStatus).mockResolvedValue(false);
    const { container } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(container, 'gateway-mode'));
    await screen.findByRole('textbox');
    fireEvent.click(switchByLabel(container, 'custom-host'));

    fireEvent.change(hostInput(), { target: { value: 'http://192.168.123.201:8337/' } });
    save();

    expect(
      await screen.findByText('Cannot connect to LINSTOR-Gateway', undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    // The default-host hint must not crowd the reason out.
    expect(screen.getByText(`Default: ${ORIGIN_HOST}`)).toBeInTheDocument();
    expect(settings.current!.setGatewayMode).not.toHaveBeenCalled();
  });

  it('locks Save and hides the badge while a probe is in flight', async () => {
    settings.current!.checkingGateway = true;
    const { container } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(container, 'gateway-mode'));
    await screen.findByRole('textbox');

    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Test Connection' })).toBeDisabled();
    expect(screen.queryByText('Not Available')).toBeNull();
  });
});
