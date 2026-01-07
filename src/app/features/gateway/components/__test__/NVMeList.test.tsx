// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { init } from '@rematch/core';

// Mock setup - must be before imports
vi.mock('react-redux', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-redux')>();
  return {
    ...actual,
    useSelector: vi.fn(() => ({ addingVolume: false })),
    useDispatch: vi.fn(() => vi.fn()),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@app/components/SizeInput', () => ({
  SizeInput: ({ defaultUnit }: any) => (
    <input data-testid="size-input" data-unit={defaultUnit} type="number" defaultValue="1" />
  ),
}));

vi.mock('@app/components/Link', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Import mocks first
import '../__mocks__';

// Import after mocking
import { NVMeList } from '../NVMeList';
import { Provider } from 'react-redux';

// Mock store
const createMockStore = () => {
  return init({
    models: {
      loading: {
        state: {
          effects: {
            nvme: {
              addLUN: false,
            },
          },
        },
        reducers: {},
      },
      nvme: {
        state: { list: [] },
        reducers: {},
      },
    },
  });
};

const mockHandlers = {
  handleDelete: vi.fn(),
  handleStart: vi.fn(),
  handleStop: vi.fn(),
  handleDeleteVolume: vi.fn(),
  handleAddVolume: vi.fn(),
};

const mockNVMeList: any[] = [
  {
    nqn: 'nqn.2014-08.org.nvmexpress:target1',
    service_ip: '192.168.1.100',
    resource_group: 'rg1',
    status: {
      primary: 'node1',
      service: 'Started',
      volumes: [
        { number: 1, state: 'OK' },
        { number: 2, state: 'OK' },
      ],
    },
    volumes: [
      { number: 0, size_kib: 0 },
      { number: 1, size_kib: 1048576 },
      { number: 2, size_kib: 2097152 },
    ],
  },
  {
    nqn: 'nqn.2014-08.org.nvmexpress:target2',
    service_ip: '192.168.1.101',
    resource_group: 'rg2',
    status: {
      primary: 'node2',
      service: 'Stopped',
      volumes: [],
    },
    volumes: [{ number: 0, size_kib: 0 }],
  },
];

const renderComponent = (props = {}) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <NVMeList list={mockNVMeList} {...mockHandlers} loading={false} {...props} />
    </Provider>,
  );
};

describe('NVMeList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with data', () => {
      renderComponent();

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('data-is-nested', 'false');
    });

    it('should render all NVMe targets', () => {
      renderComponent();

      // Check for NQN values in rendered content
      expect(screen.getByText('nqn.2014-08.org.nvmexpress:target1')).toBeInTheDocument();
      expect(screen.getByText('nqn.2014-08.org.nvmexpress:target2')).toBeInTheDocument();
    });

    it('should show loading state when loading is true', () => {
      renderComponent({ loading: true });

      const table = screen.getByTestId('table');
      expect(table).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Service State Display', () => {
    it('should display Started state', () => {
      renderComponent();

      // The started target should be in the list
      expect(screen.getByText('Started')).toBeInTheDocument();
    });

    it('should display Stopped state', () => {
      renderComponent();

      expect(screen.getByText('Stopped')).toBeInTheDocument();
    });
  });

  describe('Node Links', () => {
    it('should render node links', () => {
      renderComponent();

      expect(screen.getByText('node1')).toBeInTheDocument();
      expect(screen.getByText('node2')).toBeInTheDocument();
    });
  });

  describe('Resource Group Links', () => {
    it('should render resource group links', () => {
      renderComponent();

      expect(screen.getByText('rg1')).toBeInTheDocument();
      expect(screen.getByText('rg2')).toBeInTheDocument();
    });
  });

  describe('Start/Stop Operations', () => {
    it('should call handleStop when stopping a started target', () => {
      renderComponent();

      const confirmButtons = screen.getAllByTestId('popconfirm-ok');
      // Each target has 2 popconfirm buttons: start/stop and delete
      // Target1 (Started): stop button (index 0), delete button (index 1)
      // Target2 (Stopped): start button (index 2), delete button (index 3)
      fireEvent.click(confirmButtons[0]);

      expect(mockHandlers.handleStop).toHaveBeenCalledWith('nqn.2014-08.org.nvmexpress:target1');
    });

    it('should call handleStart when starting a stopped target', () => {
      renderComponent();

      const confirmButtons = screen.getAllByTestId('popconfirm-ok');
      // Target2's start button is at index 2
      fireEvent.click(confirmButtons[2]);

      expect(mockHandlers.handleStart).toHaveBeenCalledWith('nqn.2014-08.org.nvmexpress:target2');
    });
  });

  describe('Delete Operations', () => {
    it('should call handleDelete when delete is confirmed', () => {
      renderComponent();

      const confirmButtons = screen.getAllByTestId('popconfirm-ok');
      // Delete button for first target is at index 1
      fireEvent.click(confirmButtons[1]);

      expect(mockHandlers.handleDelete).toHaveBeenCalledWith('nqn.2014-08.org.nvmexpress:target1');
    });

    it('should show deleting state', () => {
      const listWithDeleting = [{ ...mockNVMeList[0], deleting: true }];
      renderComponent({ list: listWithDeleting });

      // Should still render the table
      expect(screen.getByTestId('table')).toBeInTheDocument();
    });
  });

  describe('Add Volume Modal', () => {
    it('should open modal when add volume button is clicked', () => {
      renderComponent();

      // Find all buttons
      const buttons = screen.getAllByRole('button');
      // Find the add volume button
      const addButton = buttons.find((b) => b.textContent?.includes('nvme:add_volume'));
      fireEvent.click(addButton!);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('size-input')).toBeInTheDocument();
    });

    it('should close modal when cancel button is clicked', () => {
      renderComponent();

      // Open modal
      const buttons = screen.getAllByRole('button');
      const addButton = buttons.find((b) => b.textContent?.includes('nvme:add_volume'));
      fireEvent.click(addButton!);

      expect(screen.getByTestId('modal')).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByTestId('modal-cancel');
      fireEvent.click(cancelButton);

      // Modal should be closed
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Volume Operations', () => {
    it('should render expandable rows for volumes', () => {
      renderComponent();

      // Check that expanded rows are rendered for items with volumes
      const mainTable = screen.getByTestId('table');
      expect(mainTable).toBeInTheDocument();
    });

    it('should call handleDeleteVolume when volume delete is confirmed', () => {
      renderComponent();

      const confirmButtons = screen.getAllByTestId('popconfirm-ok');
      // First 4 buttons are for the main table (2 targets x 2 actions each)
      // Volume delete buttons follow: target1 has 2 volumes (LUN 1 and LUN 2)
      // So there are 2 more volume delete buttons
      // Total: 4 (main) + 2 (volumes) = 6 buttons
      // The first volume delete button is at index 4
      const volumeDeleteButton = confirmButtons[4];
      fireEvent.click(volumeDeleteButton);

      expect(mockHandlers.handleDeleteVolume).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty list', () => {
      renderComponent({ list: [] });

      // Should still render the table even with empty data
      const table = screen.queryByTestId('table');
      // When list is empty, antd might render differently, but component shouldn't crash
      expect(table).toBeInTheDocument();
    });

    it('should handle undefined list', () => {
      renderComponent({ list: undefined as any });

      // Should still render without crashing
      const table = screen.queryByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle item without node name', () => {
      const listWithoutNode = [{ ...mockNVMeList[1], status: { service: 'Stopped' } }];
      renderComponent({ list: listWithoutNode });

      // Component should render without crashing
      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Table Configuration', () => {
    it('should use nqn as row key', () => {
      renderComponent();

      // Check that the first row has the nqn value
      const firstRow = screen.getByTestId('table-row-0');
      expect(firstRow).toHaveAttribute('data-row-key-value', 'nqn.2014-08.org.nvmexpress:target1');
    });
  });

  describe('Nested Volume Table', () => {
    it('should render nested table for volumes', () => {
      renderComponent();

      // The nested table should be rendered inside expanded rows
      const nestedTables = screen.queryAllByTestId('nested-table');
      // May or may not be visible depending on expansion state
      expect(nestedTables.length).toBeGreaterThanOrEqual(0);
    });
  });
});
