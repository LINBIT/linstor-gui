// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import GrafanaCharts from '../GrafanaCharts';
import type { GrafanaConfig } from '@app/features/settings/types';

const settings = vi.hoisted(() => ({ grafanaConfig: null as GrafanaConfig | null }));

vi.mock('@app/features/settings/useSettings', () => ({
  useSettings: () => ({ grafanaConfig: settings.grafanaConfig }),
}));

vi.mock('@app/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/hooks')>()),
  usePreloadIframes: vi.fn(),
  useThemeMode: () => ({ mode: 'light' }),
}));

const config = (over: Partial<GrafanaConfig> = {}): GrafanaConfig => ({
  enable: true,
  baseUrl: 'https://grafana.example',
  dashboardUid: 'rYdddlPWk',
  panelIds: { cpu: 77, memory: 78 },
  ...over,
});

const frames = () => Array.from(document.querySelectorAll('iframe'));

describe('GrafanaCharts', () => {
  beforeEach(() => {
    settings.grafanaConfig = config();
  });

  it('shows each configured panel for the given node', () => {
    render(<GrafanaCharts hostname="gui01" />);

    expect(frames()).toHaveLength(2);
    for (const frame of frames()) {
      const url = new URL(frame.src);
      expect(url.pathname).toBe('/d-solo/rYdddlPWk/_');
      // Node Exporter Full selects the node by its hostname.
      expect(url.searchParams.get('var-nodename')).toBe('gui01');
      expect(url.searchParams.get('theme')).toBe('light');
    }
    expect(new URL(frames()[0].src).searchParams.get('panelId')).toBe('77');
  });

  it('leaves the titles to the panels themselves', () => {
    render(<GrafanaCharts hostname="gui01" />);

    expect(screen.getByTitle('CPU Usage').tagName).toBe('IFRAME');
    expect(screen.queryByText('CPU Usage')).toBeNull();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  it('shows nothing while Grafana is switched off', () => {
    settings.grafanaConfig = config({ enable: false });
    const { container } = render(<GrafanaCharts hostname="gui01" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing without a dashboard', () => {
    settings.grafanaConfig = config({ dashboardUid: undefined });
    const { container } = render(<GrafanaCharts hostname="gui01" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('says so when no panel is configured', () => {
    settings.grafanaConfig = config({ panelIds: {} });
    render(<GrafanaCharts hostname="gui01" />);
    expect(frames()).toHaveLength(0);
    expect(screen.getByText('No Grafana panels configured. Please check your Grafana settings.')).toBeInTheDocument();
  });
});
