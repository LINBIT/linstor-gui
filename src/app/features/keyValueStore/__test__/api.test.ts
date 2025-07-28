// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../api';
import { get, put, del } from '../../requests';

// Mock the requests module
vi.mock('../../requests');

describe('KeyValueStore API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getKVStore', () => {
    it('should call get with correct endpoint', () => {
      const mockResponse = { data: [] };
      vi.mocked(get).mockReturnValue(mockResponse as any);

      const result = api.getKVStore();

      expect(get).toHaveBeenCalledWith('/v1/key-value-store', {});
      expect(result).toBe(mockResponse);
    });
  });

  describe('getKVInstance', () => {
    it('should call get with correct endpoint and instance parameter', () => {
      const mockResponse = { data: [] };
      vi.mocked(get).mockReturnValue(mockResponse as any);

      const result = api.getKVInstance('test-instance');

      expect(get).toHaveBeenCalledWith('/v1/key-value-store/{instance}', {
        params: {
          path: {
            instance: 'test-instance',
          },
        },
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle special characters in instance name', () => {
      const mockResponse = { data: [] };
      vi.mocked(get).mockReturnValue(mockResponse as any);

      const result = api.getKVInstance('test-instance-with-special-chars!@#');

      expect(get).toHaveBeenCalledWith('/v1/key-value-store/{instance}', {
        params: {
          path: {
            instance: 'test-instance-with-special-chars!@#',
          },
        },
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('deleteKVInstance', () => {
    it('should call del with correct endpoint and instance parameter', () => {
      const mockResponse = { data: {} };
      vi.mocked(del).mockReturnValue(mockResponse as any);

      const result = api.deleteKVInstance('test-instance');

      expect(del).toHaveBeenCalledWith('/v1/key-value-store/{instance}', {
        params: {
          path: {
            instance: 'test-instance',
          },
        },
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle empty instance name', () => {
      const mockResponse = { data: {} };
      vi.mocked(del).mockReturnValue(mockResponse as any);

      const result = api.deleteKVInstance('');

      expect(del).toHaveBeenCalledWith('/v1/key-value-store/{instance}', {
        params: {
          path: {
            instance: '',
          },
        },
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('createOrModifyKVInstance', () => {
    it('should call put with correct endpoint, instance parameter, and body', () => {
      const mockResponse = { data: {} };
      const mockStore = {
        override_props: { key: 'value' },
        delete_props: ['oldKey'],
      };
      vi.mocked(put).mockReturnValue(mockResponse as any);

      const result = api.createOrModifyKVInstance('test-instance', mockStore);

      expect(put).toHaveBeenCalledWith('/v1/key-value-store/{instance}', {
        params: {
          path: {
            instance: 'test-instance',
          },
        },
        body: mockStore,
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle empty store object', () => {
      const mockResponse = { data: {} };
      const mockStore = {};
      vi.mocked(put).mockReturnValue(mockResponse as any);

      const result = api.createOrModifyKVInstance('test-instance', mockStore);

      expect(put).toHaveBeenCalledWith('/v1/key-value-store/{instance}', {
        params: {
          path: {
            instance: 'test-instance',
          },
        },
        body: mockStore,
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle store with only override_props', () => {
      const mockResponse = { data: {} };
      const mockStore = {
        override_props: {
          prop1: 'value1',
          prop2: 'value2',
          __updated__: '2024-01-01T12:00:00.000Z',
        },
      };
      vi.mocked(put).mockReturnValue(mockResponse as any);

      const result = api.createOrModifyKVInstance('test-instance', mockStore);

      expect(put).toHaveBeenCalledWith('/v1/key-value-store/{instance}', {
        params: {
          path: {
            instance: 'test-instance',
          },
        },
        body: mockStore,
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle store with only delete_props', () => {
      const mockResponse = { data: {} };
      const mockStore = {
        delete_props: ['prop1', 'prop2'],
      };
      vi.mocked(put).mockReturnValue(mockResponse as any);

      const result = api.createOrModifyKVInstance('test-instance', mockStore);

      expect(put).toHaveBeenCalledWith('/v1/key-value-store/{instance}', {
        params: {
          path: {
            instance: 'test-instance',
          },
        },
        body: mockStore,
      });
      expect(result).toBe(mockResponse);
    });
  });
});
