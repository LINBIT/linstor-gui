// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import axios from 'axios';

interface GrafanaApiConfig {
  baseUrl: string;
  apiKey?: string;
}

// Create a custom axios instance for Grafana API
const createGrafanaClient = (config: GrafanaApiConfig) => {
  // Always use proxy to avoid CORS issues
  // The proxy must be configured on the server (Java code, nginx, etc.)
  const client = axios.create({
    baseURL: '/grafana-proxy',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Grafana-Url': config.baseUrl,
      ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
    },
  });

  return client;
};

// Get all datasources
export const getDatasources = async (config: GrafanaApiConfig) => {
  const client = createGrafanaClient(config);
  try {
    const response = await client.get('/api/datasources');
    // Filter for Prometheus datasources
    return response.data.filter((ds: any) => ds.type === 'prometheus');
  } catch (error) {
    console.error('Error fetching datasources:', error);
    // Return empty array if datasources API fails (might need auth)
    return [];
  }
};

// Search for dashboards
export const searchDashboards = async (config: GrafanaApiConfig, query?: string) => {
  const client = createGrafanaClient(config);
  try {
    const params: any = { type: 'dash-db' };
    if (query) params.query = query;

    const response = await client.get('/api/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching dashboards:', error);
    throw error;
  }
};

// Get dashboard by UID
export const getDashboardByUid = async (config: GrafanaApiConfig, uid: string) => {
  const client = createGrafanaClient(config);
  try {
    const response = await client.get(`/api/dashboards/uid/${uid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    throw error;
  }
};

// Extract panel information from dashboard by searching panel titles
export const extractPanelInfo = (dashboard: any) => {
  // Flatten all panels including those in rows
  const getAllPanels = (items: any[]): any[] => {
    let allPanels: any[] = [];

    for (const item of items) {
      if (item.type === 'row' && item.panels) {
        // If it's a row, get panels from inside it
        allPanels = allPanels.concat(item.panels);
      } else if (item.type === 'panel' || item.id) {
        // Regular panel
        allPanels.push(item);
      }

      // Also check for collapsed rows
      if (item.collapsed && item.panels) {
        allPanels = allPanels.concat(item.panels);
      }
    }

    return allPanels;
  };

  const panels = getAllPanels(dashboard.panels || []);
  const panelMap: Record<string, number> = {};

  // Define EXACT titles to search for - these are the actual panel titles in Grafana
  const titleMappings: Record<string, string[]> = {
    cpu: ['CPU', 'CPU Basic'],
    memory: ['Memory Stack', 'Memory Basic', 'Memory'],
    network: ['Network Traffic', 'Network Traffic Basic'],
    disk: ['Disk Space Used', 'Disk Space Used Basic', 'Disk Usage'],
    diskIops: ['Disk IOps', 'Disk IOPS', 'Disk I/O Operations', 'Disk I/O'],
    ioUsage: ['I/O Usage Read / Write', 'I/O Usage Read/Write', 'IO Usage Read / Write', 'I/O Usage'],
  };

  // First, log all available panels for debugging
  console.log('Available panels in dashboard:');
  panels.forEach((panel: any) => {
    if (panel.title && panel.id) {
      console.log(`  - "${panel.title}" (ID: ${panel.id})`);
    }
  });

  panels.forEach((panel: any) => {
    const title = panel.title?.trim() || '';
    if (!panel.id || !title) return;

    // Check for exact title matches with variations
    Object.entries(titleMappings).forEach(([category, possibleTitles]) => {
      if (panelMap[category]) return; // Already found one for this category

      // Check each possible title variation
      for (const possibleTitle of possibleTitles) {
        // First try exact match
        if (title === possibleTitle) {
          console.log(`✓ Exact match: "${panel.title}" to ${category} (ID: ${panel.id})`);
          panelMap[category] = panel.id;
          break;
        }
        // Then try case-insensitive match
        if (title.toLowerCase() === possibleTitle.toLowerCase()) {
          console.log(`✓ Case-insensitive match: "${panel.title}" to ${category} (ID: ${panel.id})`);
          panelMap[category] = panel.id;
          break;
        }
      }
    });
  });

  // If still missing diskIops or ioUsage, try more flexible matching
  if (!panelMap.diskIops) {
    const diskIopsPanel = panels.find(
      (p: any) =>
        p.title &&
        p.id &&
        (p.title.toLowerCase().includes('iops') ||
          p.title.toLowerCase().includes('i/o operations') ||
          (p.title.toLowerCase().includes('disk') && p.title.toLowerCase().includes('ops'))),
    );
    if (diskIopsPanel) {
      console.log(`✓ Fuzzy match: "${diskIopsPanel.title}" to diskIops (ID: ${diskIopsPanel.id})`);
      panelMap.diskIops = diskIopsPanel.id;
    }
  }

  if (!panelMap.ioUsage) {
    const ioUsagePanel = panels.find(
      (p: any) =>
        p.title &&
        p.id &&
        (p.title.toLowerCase().includes('i/o usage') ||
          p.title.toLowerCase().includes('io usage') ||
          (p.title.toLowerCase().includes('read') && p.title.toLowerCase().includes('write'))),
    );
    if (ioUsagePanel) {
      console.log(`✓ Fuzzy match: "${ioUsagePanel.title}" to ioUsage (ID: ${ioUsagePanel.id})`);
      panelMap.ioUsage = ioUsagePanel.id;
    }
  }

  // Log which panels were not found and show possible candidates
  Object.entries(titleMappings).forEach(([category, titles]) => {
    if (!panelMap[category]) {
      console.warn(`⚠ Could not find panel for ${category}. Looking for titles: ${titles.join(', ')}`);

      // Show all panels with their titles so we can see what's actually there
      console.log(`  Searching among ${panels.length} panels for ${category}...`);
    }
  });

  console.log('Final panel mapping:', panelMap);
  console.log(`Found ${Object.keys(panelMap).length} of 6 panels`);

  // Show ALL panel titles and IDs for debugging
  console.log('ALL panels in dashboard:');
  panels.forEach((p: any) => {
    if (p.title && p.id) {
      const matched = Object.entries(panelMap).find(([_, id]) => id === p.id);
      const status = matched ? `✓ (mapped to ${matched[0]})` : '✗ (not mapped)';
      console.log(`  ${status} ID: ${p.id}, Title: "${p.title}"`);
    }
  });

  return panelMap;
};

// Extract datasource from dashboard
export const extractDatasource = (dashboard: any): string | null => {
  // First check templating variables for datasource (most reliable)
  if (dashboard.templating?.list) {
    for (const variable of dashboard.templating.list) {
      if (variable.type === 'datasource' && variable.query === 'prometheus') {
        // Check current value first, but ignore 'default' as it's a placeholder
        if (variable.current?.value && variable.current.value !== '$__all' && variable.current.value !== 'default') {
          console.log('Found datasource from template variable:', variable.current.value);
          return variable.current.value;
        }
        // Check default or first option, skipping 'default'
        if (variable.options?.length > 0) {
          const validOption = variable.options.find(
            (opt: any) => opt.value && opt.value !== '$__all' && opt.value !== 'default',
          );
          if (validOption) {
            console.log('Found datasource from template options:', validOption.value);
            return validOption.value;
          }
        }
        // If only 'default' was found, we'll return null to let the UI handle it
        if (variable.current?.value === 'default') {
          console.log('Dashboard uses "default" datasource, will need to select actual datasource');
          return null;
        }
      }
    }
  }

  // Then check panels for datasource
  const panels = dashboard.panels || [];
  for (const panel of panels) {
    // Check for datasource UID - skip if it's a variable reference
    if (panel.datasource?.uid) {
      // Skip variable references like ${ds_prometheus}
      if (panel.datasource.uid.startsWith('${') || panel.datasource.uid.startsWith('$')) {
        console.log('Found datasource variable reference, skipping:', panel.datasource.uid);
        continue;
      }
      console.log('Found datasource from panel:', panel.datasource.uid);
      return panel.datasource.uid;
    }
    // Check targets for datasource
    if (panel.targets?.length > 0) {
      const target = panel.targets[0];
      if (target.datasource?.uid) {
        // Skip variable references
        if (target.datasource.uid.startsWith('${') || target.datasource.uid.startsWith('$')) {
          console.log('Found datasource variable reference in target, skipping:', target.datasource.uid);
          continue;
        }
        console.log('Found datasource from panel target:', target.datasource.uid);
        return target.datasource.uid;
      }
    }
  }

  console.log('No datasource found in dashboard');
  return null;
};

// Test Grafana connection
export const testConnection = async (url: string, apiKey?: string): Promise<boolean> => {
  try {
    const config = { baseUrl: url, apiKey };
    await searchDashboards(config);
    return true;
  } catch (error) {
    // If CORS blocks it, we can still proceed with manual config
    console.warn('Grafana API test failed (likely CORS), proceeding with manual configuration');
    return false; // Return false but allow manual configuration
  }
};
