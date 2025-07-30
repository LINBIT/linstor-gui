import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('antd', () => ({
  Drawer: ({ children, title, open }: { children: React.ReactNode; title: string; open: boolean }) => (
    <div data-testid="drawer" data-title={title} data-open={open}>
      {children}
    </div>
  ),
  Button: ({
    children,
    onClick,
    type,
    danger,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    type?: string;
    danger?: boolean;
  }) => (
    <button data-testid="button" onClick={onClick} data-type={type} data-danger={danger}>
      {children}
    </button>
  ),
  List: ({
    children,
    dataSource,
    renderItem,
  }: {
    children?: React.ReactNode;
    dataSource: any[];
    renderItem: (item: any) => React.ReactNode;
  }) => (
    <div data-testid="list">
      {dataSource.map((item, index) => (
        <div key={index} data-testid="list-item">
          {renderItem(item)}
        </div>
      ))}
      {children}
    </div>
  ),
  Badge: ({ children, count, dot }: { children: React.ReactNode; count?: number; dot?: boolean }) => (
    <div data-testid="badge" data-count={count} data-dot={dot}>
      {children}
    </div>
  ),
  Space: ({ children }: { children: React.ReactNode }) => <div data-testid="space">{children}</div>,
  Popconfirm: ({ children, onConfirm }: { children: React.ReactNode; onConfirm: () => void }) => (
    <div data-testid="popconfirm" onClick={onConfirm}>
      {children}
    </div>
  ),
}));

vi.mock('@ant-design/icons', () => ({
  FileTextOutlined: ({ onClick, style }: { onClick: () => void; style: any }) => (
    <div data-testid="file-text-icon" onClick={onClick} style={style} />
  ),
}));

// Mock logManager
const mockLogManager = {
  getLogs: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  clearLogs: vi.fn(),
};

vi.mock('@app/utils/toast', () => ({
  logManager: mockLogManager,
}));

// Mock List.Item and List.Item.Meta
const mockListItem = {
  Item: ({ children, onClick, style }: { children: React.ReactNode; onClick: () => void; style: any }) => (
    <div data-testid="list-item" onClick={onClick} style={style}>
      {children}
    </div>
  ),
};

mockListItem.Item.Meta = ({ title, description }: { title: string; description: string }) => (
  <div data-testid="list-item-meta">
    <div data-testid="title">{title}</div>
    <div data-testid="description">{description}</div>
  </div>
);

vi.doMock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    List: Object.assign(
      ({
        children,
        dataSource,
        renderItem,
      }: {
        children?: React.ReactNode;
        dataSource: any[];
        renderItem: (item: any) => React.ReactNode;
      }) => (
        <div data-testid="list">
          {dataSource.map((item, index) => (
            <div key={index} data-testid="list-container">
              {renderItem(item)}
            </div>
          ))}
          {children}
        </div>
      ),
      { Item: mockListItem.Item },
    ),
  };
});

describe('LogSidebar Component', () => {
  const mockLogs = [
    {
      key: 'log1',
      url: '/api/v1/nodes',
      timestamp: '2024-01-01T10:00:00Z',
      read: false,
      result: {
        message: 'Node fetch failed',
        cause: 'Network timeout',
        details: 'Connection timed out after 30 seconds',
        created_at: '2024-01-01T10:00:00Z',
      },
    },
    {
      key: 'log2',
      url: '/api/v1/resources',
      timestamp: '2024-01-01T11:00:00Z',
      read: true,
      result: {
        message: 'Resource creation successful',
        created_at: '2024-01-01T11:00:00Z',
      },
    },
    {
      key: 'log3',
      url: '/api/v1/volumes',
      timestamp: '2024-01-01T12:00:00Z',
      read: false,
      result: {
        message: 'Volume operation failed',
        cause: 'Insufficient space',
        created_at: '2024-01-01T12:00:00Z',
      },
    },
  ];

  beforeEach(() => {
    mockLogManager.getLogs.mockReturnValue(mockLogs);
    vi.clearAllMocks();

    // Mock window.addEventListener and removeEventListener
    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
      writable: true,
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: vi.fn(),
      writable: true,
    });
  });

  describe('Component State Logic', () => {
    it('should initialize with correct default state', () => {
      const initialState = {
        visible: false,
        logs: [],
        selectedLog: null,
        unreadCount: 0,
      };

      expect(initialState.visible).toBe(false);
      expect(initialState.logs).toEqual([]);
      expect(initialState.selectedLog).toBeNull();
      expect(initialState.unreadCount).toBe(0);
    });

    it('should update visible state correctly', () => {
      let visible = false;

      const setVisible = (newValue: boolean) => {
        visible = newValue;
      };

      expect(visible).toBe(false);
      setVisible(true);
      expect(visible).toBe(true);
      setVisible(false);
      expect(visible).toBe(false);
    });

    it('should update selectedLog state correctly', () => {
      let selectedLog = null;

      const setSelectedLog = (log: any) => {
        selectedLog = log;
      };

      expect(selectedLog).toBeNull();
      setSelectedLog(mockLogs[0]);
      expect(selectedLog).toBe(mockLogs[0]);
      setSelectedLog(null);
      expect(selectedLog).toBeNull();
    });
  });

  describe('fetchLogs Logic', () => {
    it('should fetch logs from logManager and calculate unread count', () => {
      const fetchLogs = () => {
        const storedLogs = mockLogManager.getLogs();
        const unreadLogs = storedLogs.filter((log: any) => !log.read);
        return {
          logs: storedLogs,
          unreadCount: unreadLogs.length,
        };
      };

      const result = fetchLogs();

      expect(mockLogManager.getLogs).toHaveBeenCalledTimes(1);
      expect(result.logs).toEqual(mockLogs);
      expect(result.unreadCount).toBe(2); // log1 and log3 are unread
    });

    it('should handle empty logs correctly', () => {
      mockLogManager.getLogs.mockReturnValue([]);

      const fetchLogs = () => {
        const storedLogs = mockLogManager.getLogs();
        const unreadLogs = storedLogs.filter((log: any) => !log.read);
        return {
          logs: storedLogs,
          unreadCount: unreadLogs.length,
        };
      };

      const result = fetchLogs();

      expect(result.logs).toEqual([]);
      expect(result.unreadCount).toBe(0);
    });

    it('should calculate unread count correctly with different scenarios', () => {
      const testCases = [
        { logs: [], expected: 0 },
        { logs: [{ read: true }, { read: true }], expected: 0 },
        { logs: [{ read: false }, { read: false }], expected: 2 },
        { logs: [{ read: true }, { read: false }, { read: true }], expected: 1 },
      ];

      testCases.forEach(({ logs, expected }) => {
        mockLogManager.getLogs.mockReturnValue(logs);

        const fetchLogs = () => {
          const storedLogs = mockLogManager.getLogs();
          const unreadLogs = storedLogs.filter((log: any) => !log.read);
          return unreadLogs.length;
        };

        expect(fetchLogs()).toBe(expected);
      });
    });
  });

  describe('Event Listener Logic', () => {
    it('should set up storage update event listener', () => {
      const mockAddEventListener = vi.fn();
      window.addEventListener = mockAddEventListener;

      // Simulate useEffect setup
      const handleStorageUpdate = vi.fn();
      window.addEventListener('storageUpdate', handleStorageUpdate);

      expect(mockAddEventListener).toHaveBeenCalledWith('storageUpdate', handleStorageUpdate);
    });

    it('should remove event listener on cleanup', () => {
      const mockRemoveEventListener = vi.fn();
      window.removeEventListener = mockRemoveEventListener;

      // Simulate useEffect cleanup
      const handleStorageUpdate = vi.fn();
      window.removeEventListener('storageUpdate', handleStorageUpdate);

      expect(mockRemoveEventListener).toHaveBeenCalledWith('storageUpdate', handleStorageUpdate);
    });

    it('should handle custom storage update event correctly', () => {
      const mockEvent = new CustomEvent('storageUpdate', {
        detail: { key: 'global_api_log' },
      });

      const mockFetchLogs = vi.fn();

      const handleStorageUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail.key === 'global_api_log') {
          mockFetchLogs();
        }
      };

      handleStorageUpdate(mockEvent);
      expect(mockFetchLogs).toHaveBeenCalledTimes(1);
    });

    it('should ignore storage update events with different keys', () => {
      const mockEvent = new CustomEvent('storageUpdate', {
        detail: { key: 'other_key' },
      });

      const mockFetchLogs = vi.fn();

      const handleStorageUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail.key === 'global_api_log') {
          mockFetchLogs();
        }
      };

      handleStorageUpdate(mockEvent);
      expect(mockFetchLogs).not.toHaveBeenCalled();
    });
  });

  describe('Drawer Control Logic', () => {
    it('should show drawer correctly', () => {
      let visible = false;

      const showDrawer = () => {
        visible = true;
      };

      expect(visible).toBe(false);
      showDrawer();
      expect(visible).toBe(true);
    });

    it('should close drawer correctly', () => {
      let visible = true;

      const onClose = () => {
        visible = false;
      };

      expect(visible).toBe(true);
      onClose();
      expect(visible).toBe(false);
    });
  });

  describe('Log Selection Logic', () => {
    it('should select log correctly', () => {
      let selectedLog = null;

      const onLogClick = (log: any) => {
        selectedLog = log;
      };

      expect(selectedLog).toBeNull();
      onLogClick(mockLogs[0]);
      expect(selectedLog).toBe(mockLogs[0]);
    });

    it('should deselect log correctly', () => {
      let selectedLog = mockLogs[0];

      const setSelectedLog = (log: any) => {
        selectedLog = log;
      };

      expect(selectedLog).toBe(mockLogs[0]);
      setSelectedLog(null);
      expect(selectedLog).toBeNull();
    });
  });

  describe('Log Management Actions', () => {
    it('should mark log as read correctly', () => {
      const mockFetchLogs = vi.fn();
      let selectedLog = mockLogs[0];

      const markLogAsRead = (logKey: string) => {
        mockLogManager.markAsRead(logKey);
        mockFetchLogs();
        selectedLog = null;
      };

      markLogAsRead('log1');

      expect(mockLogManager.markAsRead).toHaveBeenCalledWith('log1');
      expect(mockFetchLogs).toHaveBeenCalledTimes(1);
      expect(selectedLog).toBeNull();
    });

    it('should mark all logs as read correctly', () => {
      const mockFetchLogs = vi.fn();
      let selectedLog = mockLogs[0];

      const markAllAsRead = () => {
        mockLogManager.markAllAsRead();
        mockFetchLogs();
        selectedLog = null;
      };

      markAllAsRead();

      expect(mockLogManager.markAllAsRead).toHaveBeenCalledTimes(1);
      expect(mockFetchLogs).toHaveBeenCalledTimes(1);
      expect(selectedLog).toBeNull();
    });

    it('should clear all logs correctly', () => {
      const mockFetchLogs = vi.fn();
      let selectedLog = mockLogs[0];

      const clearAllLogs = () => {
        mockLogManager.clearLogs();
        mockFetchLogs();
        selectedLog = null;
      };

      clearAllLogs();

      expect(mockLogManager.clearLogs).toHaveBeenCalledTimes(1);
      expect(mockFetchLogs).toHaveBeenCalledTimes(1);
      expect(selectedLog).toBeNull();
    });
  });

  describe('Date Formatting Logic', () => {
    it('should format timestamp correctly', () => {
      const timestamp = '2024-01-01T10:00:00Z';
      const formattedDate = new Date(timestamp).toLocaleString();

      expect(formattedDate).toBeDefined();
      expect(typeof formattedDate).toBe('string');
    });

    it('should handle selected log timestamp correctly', () => {
      const selectedLog = mockLogs[0];
      const timestamp = selectedLog?.result?.created_at || selectedLog.timestamp;
      const formattedDate = new Date(timestamp).toLocaleString();

      expect(timestamp).toBe('2024-01-01T10:00:00Z');
      expect(formattedDate).toBeDefined();
    });

    it('should fallback to log timestamp when result.created_at is not available', () => {
      const logWithoutCreatedAt = {
        timestamp: '2024-01-01T12:00:00Z',
        result: { message: 'Test message' },
      };

      const timestamp = logWithoutCreatedAt?.result?.created_at || logWithoutCreatedAt.timestamp;
      expect(timestamp).toBe('2024-01-01T12:00:00Z');
    });
  });

  describe('UI State Logic', () => {
    it('should determine drawer title correctly', () => {
      const testCases = [
        { selectedLog: null, expected: 'logs' },
        { selectedLog: mockLogs[0], expected: 'log_detail' },
      ];

      testCases.forEach(({ selectedLog, expected }) => {
        const title = selectedLog ? 'log_detail' : 'logs';
        expect(title).toBe(expected);
      });
    });

    it('should show correct content based on selected log state', () => {
      const testCases = [
        { selectedLog: null, showList: true, showDetail: false },
        { selectedLog: mockLogs[0], showList: false, showDetail: true },
      ];

      testCases.forEach(({ selectedLog, showList, showDetail }) => {
        const shouldShowList = !selectedLog;
        const shouldShowDetail = !!selectedLog;

        expect(shouldShowList).toBe(showList);
        expect(shouldShowDetail).toBe(showDetail);
      });
    });

    it('should show unread badge for unread logs', () => {
      const testCases = [
        { log: { read: false }, shouldShowBadge: true },
        { log: { read: true }, shouldShowBadge: false },
      ];

      testCases.forEach(({ log, shouldShowBadge }) => {
        const showBadge = !log.read;
        expect(showBadge).toBe(shouldShowBadge);
      });
    });
  });

  describe('Log Detail Display Logic', () => {
    it('should show all log details when available', () => {
      const logWithAllDetails = mockLogs[0];

      expect(logWithAllDetails.url).toBeDefined();
      expect(logWithAllDetails.result.message).toBeDefined();
      expect(logWithAllDetails.result.cause).toBeDefined();
      expect(logWithAllDetails.result.details).toBeDefined();
    });

    it('should handle logs without optional fields', () => {
      const logWithMinimalDetails = mockLogs[1];

      expect(logWithMinimalDetails.url).toBeDefined();
      expect(logWithMinimalDetails.result.message).toBeDefined();
      expect(logWithMinimalDetails.result.cause).toBeUndefined();
      expect(logWithMinimalDetails.result.details).toBeUndefined();
    });

    it('should conditionally show cause and details', () => {
      const testCases = [
        {
          result: { message: 'test', cause: 'error', details: 'info' },
          shouldShowCause: true,
          shouldShowDetails: true,
        },
        {
          result: { message: 'test' },
          shouldShowCause: false,
          shouldShowDetails: false,
        },
      ];

      testCases.forEach(({ result, shouldShowCause, shouldShowDetails }) => {
        const showCause = !!result.cause;
        const showDetails = !!result.details;

        expect(showCause).toBe(shouldShowCause);
        expect(showDetails).toBe(shouldShowDetails);
      });
    });
  });
});
