// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

const clientGet = vi.fn();
// Typed with its config so the assertions below can read mock.calls[n][0].
const axiosCreate = vi.fn((_config?: { headers?: Record<string, string> }) => ({ get: clientGet }));
vi.mock('axios', () => ({
  default: { create: (config?: { headers?: Record<string, string> }) => axiosCreate(config) },
}));
vi.mock('@app/utils/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  getDatasources,
  searchDashboards,
  getDashboardByUid,
  extractPanelInfo,
  extractDatasource,
  testConnection,
} from '../api';

const config = { baseUrl: 'https://grafana.example:3000', apiKey: 'glsa_key' };

describe('grafana api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientGet.mockResolvedValue({ data: [] });
  });

  it('talks to Grafana through the proxy, naming the target in a header, with a bearer token when given', async () => {
    await searchDashboards(config);
    expect(axiosCreate).toHaveBeenCalledWith({
      baseURL: '/grafana-proxy',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Grafana-Url': 'https://grafana.example:3000',
        Authorization: 'Bearer glsa_key',
      },
    });

    await searchDashboards({ baseUrl: 'http://g' });
    const headers = axiosCreate.mock.calls[1][0]?.headers;
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('getDatasources keeps only Prometheus ones and returns nothing on failure', async () => {
    clientGet.mockResolvedValue({
      data: [
        { uid: 'p1', type: 'prometheus' },
        { uid: 'l1', type: 'loki' },
      ],
    });
    await expect(getDatasources(config)).resolves.toEqual([{ uid: 'p1', type: 'prometheus' }]);
    expect(clientGet).toHaveBeenCalledWith('/api/datasources');

    clientGet.mockRejectedValue(new Error('401'));
    await expect(getDatasources(config)).resolves.toEqual([]);
  });

  it('searchDashboards asks for dashboards, with the query when given, and rethrows', async () => {
    await searchDashboards(config);
    expect(clientGet).toHaveBeenCalledWith('/api/search', { params: { type: 'dash-db' } });
    await searchDashboards(config, 'node');
    expect(clientGet).toHaveBeenLastCalledWith('/api/search', { params: { type: 'dash-db', query: 'node' } });
    clientGet.mockRejectedValue(new Error('offline'));
    await expect(searchDashboards(config)).rejects.toThrow('offline');
  });

  it('getDashboardByUid reads the dashboard and rethrows', async () => {
    clientGet.mockResolvedValue({ data: { dashboard: { uid: 'abc' } } });
    await expect(getDashboardByUid(config, 'abc')).resolves.toEqual({ dashboard: { uid: 'abc' } });
    expect(clientGet).toHaveBeenCalledWith('/api/dashboards/uid/abc');
    clientGet.mockRejectedValue(new Error('404'));
    await expect(getDashboardByUid(config, 'abc')).rejects.toThrow('404');
  });

  it('testConnection is true when a search works and false otherwise', async () => {
    await expect(testConnection('http://g', 'k')).resolves.toBe(true);
    clientGet.mockRejectedValue(new Error('cors'));
    await expect(testConnection('http://g')).resolves.toBe(false);
  });

  describe('extractPanelInfo', () => {
    it('maps the six well-known panels by exact or case-insensitive title, including panels inside rows', () => {
      const dashboard = {
        panels: [
          { id: 1, title: 'CPU Basic' },
          { id: 2, title: 'memory basic' },
          {
            id: 10,
            type: 'row',
            title: 'Storage',
            panels: [
              { id: 3, title: 'Disk Space Used Basic' },
              { id: 4, title: 'Disk IOps' },
            ],
          },
          { id: 11, type: 'row', collapsed: true, panels: [{ id: 5, title: 'Network Traffic Basic' }] },
          { id: 6, title: 'I/O Usage Read / Write' },
          { id: 7, title: 'Something else' },
        ],
      };
      expect(extractPanelInfo(dashboard)).toEqual({ cpu: 1, memory: 2, disk: 3, diskIops: 4, network: 5, ioUsage: 6 });
    });

    it('falls back to fuzzy matching for the IOPS and I/O usage panels', () => {
      const dashboard = {
        panels: [
          { id: 8, title: 'Disk I/O Operations per second' },
          { id: 9, title: 'Bytes read / write per device' },
        ],
      };
      expect(extractPanelInfo(dashboard)).toEqual({ diskIops: 8, ioUsage: 9 });
    });

    it('ignores panels without a title or id and copes with an empty dashboard', () => {
      expect(extractPanelInfo({ panels: [{ id: 1 }, { title: 'CPU' }] })).toEqual({});
      expect(extractPanelInfo({})).toEqual({});
    });
  });

  describe('extractDatasource', () => {
    it('prefers the prometheus template variable, skipping the "default" placeholder', () => {
      const withCurrent = {
        templating: { list: [{ type: 'datasource', query: 'prometheus', current: { value: 'prom-uid' } }] },
      };
      expect(extractDatasource(withCurrent)).toBe('prom-uid');

      const withOptions = {
        templating: {
          list: [
            {
              type: 'datasource',
              query: 'prometheus',
              current: { value: '$__all' },
              options: [{ value: '$__all' }, { value: 'default' }, { value: 'prom-2' }],
            },
          ],
        },
      };
      expect(extractDatasource(withOptions)).toBe('prom-2');

      const onlyDefault = {
        templating: { list: [{ type: 'datasource', query: 'prometheus', current: { value: 'default' } }] },
        panels: [{ datasource: { uid: 'ignored-once-default' } }],
      };
      expect(extractDatasource(onlyDefault)).toBeNull();
    });

    it('falls back to the first panel or target datasource that is not a variable reference', () => {
      const dashboard = {
        panels: [
          { datasource: { uid: '${ds_prometheus}' } },
          { targets: [{ datasource: { uid: '$ds' } }] },
          { targets: [{ datasource: { uid: 'target-uid' } }] },
          { datasource: { uid: 'panel-uid' } },
        ],
      };
      expect(extractDatasource(dashboard)).toBe('target-uid');
      expect(extractDatasource({ panels: [] })).toBeNull();
    });
  });
});
