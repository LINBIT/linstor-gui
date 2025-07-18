// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { message } from 'antd';
import {
  notify,
  handleLinstorMessage,
  handleAPICallRes,
  notifyMessages,
  ApiLogManager,
  logManager,
  type LogItem,
} from '../toast';
import { components } from '@app/apis/schema';

// Mock antd message
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    destroy: vi.fn(),
  },
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: vi.fn(),
});

type APICALLRC = components['schemas']['ApiCallRc'];
type APICALLRCLIST = components['schemas']['ApiCallRcList'];

describe('toast utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('notify', () => {
    it('should not notify if content is empty', () => {
      notify('');
      expect(message.success).not.toHaveBeenCalled();
      expect(message.error).not.toHaveBeenCalled();
    });

    it('should call message.success for success type', () => {
      notify('Success message', { type: 'success' });
      expect(message.success).toHaveBeenCalledWith('Success message');
      expect(message.error).not.toHaveBeenCalled();
    });

    it('should call message.error for error type', () => {
      notify('Error message', { type: 'error' });
      expect(message.error).toHaveBeenCalledWith('Error message');
      expect(message.success).not.toHaveBeenCalled();
    });

    it('should not call any message method for other types', () => {
      notify('Info message', { type: 'info' });
      notify('Warning message', { type: 'warning' });
      expect(message.success).not.toHaveBeenCalled();
      expect(message.error).not.toHaveBeenCalled();
    });

    it('should work without options', () => {
      notify('Simple message');
      expect(message.success).not.toHaveBeenCalled();
      expect(message.error).not.toHaveBeenCalled();
    });
  });

  describe('handleLinstorMessage', () => {
    it('should return success type for positive ret_code', () => {
      const result = handleLinstorMessage({ message: 'Success', ret_code: 1 });
      expect(result).toEqual({ title: 'Success', type: 'success' });
    });

    it('should return error type for zero ret_code', () => {
      const result = handleLinstorMessage({ message: 'Error', ret_code: 0 });
      expect(result).toEqual({ title: 'Error', type: 'error' });
    });

    it('should return error type for negative ret_code', () => {
      const result = handleLinstorMessage({ message: 'Error', ret_code: -1 });
      expect(result).toEqual({ title: 'Error', type: 'error' });
    });
  });

  describe('notifyMessages', () => {
    it('should not notify if list is null or undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notifyMessages(null as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notifyMessages(undefined as any);
      expect(message.success).not.toHaveBeenCalled();
      expect(message.error).not.toHaveBeenCalled();
    });

    it('should show error messages for items with negative ret_code', () => {
      const list = [
        { message: 'Error 1', ret_code: -1 },
        { message: 'Error 2', ret_code: -2 },
        { message: 'Success', ret_code: 1 },
      ];
      notifyMessages(list);
      expect(message.error).toHaveBeenCalledTimes(2);
      expect(message.error).toHaveBeenCalledWith('Error 1');
      expect(message.error).toHaveBeenCalledWith('Error 2');
      expect(message.success).not.toHaveBeenCalled();
    });

    it('should show success messages when no errors present', () => {
      const list = [
        { message: 'Success 1', ret_code: 1 },
        { message: 'Success 2', ret_code: 2 },
      ];
      notifyMessages(list);
      expect(message.success).toHaveBeenCalledTimes(2);
      expect(message.success).toHaveBeenCalledWith('Success 1');
      expect(message.success).toHaveBeenCalledWith('Success 2');
      expect(message.error).not.toHaveBeenCalled();
    });
  });

  describe('handleAPICallRes', () => {
    it('should not process empty or null response', () => {
      const spy = vi.spyOn(logManager, 'addBulkLogs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleAPICallRes(null as any, 'test-url');
      handleAPICallRes([], 'test-url');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should filter out responses without ret_code and process valid ones', () => {
      const spy = vi.spyOn(logManager, 'addBulkLogs');
      const callRes: APICALLRCLIST = [
        { message: 'Success', ret_code: 1 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { message: 'Invalid' } as any, // Missing ret_code
        { message: 'Error', ret_code: -1 },
      ];

      handleAPICallRes(callRes, 'test-url');

      expect(spy).toHaveBeenCalledWith(
        [
          { message: 'Success', ret_code: 1 },
          { message: 'Error', ret_code: -1 },
        ],
        'test-url',
      );
    });
  });
});

describe('ApiLogManager', () => {
  let apiLogManager: ApiLogManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    apiLogManager = ApiLogManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = ApiLogManager.getInstance();
      const instance2 = ApiLogManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('addLog', () => {
    it('should add a single log and trigger notification', () => {
      const mockDate = 1234567890;
      vi.spyOn(Date, 'now').mockReturnValue(mockDate);

      const result: APICALLRC = { message: 'Test message', ret_code: 1 };
      apiLogManager.addLog(result, 'test-url');

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'global_api_log',
        JSON.stringify([
          {
            key: `test-url_${mockDate}`,
            url: 'test-url',
            timestamp: mockDate,
            result,
            read: false,
          },
        ]),
      );
      expect(window.dispatchEvent).toHaveBeenCalled();
      expect(message.success).toHaveBeenCalled();
    });
  });

  describe('addBulkLogs', () => {
    it('should add multiple logs', () => {
      const mockDate = 1234567890;
      vi.spyOn(Date, 'now').mockReturnValue(mockDate);

      const results: APICALLRCLIST = [
        { message: 'Message 1', ret_code: 1 },
        { message: 'Message 2', ret_code: -1 },
      ];

      apiLogManager.addBulkLogs(results, 'test-url');

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      const setItemCall = mockSessionStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      expect(storedData).toHaveLength(2);
      expect(storedData[0].result).toEqual(results[0]);
      expect(storedData[1].result).toEqual(results[1]);
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      const mockLogs: LogItem[] = [
        {
          key: 'url1_123',
          url: 'url1',
          timestamp: 123,
          result: { message: 'Message 1', ret_code: 1 },
          read: false,
        },
        {
          key: 'url2_456',
          url: 'url2',
          timestamp: 456,
          result: { message: 'Message 2', ret_code: -1 },
          read: true,
        },
      ];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockLogs));
    });

    it('should return all logs when no URL specified', () => {
      const logs = apiLogManager.getLogs();
      expect(logs).toHaveLength(2);
    });

    it('should filter logs by URL when specified', () => {
      const logs = apiLogManager.getLogs('url1');
      expect(logs).toHaveLength(1);
      expect(logs[0].url).toBe('url1');
    });
  });

  describe('clearLogs', () => {
    beforeEach(() => {
      const mockLogs: LogItem[] = [
        {
          key: 'url1_123',
          url: 'url1',
          timestamp: 123,
          result: { message: 'Message 1', ret_code: 1 },
          read: false,
        },
        {
          key: 'url2_456',
          url: 'url2',
          timestamp: 456,
          result: { message: 'Message 2', ret_code: -1 },
          read: true,
        },
      ];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockLogs));
    });

    it('should clear all logs when no URL specified', () => {
      apiLogManager.clearLogs();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('global_api_log');
    });

    it('should clear logs for specific URL', () => {
      apiLogManager.clearLogs('url1');
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      const setItemCall = mockSessionStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      expect(storedData).toHaveLength(1);
      expect(storedData[0].url).toBe('url2');
    });
  });

  describe('markAsRead', () => {
    beforeEach(() => {
      const mockLogs: LogItem[] = [
        {
          key: 'test_key',
          url: 'url1',
          timestamp: 123,
          result: { message: 'Message 1', ret_code: 1 },
          read: false,
        },
      ];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockLogs));
    });

    it('should mark specific log as read', () => {
      apiLogManager.markAsRead('test_key');
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      const setItemCall = mockSessionStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      expect(storedData[0].read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(() => {
      const mockLogs: LogItem[] = [
        {
          key: 'url1_123',
          url: 'url1',
          timestamp: 123,
          result: { message: 'Message 1', ret_code: 1 },
          read: false,
        },
        {
          key: 'url2_456',
          url: 'url2',
          timestamp: 456,
          result: { message: 'Message 2', ret_code: -1 },
          read: false,
        },
      ];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockLogs));
    });

    it('should mark all logs as read when no URL specified', () => {
      apiLogManager.markAllAsRead();
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      const setItemCall = mockSessionStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      expect(storedData.every((log: LogItem) => log.read)).toBe(true);
    });

    it('should mark logs for specific URL as read', () => {
      apiLogManager.markAllAsRead('url1');
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      const setItemCall = mockSessionStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      expect(storedData[0].read).toBe(true);
      expect(storedData[1].read).toBe(false);
    });
  });

  describe('getSuccessLogs', () => {
    beforeEach(() => {
      const mockLogs: LogItem[] = [
        {
          key: 'success_log',
          url: 'url1',
          timestamp: 123,
          result: { message: 'Success', ret_code: 1 },
          read: false,
        },
        {
          key: 'error_log',
          url: 'url1',
          timestamp: 456,
          result: { message: 'Error', ret_code: -1 },
          read: false,
        },
      ];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockLogs));
    });

    it('should return only success logs', () => {
      const successLogs = apiLogManager.getSuccessLogs();
      expect(successLogs).toHaveLength(1);
      expect(successLogs[0].result.ret_code).toBe(1);
    });
  });

  describe('getErrorLogs', () => {
    beforeEach(() => {
      const mockLogs: LogItem[] = [
        {
          key: 'success_log',
          url: 'url1',
          timestamp: 123,
          result: { message: 'Success', ret_code: 1 },
          read: false,
        },
        {
          key: 'error_log',
          url: 'url1',
          timestamp: 456,
          result: { message: 'Error', ret_code: -1 },
          read: false,
        },
      ];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockLogs));
    });

    it('should return only error logs', () => {
      const errorLogs = apiLogManager.getErrorLogs();
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].result.ret_code).toBe(-1);
    });
  });

  describe('getUnreadLogs', () => {
    beforeEach(() => {
      const mockLogs: LogItem[] = [
        {
          key: 'read_log',
          url: 'url1',
          timestamp: 123,
          result: { message: 'Read message', ret_code: 1 },
          read: true,
        },
        {
          key: 'unread_log',
          url: 'url1',
          timestamp: 456,
          result: { message: 'Unread message', ret_code: 1 },
          read: false,
        },
      ];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockLogs));
    });

    it('should return only unread logs', () => {
      const unreadLogs = apiLogManager.getUnreadLogs();
      expect(unreadLogs).toHaveLength(1);
      expect(unreadLogs[0].read).toBe(false);
    });
  });

  describe('fullySuccess', () => {
    it('should return false for undefined/null response', () => {
      expect(apiLogManager.fullySuccess(undefined)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(apiLogManager.fullySuccess(null as any)).toBe(false);
    });

    it('should return true when all items have positive ret_code', () => {
      const res: APICALLRCLIST = [
        { message: 'Success 1', ret_code: 1 },
        { message: 'Success 2', ret_code: 2 },
      ];
      expect(apiLogManager.fullySuccess(res)).toBe(true);
    });

    it('should return false when any item has non-positive ret_code', () => {
      const res: APICALLRCLIST = [
        { message: 'Success', ret_code: 1 },
        { message: 'Error', ret_code: -1 },
      ];
      expect(apiLogManager.fullySuccess(res)).toBe(false);
    });
  });

  describe('partiallySuccess', () => {
    it('should return false for undefined/null response', () => {
      expect(apiLogManager.partiallySuccess(undefined)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(apiLogManager.partiallySuccess(null as any)).toBe(false);
    });

    it('should return true when there are both success and error items', () => {
      const res: APICALLRCLIST = [
        { message: 'Success', ret_code: 1 },
        { message: 'Error', ret_code: -1 },
      ];
      expect(apiLogManager.partiallySuccess(res)).toBe(true);
    });

    it('should return false when all items are successful', () => {
      const res: APICALLRCLIST = [
        { message: 'Success 1', ret_code: 1 },
        { message: 'Success 2', ret_code: 2 },
      ];
      expect(apiLogManager.partiallySuccess(res)).toBe(false);
    });

    it('should return false when all items are errors', () => {
      const res: APICALLRCLIST = [
        { message: 'Error 1', ret_code: -1 },
        { message: 'Error 2', ret_code: -2 },
      ];
      expect(apiLogManager.partiallySuccess(res)).toBe(false);
    });
  });
});
