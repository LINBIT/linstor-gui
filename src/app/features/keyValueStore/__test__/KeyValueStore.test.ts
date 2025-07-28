// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeyValueStore } from '../KeyValueStore';
import * as api from '../api';

// Mock the API module
vi.mock('../api');

describe('KeyValueStore', () => {
  let kvStore: KeyValueStore;

  beforeEach(() => {
    kvStore = new KeyValueStore();
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return data when API call succeeds', async () => {
      const mockData = [
        { name: 'instance1', props: { key1: 'value1' } },
        { name: 'instance2', props: { key2: 'value2' } },
      ];
      vi.mocked(api.getKVStore).mockResolvedValue({
        data: mockData,
        response: {} as Response,
      });

      const result = await kvStore.list();

      expect(result).toEqual(mockData);
      expect(api.getKVStore).toHaveBeenCalledOnce();
    });

    it('should throw error when API call fails', async () => {
      vi.mocked(api.getKVStore).mockResolvedValue({
        data: undefined,
        response: {} as Response,
      });

      await expect(kvStore.list()).rejects.toThrow('Failed to list key value stores.');
    });
  });

  describe('listKeys', () => {
    it('should return keys from instance props', async () => {
      const mockInstance = { name: 'test', props: { key1: 'value1', key2: 'value2' } };
      vi.spyOn(kvStore, 'get').mockResolvedValue(mockInstance);

      const result = await kvStore.listKeys('test');

      expect(result).toEqual(['key1', 'key2']);
      expect(kvStore.get).toHaveBeenCalledWith('test');
    });

    it('should throw error when instance has no props', async () => {
      const mockInstance = { name: 'test' };
      vi.spyOn(kvStore, 'get').mockResolvedValue(mockInstance);

      await expect(kvStore.listKeys('test')).rejects.toThrow('Failed to list keys of key value store test');
    });
  });

  describe('listInstances', () => {
    it('should return list of instance names', async () => {
      const mockData = [{ name: 'instance1' }, { name: 'instance2' }, { name: undefined }, { name: '' }];
      vi.spyOn(kvStore, 'list').mockResolvedValue(mockData);

      const result = await kvStore.listInstances();

      expect(result).toEqual(['instance1', 'instance2']);
    });

    it('should throw error when list fails', async () => {
      vi.spyOn(kvStore, 'list').mockResolvedValue(undefined as any);

      await expect(kvStore.listInstances()).rejects.toThrow('Failed to list key value store instances.');
    });
  });

  describe('instanceExists', () => {
    it('should return true when instance exists', async () => {
      vi.spyOn(kvStore, 'listInstances').mockResolvedValue(['instance1', 'instance2']);

      const result = await kvStore.instanceExists('instance1');

      expect(result).toBe(true);
    });

    it('should return false when instance does not exist', async () => {
      vi.spyOn(kvStore, 'listInstances').mockResolvedValue(['instance1', 'instance2']);

      const result = await kvStore.instanceExists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create new instance when it does not exist', async () => {
      const mockStore = { override_props: { customProp: 'value' } };
      const expectedStore = {
        override_props: {
          customProp: 'value',
          __updated__: '2024-01-01T12:00:00.000Z',
        },
      };

      vi.spyOn(kvStore, 'instanceExists').mockResolvedValue(false);
      vi.mocked(api.createOrModifyKVInstance).mockResolvedValue({
        data: [{ ret_code: 1, message: 'Success' }],
        response: {} as Response,
      });

      await kvStore.create('newInstance', mockStore);

      expect(api.createOrModifyKVInstance).toHaveBeenCalledWith('newInstance', expectedStore);
    });

    it('should modify existing instance when it exists', async () => {
      const mockStore = { override_props: { customProp: 'value' } };

      vi.spyOn(kvStore, 'instanceExists').mockResolvedValue(true);
      vi.spyOn(kvStore, 'modify').mockResolvedValue([{ ret_code: 1, message: 'Success' }]);
      vi.mocked(api.createOrModifyKVInstance).mockResolvedValue({
        data: [{ ret_code: 1, message: 'Success' }],
        response: {} as Response,
      });

      await kvStore.create('existingInstance', mockStore);

      expect(kvStore.modify).toHaveBeenCalled();
      expect(api.createOrModifyKVInstance).toHaveBeenCalled();
    });

    it('should throw error when API call fails', async () => {
      vi.spyOn(kvStore, 'instanceExists').mockResolvedValue(false);
      vi.mocked(api.createOrModifyKVInstance).mockResolvedValue({
        data: undefined,
        response: {} as Response,
      });

      await expect(kvStore.create('instance')).rejects.toThrow('Failed to create key value store instance');
    });
  });

  describe('get', () => {
    it('should return instance data when API call succeeds', async () => {
      const mockData = [{ name: 'test', props: { key: 'value' } }];
      vi.mocked(api.getKVInstance).mockResolvedValue({
        data: mockData,
        response: {} as Response,
      });

      const result = await kvStore.get('test');

      expect(result).toEqual(mockData[0]);
      expect(api.getKVInstance).toHaveBeenCalledWith('test');
    });

    it('should throw error when API call fails', async () => {
      vi.mocked(api.getKVInstance).mockResolvedValue({
        data: undefined,
        response: {} as Response,
      });

      await expect(kvStore.get('test')).rejects.toThrow('Failed to get key value store test ');
    });
  });

  describe('modify', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should modify instance and return response data', async () => {
      const mockStore = { override_props: { key: 'value' } };
      const expectedStore = {
        override_props: {
          key: 'value',
          __updated__: '2024-01-01T12:00:00.000Z',
        },
      };
      const mockResponse = [{ ret_code: 1, message: 'Success' }];

      vi.mocked(api.createOrModifyKVInstance).mockResolvedValue({
        data: mockResponse,
        response: {} as Response,
      });

      const result = await kvStore.modify('test', mockStore);

      expect(result).toEqual(mockResponse);
      expect(api.createOrModifyKVInstance).toHaveBeenCalledWith('test', expectedStore);
    });

    it('should throw error when API call fails', async () => {
      const mockStore = { override_props: { key: 'value' } };
      vi.mocked(api.createOrModifyKVInstance).mockResolvedValue({
        data: undefined,
        response: {} as Response,
      });

      await expect(kvStore.modify('test', mockStore)).rejects.toThrow('Failed to modify key value store test');
    });
  });

  describe('delete', () => {
    it('should delete instance successfully', async () => {
      vi.mocked(api.deleteKVInstance).mockResolvedValue({
        data: [{ ret_code: 1, message: 'Success' }],
        response: {} as Response,
      });

      await kvStore.delete('test');

      expect(api.deleteKVInstance).toHaveBeenCalledWith('test');
    });

    it('should throw error when API call fails', async () => {
      vi.mocked(api.deleteKVInstance).mockResolvedValue({
        data: undefined,
        response: {} as Response,
      });

      await expect(kvStore.delete('test')).rejects.toThrow('Failed to delete key value store test');
    });
  });

  describe('getProperty', () => {
    it('should return property value when it exists', async () => {
      const mockInstance = { name: 'test', props: { testProp: 'testValue' } };
      vi.spyOn(kvStore, 'get').mockResolvedValue(mockInstance);

      const result = await kvStore.getProperty('test', 'testProp');

      expect(result).toBe('testValue');
    });

    it('should return undefined when property does not exist', async () => {
      const mockInstance = { name: 'test', props: { otherProp: 'value' } };
      vi.spyOn(kvStore, 'get').mockResolvedValue(mockInstance);

      const result = await kvStore.getProperty('test', 'nonexistent');

      expect(result).toBeUndefined();
    });

    it('should throw error when instance has no props', async () => {
      const mockInstance = { name: 'test' };
      vi.spyOn(kvStore, 'get').mockResolvedValue(mockInstance);

      await expect(kvStore.getProperty('test', 'prop')).rejects.toThrow(
        'Failed to get property prop of key value store test',
      );
    });
  });

  describe('setProperty', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set property successfully', async () => {
      const mockResponse = [{ ret_code: 1, message: 'Success' }];
      vi.spyOn(kvStore, 'modify').mockResolvedValue(mockResponse);

      await kvStore.setProperty('test', 'key', 'value');

      expect(kvStore.modify).toHaveBeenCalledWith('test', {
        override_props: {
          key: 'value',
          __updated__: '2024-01-01T12:00:00.000Z',
        },
      });
    });

    it('should throw error when modify fails', async () => {
      const mockResponse = [{ ret_code: 0, message: 'Failed' }];
      vi.spyOn(kvStore, 'modify').mockResolvedValue(mockResponse);

      await expect(kvStore.setProperty('test', 'key', 'value')).rejects.toThrow(
        'Failed to set property key of key value store test',
      );
    });
  });

  describe('deleteProperty', () => {
    it('should delete property successfully', async () => {
      const mockResponse = [{ ret_code: 1, message: 'Success' }];
      vi.spyOn(kvStore, 'modify').mockResolvedValue(mockResponse);

      await kvStore.deleteProperty('test', 'key');

      expect(kvStore.modify).toHaveBeenCalledWith('test', {
        delete_props: ['key'],
      });
    });

    it('should throw error when modify fails', async () => {
      const mockResponse = [{ ret_code: 0, message: 'Failed' }];
      vi.spyOn(kvStore, 'modify').mockResolvedValue(mockResponse);

      await expect(kvStore.deleteProperty('test', 'key')).rejects.toThrow(
        'Failed to set property key of key value store test',
      );
    });
  });
});
