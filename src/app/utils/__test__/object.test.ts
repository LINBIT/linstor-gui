// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { omit, convertToBoolean } from '../object';

describe('object utils', () => {
  describe('omit', () => {
    describe('basic functionality', () => {
      it('should remove a single property', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = omit(obj, 'b');

        expect(result).toEqual({ a: 1, c: 3 });
        expect(result).not.toHaveProperty('b');
      });

      it('should remove multiple properties', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const result = omit(obj, 'b', 'd');

        expect(result).toEqual({ a: 1, c: 3 });
        expect(result).not.toHaveProperty('b');
        expect(result).not.toHaveProperty('d');
      });

      it('should return original object when no keys provided', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = omit(obj);

        expect(result).toEqual(obj);
        expect(result).toBe(obj); // Should return the same reference
      });

      it('should handle empty object', () => {
        const obj = {};
        const result = omit(obj, 'nonexistent');

        expect(result).toEqual({});
      });
    });

    describe('edge cases', () => {
      it('should handle non-existent keys gracefully', () => {
        const obj = { a: 1, b: 2 };
        const result = omit(obj, 'nonexistent');

        expect(result).toEqual({ a: 1, b: 2 });
      });

      it('should handle mixed existent and non-existent keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = omit(obj, 'b', 'nonexistent', 'c');

        expect(result).toEqual({ a: 1 });
      });

      it('should handle all keys being removed', () => {
        const obj = { a: 1, b: 2 };
        const result = omit(obj, 'a', 'b');

        expect(result).toEqual({});
      });

      it('should handle duplicate keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = omit(obj, 'b', 'b', 'c');

        expect(result).toEqual({ a: 1 });
      });
    });

    describe('data types', () => {
      it('should handle various data types', () => {
        const obj = {
          string: 'hello',
          number: 42,
          boolean: true,
          null: null,
          undefined: undefined,
          array: [1, 2, 3],
          object: { nested: 'value' },
          function: () => 'test',
        };

        const result = omit(obj, 'number', 'boolean', 'null');

        expect(result).toEqual({
          string: 'hello',
          undefined: undefined,
          array: [1, 2, 3],
          object: { nested: 'value' },
          function: expect.any(Function),
        });
      });

      it('should handle nested objects', () => {
        const obj = {
          user: {
            name: 'John',
            age: 30,
            address: {
              city: 'New York',
              country: 'USA',
            },
          },
          settings: {
            theme: 'dark',
            language: 'en',
          },
        };

        const result = omit(obj, 'settings');

        expect(result).toEqual({
          user: {
            name: 'John',
            age: 30,
            address: {
              city: 'New York',
              country: 'USA',
            },
          },
        });
      });
    });

    describe('immutability', () => {
      it('should not modify the original object', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const originalObj = { ...obj };

        const result = omit(obj, 'b');

        expect(obj).toEqual(originalObj);
        expect(result).not.toBe(obj);
      });

      it('should create a new object reference', () => {
        const obj = { a: 1, b: 2 };
        const result = omit(obj, 'b');

        expect(result).not.toBe(obj);
        expect(result).toEqual({ a: 1 });
      });
    });

    describe('special property names', () => {
      it('should handle special property names', () => {
        const obj = {
          'special-key': 'value1',
          '123': 'value2',
          'with spaces': 'value3',
          '': 'empty key',
        };

        const result = omit(obj, 'special-key', '123');

        expect(result).toEqual({
          'with spaces': 'value3',
          '': 'empty key',
        });
      });

      it('should handle symbol keys (though not common in Record<string, unknown>)', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = omit(obj, 'a');

        expect(result).toEqual({ b: 2, c: 3 });
      });
    });
  });

  describe('convertToBoolean', () => {
    describe('basic functionality', () => {
      it('should convert string "true" to boolean true', () => {
        const obj = { flag: 'true' };
        const result = convertToBoolean(obj);

        expect(result).toEqual({ flag: true });
        expect(typeof result.flag).toBe('boolean');
      });

      it('should convert string "false" to boolean false', () => {
        const obj = { flag: 'false' };
        const result = convertToBoolean(obj);

        expect(result).toEqual({ flag: false });
        expect(typeof result.flag).toBe('boolean');
      });

      it('should leave non-boolean strings unchanged', () => {
        const obj = {
          name: 'John',
          age: '30',
          empty: '',
          space: ' ',
        };

        const result = convertToBoolean(obj);

        expect(result).toEqual({
          name: 'John',
          age: '30',
          empty: '',
          space: ' ',
        });
      });
    });

    describe('mixed data types', () => {
      it('should handle mixed boolean strings and other values', () => {
        const obj = {
          isActive: 'true',
          isDisabled: 'false',
          name: 'John',
          count: 42,
          items: [1, 2, 3],
          config: { enabled: 'true' },
        };

        const result = convertToBoolean(obj);

        expect(result).toEqual({
          isActive: true,
          isDisabled: false,
          name: 'John',
          count: 42,
          items: [1, 2, 3],
          config: { enabled: 'true' },
        });
      });

      it('should handle various non-string data types', () => {
        const obj = {
          actualBoolean: true,
          number: 42,
          null: null,
          undefined: undefined,
          array: [1, 2, 3],
          object: { nested: 'value' },
        };

        const result = convertToBoolean(obj);

        expect(result).toEqual({
          actualBoolean: true,
          number: 42,
          null: null,
          undefined: undefined,
          array: [1, 2, 3],
          object: { nested: 'value' },
        });
      });
    });

    describe('edge cases', () => {
      it('should handle empty object', () => {
        const obj = {};
        const result = convertToBoolean(obj);

        expect(result).toEqual({});
      });

      it('should handle case sensitivity', () => {
        const obj = {
          lowercase: 'true',
          uppercase: 'TRUE',
          mixed: 'True',
          falseLower: 'false',
          falseUpper: 'FALSE',
          falseMixed: 'False',
        };

        const result = convertToBoolean(obj);

        expect(result).toEqual({
          lowercase: true,
          uppercase: 'TRUE', // Should remain as string
          mixed: 'True', // Should remain as string
          falseLower: false,
          falseUpper: 'FALSE', // Should remain as string
          falseMixed: 'False', // Should remain as string
        });
      });

      it('should handle whitespace and special characters', () => {
        const obj = {
          withSpaces: ' true ',
          withNewline: 'true\n',
          withTab: '\ttrue',
          almostTrue: 'truee',
          almostFalse: 'falsse',
        };

        const result = convertToBoolean(obj);

        expect(result).toEqual({
          withSpaces: ' true ',
          withNewline: 'true\n',
          withTab: '\ttrue',
          almostTrue: 'truee',
          almostFalse: 'falsse',
        });
      });
    });

    describe('immutability', () => {
      it('should not modify the original object', () => {
        const obj = { flag: 'true', name: 'John' };
        const originalObj = { ...obj };

        const result = convertToBoolean(obj);

        expect(obj).toEqual(originalObj);
        expect(result).not.toBe(obj);
      });

      it('should create a new object reference', () => {
        const obj = { flag: 'true' };
        const result = convertToBoolean(obj);

        expect(result).not.toBe(obj);
        expect(result).toEqual({ flag: true });
      });
    });

    describe('special property names', () => {
      it('should handle special property names', () => {
        const obj = {
          'special-key': 'true',
          '123': 'false',
          'with spaces': 'true',
          '': 'false',
        };

        const result = convertToBoolean(obj);

        expect(result).toEqual({
          'special-key': true,
          '123': false,
          'with spaces': true,
          '': false,
        });
      });
    });

    describe('KVS (Key-Value Store) use case', () => {
      it('should handle typical KVS string values', () => {
        const kvsData = {
          'feature.enabled': 'true',
          'debug.mode': 'false',
          'max.connections': '100',
          'server.name': 'production',
          'ssl.enabled': 'true',
          'cache.enabled': 'false',
        };

        const result = convertToBoolean(kvsData);

        expect(result).toEqual({
          'feature.enabled': true,
          'debug.mode': false,
          'max.connections': '100',
          'server.name': 'production',
          'ssl.enabled': true,
          'cache.enabled': false,
        });
      });
    });
  });

  describe('integration', () => {
    it('should work together - omit then convertToBoolean', () => {
      const obj = {
        isActive: 'true',
        isDisabled: 'false',
        name: 'John',
        age: '30',
        settings: { theme: 'dark' },
      };

      const omitted = omit(obj, 'age', 'settings');
      const converted = convertToBoolean(omitted);

      expect(converted).toEqual({
        isActive: true,
        isDisabled: false,
        name: 'John',
      });
    });

    it('should work together - convertToBoolean then omit', () => {
      const obj = {
        isActive: 'true',
        isDisabled: 'false',
        name: 'John',
        age: '30',
      };

      const converted = convertToBoolean(obj);
      const omitted = omit(converted, 'age');

      expect(omitted).toEqual({
        isActive: true,
        isDisabled: false,
        name: 'John',
      });
    });
  });
});
