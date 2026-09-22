// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import Gateway from '..';
import { renderSettings, switchByLabel } from '../../../__test__/helpers';

const hoisted = vi.hoisted(() => ({
  dispatch: {
    setting: {
      getGatewayStatus: vi.fn(),
      setGatewayMode: vi.fn(),
    },
  },
  state: {
    setting: {
      KVS: { gatewayEnabled: false, gatewayHost: '', gatewayCustomHost: false } as Record<string, unknown>,
      gatewayAvailable: false,
    },
    loading: { effects: { setting: { getGatewayStatus: false } } },
  },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => hoisted.dispatch,
  useSelector: (selector: (s: unknown) => unknown) => selector(hoisted.state),
}));

// jsdom serves the page from localhost, so this is the host the form defaults to.
const ORIGIN_HOST = 'http://localhost:8337/';

const hostInput = () => screen.getByRole('textbox');
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('Settings gateway tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.state.setting.KVS = { gatewayEnabled: false, gatewayHost: '', gatewayCustomHost: false };
    hoisted.state.setting.gatewayAvailable = false;
    hoisted.state.loading.effects.setting.getGatewayStatus = false;
    hoisted.dispatch.setting.getGatewayStatus.mockResolvedValue(true);
  });

  it('shows nothing but the mode switch while the gateway is off', () => {
    const { container } = renderSettings(<Gateway />);

    expect(switchByLabel(container, 'gateway-mode')).not.toBeChecked();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Test Connection' })).toBeNull();
  });

  it('probes the gateway on mount', async () => {
    renderSettings(<Gateway />);

    await waitFor(() => expect(hoisted.dispatch.setting.getGatewayStatus).toHaveBeenCalledWith(ORIGIN_HOST));
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

    hoisted.state.setting.gatewayAvailable = true;
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
      expect(hoisted.dispatch.setting.getGatewayStatus).toHaveBeenCalledWith('http://192.168.123.200:8337/'),
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
        expect(hoisted.dispatch.setting.setGatewayMode).toHaveBeenCalledWith({
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
      expect(hoisted.dispatch.setting.setGatewayMode).toHaveBeenCalledWith(
        expect.objectContaining({ host: 'http://192.168.123.200:8337/', customHost: true }),
      ),
    );
  });

  it('refuses to save a custom host the gateway does not answer on', async () => {
    hoisted.dispatch.setting.getGatewayStatus.mockResolvedValue(false);
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
    expect(hoisted.dispatch.setting.setGatewayMode).not.toHaveBeenCalled();
  });

  it('locks Save and hides the badge while a probe is in flight', async () => {
    hoisted.state.loading.effects.setting.getGatewayStatus = true;
    const { container } = renderSettings(<Gateway />);
    fireEvent.click(switchByLabel(container, 'gateway-mode'));
    await screen.findByRole('textbox');

    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Test Connection' })).toBeDisabled();
    expect(screen.queryByText('Not Available')).toBeNull();
  });
});
