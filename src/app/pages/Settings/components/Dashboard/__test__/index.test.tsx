// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import Dashboard from '..';
import { renderSettings, switchByLabel } from '../../../__test__/helpers';

const hoisted = vi.hoisted(() => ({
  dispatch: { setting: { saveGrafanaConfig: vi.fn() } },
  state: { setting: { grafanaConfig: null as Record<string, unknown> | null } },
  errorMessage: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useDispatch: () => hoisted.dispatch,
  useSelector: (selector: (s: unknown) => unknown) => selector(hoisted.state),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return { ...actual, message: { ...actual.message, error: hoisted.errorMessage } };
});

const DASHBOARD_URL = 'http://192.168.123.117:3000/d/rYdddlPWk/node-exporter-full?orgId=1&refresh=1m';
const DRBD_URL = 'http://192.168.123.117:3000/d/f_tZtVlMz/drbd?orgId=1&refresh=30s';

const DEFAULT_PANELS = { cpu: 77, memory: 78, network: 74, disk: 152, diskIops: 229, ioUsage: 9 };

const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));
const urlInput = (placeholder: string) => screen.getByPlaceholderText(new RegExp(placeholder));

const enableGrafana = async (container: HTMLElement) => {
  fireEvent.click(switchByLabel(container, 'dashboard-mode'));
  await screen.findByText('Dashboard URL');
};

describe('Settings Grafana tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.state.setting.grafanaConfig = null;
    hoisted.dispatch.setting.saveGrafanaConfig.mockResolvedValue(undefined);
  });

  it('starts off, with nothing but the enable switch', () => {
    const { container } = renderSettings(<Dashboard />);

    expect(switchByLabel(container, 'dashboard-mode')).not.toBeChecked();
    expect(screen.queryByText('Dashboard URL')).toBeNull();
  });

  it('saves a disabled config without asking for a URL', async () => {
    renderSettings(<Dashboard />);
    save();

    await waitFor(() =>
      expect(hoisted.dispatch.setting.saveGrafanaConfig).toHaveBeenCalledWith(
        expect.objectContaining({ enable: false, drbdEnable: false, dashboardUrl: '', dashboardUid: '' }),
      ),
    );
  });

  it('extracts the dashboard UID from the URL and fills in the default panel IDs', async () => {
    const { container } = renderSettings(<Dashboard />);
    await enableGrafana(container);

    fireEvent.change(urlInput('node-exporter-full'), { target: { value: DASHBOARD_URL } });
    save();

    await waitFor(() =>
      expect(hoisted.dispatch.setting.saveGrafanaConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          enable: true,
          dashboardUrl: DASHBOARD_URL,
          dashboardUid: 'rYdddlPWk',
          panelIds: DEFAULT_PANELS,
          drbdEnable: false,
        }),
      ),
    );
  });

  it('rejects a URL with no /d/<uid> segment', async () => {
    const { container } = renderSettings(<Dashboard />);
    await enableGrafana(container);

    fireEvent.change(urlInput('node-exporter-full'), { target: { value: 'http://192.168.123.117:3000/' } });
    save();

    await waitFor(() =>
      expect(hoisted.errorMessage).toHaveBeenCalledWith(
        'Invalid dashboard URL format. Please enter a valid Grafana dashboard URL.',
      ),
    );
    expect(hoisted.dispatch.setting.saveGrafanaConfig).not.toHaveBeenCalled();
  });

  it('will not save an enabled dashboard with no URL at all', async () => {
    const { container } = renderSettings(<Dashboard />);
    await enableGrafana(container);

    save();

    expect(await screen.findByText('Please enter dashboard URL')).toBeInTheDocument();
    // The URL hint must not crowd the reason out.
    expect(screen.getByText(/Enter the full Grafana dashboard URL/)).toBeInTheDocument();
    expect(hoisted.dispatch.setting.saveGrafanaConfig).not.toHaveBeenCalled();
  });

  it('saves the panel IDs that were edited by hand', async () => {
    const { container } = renderSettings(<Dashboard />);
    await enableGrafana(container);
    fireEvent.change(urlInput('node-exporter-full'), { target: { value: DASHBOARD_URL } });

    fireEvent.click(screen.getByText('Panel Configuration'));
    const cpu = await screen.findByRole('spinbutton', { name: 'CPU Panel ID' });
    expect(cpu).toHaveValue(String(DEFAULT_PANELS.cpu));
    fireEvent.change(cpu, { target: { value: '101' } });
    save();

    await waitFor(() =>
      expect(hoisted.dispatch.setting.saveGrafanaConfig).toHaveBeenCalledWith(
        expect.objectContaining({ panelIds: { ...DEFAULT_PANELS, cpu: 101 } }),
      ),
    );
  });

  it('keeps the DRBD dashboard locked until Grafana itself is on', async () => {
    const { container } = renderSettings(<Dashboard />);

    expect(screen.queryByLabelText('drbd-dashboard-mode')).toBeNull();
    await enableGrafana(container);
    expect(switchByLabel(container, 'drbd-dashboard-mode')).toBeEnabled();
  });

  it('saves the DRBD dashboard alongside the main one', async () => {
    const { container } = renderSettings(<Dashboard />);
    await enableGrafana(container);
    fireEvent.change(urlInput('node-exporter-full'), { target: { value: DASHBOARD_URL } });

    fireEvent.click(switchByLabel(container, 'drbd-dashboard-mode'));
    fireEvent.change(await screen.findByPlaceholderText(/drbd\?orgId/), { target: { value: DRBD_URL } });
    save();

    await waitFor(() =>
      expect(hoisted.dispatch.setting.saveGrafanaConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          drbdEnable: true,
          drbdUrl: DRBD_URL,
          drbdUid: 'f_tZtVlMz',
          drbdWriteRatePanelId: 28,
          drbdReadRatePanelId: 29,
        }),
      ),
    );
  });

  it('rejects a DRBD URL with no /d/<uid> segment', async () => {
    const { container } = renderSettings(<Dashboard />);
    await enableGrafana(container);
    fireEvent.change(urlInput('node-exporter-full'), { target: { value: DASHBOARD_URL } });

    fireEvent.click(switchByLabel(container, 'drbd-dashboard-mode'));
    fireEvent.change(await screen.findByPlaceholderText(/drbd\?orgId/), {
      target: { value: 'http://192.168.123.117:3000/' },
    });
    save();

    await waitFor(() =>
      expect(hoisted.errorMessage).toHaveBeenCalledWith(
        'Invalid DRBD dashboard URL. Please check the format and try again.',
      ),
    );
    expect(hoisted.dispatch.setting.saveGrafanaConfig).not.toHaveBeenCalled();
  });

  it('turning Grafana off turns the DRBD dashboard off with it', async () => {
    const { container } = renderSettings(<Dashboard />);
    await enableGrafana(container);
    fireEvent.click(switchByLabel(container, 'drbd-dashboard-mode'));
    expect(await screen.findByPlaceholderText(/drbd\?orgId/)).toBeInTheDocument();

    fireEvent.click(switchByLabel(container, 'dashboard-mode'));
    save();

    await waitFor(() =>
      expect(hoisted.dispatch.setting.saveGrafanaConfig).toHaveBeenCalledWith(
        expect.objectContaining({ enable: false, drbdEnable: false }),
      ),
    );
  });

  it('restores a stored config into both forms', async () => {
    hoisted.state.setting.grafanaConfig = {
      dashboardUrlTemplate: DASHBOARD_URL,
      dashboardUid: 'rYdddlPWk',
      panelIds: { ...DEFAULT_PANELS, cpu: 101 },
      drbdEnable: true,
      drbdUrl: DRBD_URL,
      drbdUid: 'f_tZtVlMz',
      drbdWriteRatePanelId: 128,
      drbdReadRatePanelId: 129,
    };
    const { container } = renderSettings(<Dashboard />);

    await waitFor(() => expect(switchByLabel(container, 'dashboard-mode')).toBeChecked());
    expect(switchByLabel(container, 'drbd-dashboard-mode')).toBeChecked();
    expect(urlInput('node-exporter-full')).toHaveValue(DASHBOARD_URL);
    expect(screen.getByPlaceholderText(/drbd\?orgId/)).toHaveValue(DRBD_URL);

    fireEvent.click(screen.getByText('Panel Configuration'));
    expect(await screen.findByRole('spinbutton', { name: 'CPU Panel ID' })).toHaveValue('101');

    fireEvent.click(screen.getByText('DRBD Panel Configuration'));
    expect(await screen.findByRole('spinbutton', { name: 'DRBD Write Rate Panel ID' })).toHaveValue('128');
  });

  it('keeps going when saving fails', async () => {
    hoisted.dispatch.setting.saveGrafanaConfig.mockRejectedValue(new Error('kvs down'));
    renderSettings(<Dashboard />);

    save();

    await waitFor(() => expect(hoisted.dispatch.setting.saveGrafanaConfig).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
