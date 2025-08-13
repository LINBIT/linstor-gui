// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { capitalize, uniqId, getString, isUrl, generateUUID } from '../stringUtils';

describe('stringUtils', () => {
  describe('capitalize', () => {
    it('should capitalize the first letter and lowercase the rest', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('hELLO')).toBe('Hello');
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('should handle edge cases', () => {
      expect(capitalize('')).toBe('');
      expect(capitalize('1')).toBe('1');
      expect(capitalize(undefined)).toBe('');
      // allow null to be passed, but it should return false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(capitalize(null as any)).toBe('');
    });
  });

  describe('uniqId', () => {
    it('should generate unique IDs with correct format', () => {
      const id1 = uniqId();
      const id2 = uniqId();

      expect(id1).toMatch(/^_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^_[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getString', () => {
    it('should trim whitespace and remove quotes', () => {
      expect(getString('hello')).toBe('hello');
      expect(getString('  hello  ')).toBe('hello');
      expect(getString('"AUTHENTICATED"')).toBe('AUTHENTICATED');
      expect(getString('"hello world"')).toBe('hello world');
      expect(getString('hello "world"')).toBe('hello world');
      expect(getString('""')).toBe('');
      expect(getString('   ""   ')).toBe('');
    });
  });

  describe('isUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isUrl('https://example.com')).toBe(true);
      expect(isUrl('http://example.com')).toBe(true);
      expect(isUrl('ftp://example.com')).toBe(true);
      expect(isUrl('https://example.com/path')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isUrl('invalid-url')).toBe(false);
      expect(isUrl('not a url')).toBe(false);
      expect(isUrl('')).toBe(false);
      expect(isUrl(undefined)).toBe(false);
      // allow null to be passed, but it should return false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isUrl(null as any)).toBe(false);
    });
  });

  describe('generateUUID', () => {
    it('should generate UUIDs with correct format', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid1).toMatch(uuidRegex);
      expect(uuid2).toMatch(uuidRegex);
      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      expect(uuids.size).toBe(100);
    });

    it('should always have version 4 indicator', () => {
      for (let i = 0; i < 10; i++) {
        const uuid = generateUUID();
        expect(uuid.charAt(14)).toBe('4'); // Version indicator
        expect(['8', '9', 'a', 'b']).toContain(uuid.charAt(19).toLowerCase()); // Variant indicator
      }
    });
  });
});
