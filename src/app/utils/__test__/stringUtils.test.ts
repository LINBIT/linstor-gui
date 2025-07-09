// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { capitalize, uniqId, getString, isUrl } from '../stringUtils';

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
      expect(isUrl(null as any)).toBe(false);
    });
  });
});
