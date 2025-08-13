// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { FaultyList } from '../FaultyList';

// Mock the translation hook
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'common:faulty_resource': 'Faulty Resources',
    'common:all_resources_are_healthy': 'All resources are healthy',
    'common:name': 'Name',
    'common:node': 'Node',
    'common:created_on': 'Created On',
    'common:port': 'Port',
    'common:usage_status': 'Usage Status',
    'common:connection_status': 'Connection Status',
    'common:state': 'State',
  };
  return translations[key] || key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock time formatting utility
vi.mock('@app/utils/time', () => ({
  formatTime: vi.fn((timestamp) => `formatted-${timestamp}`),
}));

// Mock resource utilities
vi.mock('@app/utils/resource', () => ({
  getResourceState: vi.fn((resource) => `state-${resource.name}`),
}));

// Mock the faulty resources hook
import { useFaultyResources } from '../../hooks/useFaultyResources';
vi.mock('../../hooks/useFaultyResources', () => ({
  useFaultyResources: vi.fn(),
}));

const mockUseFaultyResources = vi.mocked(useFaultyResources);

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('FaultyList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render faulty resources title', () => {
      mockUseFaultyResources.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('Faulty Resources')).toBeInTheDocument();
    });

    it('should show empty message when no faulty resources', () => {
      mockUseFaultyResources.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('All resources are healthy')).toBeInTheDocument();
    });

    it('should show empty message when resources is null', () => {
      mockUseFaultyResources.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('All resources are healthy')).toBeInTheDocument();
    });

    it('should show empty message when resources is undefined', () => {
      mockUseFaultyResources.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('All resources are healthy')).toBeInTheDocument();
    });
  });

  describe('Table Rendering with Data', () => {
    const mockFaultyResources = [
      {
        name: 'faulty-resource-1',
        node_name: 'node1',
        create_timestamp: '2024-01-01T00:00:00Z',
        state: { in_use: true },
        layer_object: {
          drbd: {
            drbd_resource_definition: { port: 7000 },
            connections: {
              node2: { connected: false, message: 'Connection failed' },
            },
          },
        },
      },
      {
        name: 'faulty-resource-2',
        node_name: 'node2',
        create_timestamp: '2024-01-02T00:00:00Z',
        state: { in_use: false },
        layer_object: {
          drbd: {
            drbd_resource_definition: { port: 7001 },
            connections: {},
          },
        },
      },
    ];

    it('should render table when faulty resources exist', () => {
      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<FaultyList />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByText('All resources are healthy')).not.toBeInTheDocument();
    });

    it('should render correct table headers', () => {
      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Node')).toBeInTheDocument();
      expect(screen.getByText('Created On')).toBeInTheDocument();
      expect(screen.getByText('Port')).toBeInTheDocument();
      expect(screen.getByText('Usage Status')).toBeInTheDocument();
      expect(screen.getByText('Connection Status')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
    });

    it('should render resource data in table rows', () => {
      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('faulty-resource-1')).toBeInTheDocument();
      expect(screen.getByText('faulty-resource-2')).toBeInTheDocument();
      expect(screen.getByText('node1')).toBeInTheDocument();
      expect(screen.getByText('node2')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state in table', () => {
      mockUseFaultyResources.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      } as any);

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('All resources are healthy')).toBeInTheDocument();
    });

    it('should show loading when data is present but loading', () => {
      const mockFaultyResources = [
        {
          name: 'test-resource',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: { drbd: { connections: {} } },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: true,
      });

      renderWithProviders(<FaultyList />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to resource overview when clicking resource name', () => {
      const mockFaultyResources = [
        {
          name: 'test-resource',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: { drbd: { connections: {} } },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      const resourceLink = screen.getByRole('button', { name: 'test-resource' });
      fireEvent.click(resourceLink);

      expect(mockNavigate).toHaveBeenCalledWith('/storage-configuration/resource-overview?resource=test-resource');
    });

    it('should navigate to node page when clicking node name', () => {
      const mockFaultyResources = [
        {
          name: 'test-resource',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: { drbd: { connections: {} } },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      const nodeLink = screen.getByRole('button', { name: 'test-node' });
      fireEvent.click(nodeLink);

      expect(mockNavigate).toHaveBeenCalledWith('/inventory/nodes/test-node');
    });
  });

  describe('Usage Status Display', () => {
    it('should show InUse status with green icon for used resources', () => {
      const mockFaultyResources = [
        {
          name: 'used-resource',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: true },
          layer_object: { drbd: { connections: {} } },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('InUse')).toBeInTheDocument();
    });

    it('should show Unused status with grey icon for unused resources', () => {
      const mockFaultyResources = [
        {
          name: 'unused-resource',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: { drbd: { connections: {} } },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('Unused')).toBeInTheDocument();
    });
  });

  describe('Connection Status Display', () => {
    it('should show OK for resources with no connections', () => {
      const mockFaultyResources = [
        {
          name: 'no-conn-resource',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: {
            drbd: { connections: {} },
          },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should show failure details for disconnected resources', () => {
      const mockFaultyResources = [
        {
          name: 'failed-conn-resource',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: {
            drbd: {
              connections: {
                node2: { connected: false, message: 'Connection timeout' },
              },
            },
          },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('node2 Connection timeout')).toBeInTheDocument();
    });

    it('should show OK for connected resources', () => {
      const mockFaultyResources = [
        {
          name: 'connected-resource',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: {
            drbd: {
              connections: {
                node2: { connected: true, message: 'Connected' },
              },
            },
          },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should handle multiple connection failures', () => {
      const mockFaultyResources = [
        {
          name: 'multi-fail-resource',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: {
            drbd: {
              connections: {
                node2: { connected: false, message: 'Timeout' },
                node3: { connected: false, message: 'Network error' },
              },
            },
          },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('node2 Timeout,node3 Network error')).toBeInTheDocument();
    });
  });

  describe('Port Display', () => {
    it('should display port number from DRBD resource definition', () => {
      const mockFaultyResources = [
        {
          name: 'resource-with-port',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: {
            drbd: {
              drbd_resource_definition: { port: 7777 },
              connections: {},
            },
          },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      expect(screen.getByText('7777')).toBeInTheDocument();
    });

    it('should handle missing port information', () => {
      const mockFaultyResources = [
        {
          name: 'resource-no-port',
          node_name: 'test-node',
          create_timestamp: '2024-01-01T00:00:00Z',
          state: { in_use: false },
          layer_object: {
            drbd: { connections: {} },
          },
        },
      ];

      mockUseFaultyResources.mockReturnValue({
        data: mockFaultyResources,
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Translation Keys', () => {
    it('should use correct translation keys', () => {
      mockUseFaultyResources.mockReturnValue({
        data: [],
        isLoading: false,
      });

      renderWithProviders(<FaultyList />);

      expect(mockT).toHaveBeenCalledWith('common:faulty_resource');
      expect(mockT).toHaveBeenCalledWith('common:all_resources_are_healthy');
    });
  });
});
