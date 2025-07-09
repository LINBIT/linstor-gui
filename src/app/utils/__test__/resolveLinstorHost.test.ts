// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveAndStoreLinstorHost } from '../resolveLinstorHost';

// Mock window.location and localStorage
const mockLocation = {
  origin: 'https://example.com',
};

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
};

// Mock console.log
const mockConsoleLog = vi.fn();

describe('resolveAndStoreLinstorHost', () => {
  beforeEach(() => {
    // Clear localStorage mock
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockConsoleLog.mockClear();

    // Mock window and console
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    Object.defineProperty(console, 'log', {
      value: mockConsoleLog,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should return undefined for empty host parameter', () => {
      const result = resolveAndStoreLinstorHost('');
      expect(result).toBeUndefined();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should return undefined for undefined host parameter', () => {
      const result = resolveAndStoreLinstorHost(undefined as unknown as string);
      expect(result).toBeUndefined();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should return undefined for null host parameter', () => {
      const result = resolveAndStoreLinstorHost(null as unknown as string);
      expect(result).toBeUndefined();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('valid host resolution', () => {
    it('should resolve absolute URL correctly', () => {
      const hostParam = 'https://api.example.com:8080';
      const result = resolveAndStoreLinstorHost(hostParam);

      expect(result).toBe('https://api.example.com:8080');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://api.example.com:8080');
    });

    it('should resolve relative URL with base origin', () => {
      const hostParam = '/api/linstor';
      const result = resolveAndStoreLinstorHost(hostParam);

      expect(result).toBe('https://example.com/api/linstor');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://example.com/api/linstor');
    });

    it('should use custom base origin', () => {
      const hostParam = '/api/linstor';
      const customOrigin = 'https://custom.example.com';
      const result = resolveAndStoreLinstorHost(hostParam, customOrigin);

      expect(result).toBe('https://custom.example.com/api/linstor');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://custom.example.com/api/linstor');
    });

    it('should resolve hostname without protocol as absolute URL', () => {
      const hostParam = 'api.example.com:8080';
      const result = resolveAndStoreLinstorHost(hostParam);

      expect(result).toBe('api.example.com:8080');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'api.example.com:8080');
    });

    it('should handle different protocols', () => {
      const hostParam = 'http://api.example.com:8080';
      const result = resolveAndStoreLinstorHost(hostParam);

      expect(result).toBe('http://api.example.com:8080');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'http://api.example.com:8080');
    });
  });

  describe('trailing slash handling', () => {
    it('should remove trailing slash from resolved host', () => {
      const hostParam = 'https://api.example.com:8080/';
      const result = resolveAndStoreLinstorHost(hostParam);

      expect(result).toBe('https://api.example.com:8080');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://api.example.com:8080');
    });

    it('should remove trailing slash from relative URL', () => {
      const hostParam = '/api/linstor/';
      const result = resolveAndStoreLinstorHost(hostParam);

      expect(result).toBe('https://example.com/api/linstor');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://example.com/api/linstor');
    });

    it('should not remove trailing slash if it is not present', () => {
      const hostParam = 'https://api.example.com:8080/path';
      const result = resolveAndStoreLinstorHost(hostParam);

      expect(result).toBe('https://api.example.com:8080/path');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://api.example.com:8080/path');
    });
  });

  describe('URL decoding', () => {
    it('should decode URL-encoded host parameter', () => {
      const encodedHost = encodeURIComponent('https://api.example.com:8080/path with spaces');
      const result = resolveAndStoreLinstorHost(encodedHost);

      expect(result).toBe('https://api.example.com:8080/path%20with%20spaces');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'LINSTOR_HOST',
        'https://api.example.com:8080/path%20with%20spaces',
      );
    });

    it('should handle invalid URL encoding gracefully', () => {
      const invalidEncoded = 'https://api.example.com%GG';
      const result = resolveAndStoreLinstorHost(invalidEncoded);

      expect(result).toBeUndefined();
      expect(mockConsoleLog).toHaveBeenCalledWith('Failed to decode host parameter, using raw value:', invalidEncoded);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle special characters in URL', () => {
      const hostWithSpecialChars = 'https://api.example.com:8080/path?query=value&param=test';
      const result = resolveAndStoreLinstorHost(hostWithSpecialChars);

      expect(result).toBe('https://api.example.com:8080/path?query=value&param=test');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'LINSTOR_HOST',
        'https://api.example.com:8080/path?query=value&param=test',
      );
    });
  });

  describe('error handling', () => {
    it('should handle URLs with spaces as relative paths', () => {
      const hostWithSpaces = 'invalid url';
      const result = resolveAndStoreLinstorHost(hostWithSpaces);

      expect(result).toBe('https://example.com/invalid%20url');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://example.com/invalid%20url');
    });

    it('should return undefined for invalid URL', () => {
      const invalidHost = 'invalid://url with spaces';
      const result = resolveAndStoreLinstorHost(invalidHost);

      expect(result).toBeUndefined();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle malformed URL as absolute URL with trailing slash removed', () => {
      const malformedHost = 'ht://';
      const result = resolveAndStoreLinstorHost(malformedHost);

      expect(result).toBe('ht:/');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'ht:/');
    });

    it('should handle very long URLs', () => {
      const longPath = 'a'.repeat(1000);
      const longHost = `https://api.example.com/${longPath}`;
      const result = resolveAndStoreLinstorHost(longHost);

      expect(result).toBe(longHost);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', longHost);
    });
  });

  describe('localStorage interaction', () => {
    it('should store resolved host in localStorage', () => {
      const hostParam = 'https://api.example.com:8080';
      resolveAndStoreLinstorHost(hostParam);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://api.example.com:8080');
    });

    it('should overwrite existing localStorage value', () => {
      // Set initial value
      mockLocalStorage.setItem('LINSTOR_HOST', 'https://old.example.com');

      const hostParam = 'https://new.example.com:8080';
      resolveAndStoreLinstorHost(hostParam);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://new.example.com:8080');
    });

    it('should not store anything when URL is actually invalid', () => {
      // Test with a truly invalid URL that would cause URL constructor to throw
      const invalidHost = 'http://[invalid-ipv6]';
      const result = resolveAndStoreLinstorHost(invalidHost);

      expect(result).toBeUndefined();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle IPv4 addresses', () => {
      const ipHost = 'http://192.168.1.100:8080';
      const result = resolveAndStoreLinstorHost(ipHost);

      expect(result).toBe('http://192.168.1.100:8080');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'http://192.168.1.100:8080');
    });

    it('should handle IPv6 addresses', () => {
      const ipv6Host = 'http://[::1]:8080';
      const result = resolveAndStoreLinstorHost(ipv6Host);

      expect(result).toBe('http://[::1]:8080');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'http://[::1]:8080');
    });

    it('should handle localhost', () => {
      const localhostHost = 'http://localhost:8080';
      const result = resolveAndStoreLinstorHost(localhostHost);

      expect(result).toBe('http://localhost:8080');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'http://localhost:8080');
    });

    it('should handle URLs with hash fragments', () => {
      const hostWithHash = 'https://api.example.com:8080/path#fragment';
      const result = resolveAndStoreLinstorHost(hostWithHash);

      expect(result).toBe('https://api.example.com:8080/path#fragment');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'LINSTOR_HOST',
        'https://api.example.com:8080/path#fragment',
      );
    });

    it('should handle very short valid URLs', () => {
      const shortHost = 'a';
      const result = resolveAndStoreLinstorHost(shortHost);

      expect(result).toBe('https://example.com/a');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LINSTOR_HOST', 'https://example.com/a');
    });
  });
});
