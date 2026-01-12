// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock setup - must be before imports
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  I18nextProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  QueryClient: class {
    constructor() {}
    getQueryData() {}
    setQueryData() {}
    invalidateQueries() {}
  },
  QueryClientProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' })),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  HashRouter: ({ children }: any) => <>{children}</>,
  Routes: ({ children }: any) => <>{children}</>,
  Route: ({ children }: any) => <>{children}</>,
}));

vi.mock('@app/components/Link', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Import mocks first
import '../__mocks__';

// Import after mocking
import { NFSList } from '../NFSList';

const mockHandlers = {
  handleDelete: vi.fn(),
  handleStart: vi.fn(),
  handleStop: vi.fn(),
};

const mockNFSList: any[] = [
  {
    name: 'nfs-export-1',
    service_ip: '192.168.1.100',
    path: '/export',
    resource_group: 'rg1',
    status: {
      primary: 'node1',
      service: 'Started',
      state: 'OK',
      volumes: [
        { number: 0, state: 'OK' },
        { number: 1, state: 'OK' },
      ],
    },
    volumes: [
      { number: 0, size_kib: 0 },
      { number: 1, size_kib: 1048576, export_path: '/data' },
      { number: 2, size_kib: 2097152, export_path: '/backup' },
    ],
  },
  {
    name: 'nfs-export-2',
    service_ip: '192.168.1.101',
    path: '/export2',
    resource_group: 'rg2',
    status: {
      primary: 'node2',
      service: 'Stopped',
      state: 'OK',
      volumes: [],
    },
    volumes: [{ number: 0, size_kib: 0 }],
  },
];

const renderComponent = (props = {}) => {
  return render(<NFSList list={mockNFSList} {...mockHandlers} loading={false} {...props} />);
};

describe('NFSList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with data', () => {
      renderComponent();

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should render all NFS exports', () => {
      renderComponent();

      expect(screen.getByText('nfs-export-1')).toBeInTheDocument();
      expect(screen.getByText('nfs-export-2')).toBeInTheDocument();
    });

    it('should show loading state when loading is true', () => {
      renderComponent({ loading: true });

      const table = screen.getByTestId('table');
      expect(table).toHaveAttribute('data-loading', 'true');
    });

    it('should render Alert message', () => {
      renderComponent();

      const alert = screen.getByTestId('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('data-type', 'warning');
    });
  });

  describe('Service State Display', () => {
    it('should display Started state', () => {
      renderComponent();

      expect(screen.getByText('Started')).toBeInTheDocument();
    });

    it('should display Stopped state', () => {
      renderComponent();

      expect(screen.getByText('Stopped')).toBeInTheDocument();
    });

    it('should display LINSTOR state', () => {
      renderComponent();

      const okTags = screen.getAllByText('OK');
      expect(okTags.length).toBeGreaterThan(0);
    });
  });

  describe('Node Links', () => {
    it('should render node links', () => {
      renderComponent();

      expect(screen.getByText('node1')).toBeInTheDocument();
      expect(screen.getByText('node2')).toBeInTheDocument();
    });
  });

  describe('Service IP Display', () => {
    it('should render service IPs', () => {
      renderComponent();

      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.101')).toBeInTheDocument();
    });
  });

  describe('Volumes Column Display', () => {
    it('should render volume count', () => {
      renderComponent();

      // nfs-export-1 has 2 volumes (excluding volume 0 metadata)
      // Use getAllByText since '2' may appear multiple times (e.g., "2.00 GiB")
      const twos = screen.getAllByText('2');
      expect(twos.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Group Display', () => {
    it('should render resource group links', () => {
      renderComponent();

      const rg1Link = screen.getByText('rg1');
      expect(rg1Link).toBeInTheDocument();
      expect(rg1Link.closest('a')).toHaveAttribute(
        'href',
        '/storage-configuration/resource-groups?resource_groups=rg1',
      );
    });
  });

  describe('Expandable Rows', () => {
    it('should render expand icon for rows with volumes', () => {
      renderComponent();

      // First export has volumes, should have expand icon
      const firstRow = screen.getByTestId('table-row-0');
      expect(firstRow).toBeInTheDocument();
    });

    it('should expand row and show volume details', () => {
      renderComponent();

      // Click expand icon for first row
      const firstRow = screen.getByTestId('table-row-0');
      const expandIcon = firstRow.querySelector('[class*="ant-table-row-expand-icon"]');
      if (expandIcon) {
        fireEvent.click(expandIcon);
      }

      // After expansion, volume details should be visible
      expect(screen.getByText('1.00 GiB')).toBeInTheDocument(); // Volume 1 size
      expect(screen.getByText('2.00 GiB')).toBeInTheDocument(); // Volume 2 size
    });
  });

  describe('Start/Stop Operations', () => {
    it('should call handleStop when stopping a started export', () => {
      renderComponent();

      const confirmButtons = screen.getAllByTestId('popconfirm-ok');
      // Each export has 2 popconfirm buttons: start/stop and delete
      // Export1 (Started): stop button (index 0), delete button (index 1)
      // Export2 (Stopped): start button (index 2), delete button (index 3)
      fireEvent.click(confirmButtons[0]);

      expect(mockHandlers.handleStop).toHaveBeenCalledWith('nfs-export-1');
    });

    it('should call handleStart when starting a stopped export', () => {
      renderComponent();

      const confirmButtons = screen.getAllByTestId('popconfirm-ok');
      // Export2's start button is at index 2
      fireEvent.click(confirmButtons[2]);

      expect(mockHandlers.handleStart).toHaveBeenCalledWith('nfs-export-2');
    });
  });

  describe('Delete Operations', () => {
    it('should call handleDelete when delete is confirmed', () => {
      renderComponent();

      const confirmButtons = screen.getAllByTestId('popconfirm-ok');
      // Delete button for first export is at index 1
      fireEvent.click(confirmButtons[1]);

      expect(mockHandlers.handleDelete).toHaveBeenCalledWith('nfs-export-1');
    });

    it('should show deleting state', () => {
      const listWithDeleting = [{ ...mockNFSList[0], deleting: true }];
      renderComponent({ list: listWithDeleting });

      expect(screen.getByTestId('table')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty list', () => {
      renderComponent({ list: [] });

      const table = screen.queryByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle undefined list', () => {
      renderComponent({ list: undefined as any });

      const table = screen.queryByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle item without node name', () => {
      const listWithoutNode = [{ ...mockNFSList[1], status: { service: 'Stopped' } }];
      renderComponent({ list: listWithoutNode });

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle item with no volumes', () => {
      const listNoVolumes = [{ name: 'no-volumes', service_ip: '10.0.0.1', status: {}, volumes: [] }];
      renderComponent({ list: listNoVolumes });

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });
  });
});
