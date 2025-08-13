// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { filterResourceList } from '../components/filterResourceList';

// Mock data for testing
const mockResourceList = [
  {
    name: 'database-prod',
    resource_group_name: 'production',
    props: {
      'Aux/description': 'Production database resource',
      'Aux/environment': 'prod',
      'Aux/team': 'database-team',
      'DrbdOptions/auto-promote': 'yes',
    },
  },
  {
    name: 'web-app-staging',
    resource_group_name: 'staging',
    props: {
      'Aux/description': 'Staging web application',
      'Aux/environment': 'staging',
      'Aux/team': 'web-team',
    },
  },
  {
    name: 'cache-redis',
    resource_group_name: 'production',
    props: {
      'Aux/description': 'Redis cache for production',
      'Aux/type': 'cache',
      'Aux/technology': 'redis',
    },
  },
  {
    name: 'test-resource',
    resource_group_name: 'testing',
    props: {
      'Aux/description': 'Resource for testing purposes',
      'Aux/environment': 'test',
    },
  },
  {
    name: 'backup-storage',
    resource_group_name: 'backup',
    props: {
      'Aux/description': 'Long-term backup storage',
      'Aux/retention': '7-years',
    },
  },
  {
    name: 'minimal-resource',
    resource_group_name: 'minimal',
    props: {},
  },
  {
    name: 'no-props-resource',
    resource_group_name: 'production',
    // No props property
  },
];

describe('filterResourceList', () => {
  describe('Basic Functionality', () => {
    it('should return empty array when input list is undefined', () => {
      const result = filterResourceList(undefined, undefined, undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array when input list is null', () => {
      const result = filterResourceList(null as any, undefined, undefined);
      expect(result).toEqual([]);
    });

    it('should return all items when no filters are applied', () => {
      const result = filterResourceList(mockResourceList, undefined, undefined);
      expect(result).toEqual(mockResourceList);
      expect(result).toHaveLength(7);
    });

    it('should return a new array, not modify the original', () => {
      const originalLength = mockResourceList.length;
      const result = filterResourceList(mockResourceList, 'production', undefined);

      expect(mockResourceList.length).toBe(originalLength);
      expect(result).not.toBe(mockResourceList);
    });
  });

  describe('Resource Group Filtering', () => {
    it('should filter by resource group correctly', () => {
      const result = filterResourceList(mockResourceList, 'production', undefined);

      expect(result).toHaveLength(3);
      expect(result.every((item) => item.resource_group_name === 'production')).toBe(true);

      const names = result.map((item) => item.name);
      expect(names).toContain('database-prod');
      expect(names).toContain('cache-redis');
      expect(names).toContain('no-props-resource');
    });

    it('should filter by staging resource group', () => {
      const result = filterResourceList(mockResourceList, 'staging', undefined);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('web-app-staging');
      expect(result[0].resource_group_name).toBe('staging');
    });

    it('should return empty array for non-existent resource group', () => {
      const result = filterResourceList(mockResourceList, 'non-existent', undefined);
      expect(result).toEqual([]);
    });

    it('should handle empty string resource group', () => {
      const result = filterResourceList(mockResourceList, '', undefined);
      expect(result).toEqual(mockResourceList);
    });

    it('should be case-sensitive for resource group matching', () => {
      const result = filterResourceList(mockResourceList, 'PRODUCTION', undefined);
      expect(result).toEqual([]);
    });
  });

  describe('Search Key Filtering', () => {
    it('should filter by resource name (case-insensitive)', () => {
      const result = filterResourceList(mockResourceList, undefined, 'DATABASE');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('database-prod');
    });

    it('should filter by partial resource name match', () => {
      const result = filterResourceList(mockResourceList, undefined, 'web');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('web-app-staging');
    });

    it('should filter by auxiliary properties (case-insensitive)', () => {
      const result = filterResourceList(mockResourceList, undefined, 'REDIS');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('cache-redis');
      expect(result[0].props?.['Aux/technology']).toBe('redis');
    });

    it('should match auxiliary description content', () => {
      const result = filterResourceList(mockResourceList, undefined, 'staging web');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('web-app-staging');
    });

    it('should ignore non-auxiliary properties', () => {
      const result = filterResourceList(mockResourceList, undefined, 'auto-promote');

      // Should not match 'DrbdOptions/auto-promote' as it's not an Aux/ property
      expect(result).toHaveLength(0);
    });

    it('should require minimum 2 characters for search', () => {
      const oneChar = filterResourceList(mockResourceList, undefined, 'a');
      const twoChars = filterResourceList(mockResourceList, undefined, 'da');

      expect(oneChar).toEqual(mockResourceList); // No filtering with 1 char
      expect(twoChars.length).toBeGreaterThan(0); // Filtering with 2+ chars
    });

    it('should handle search key with only whitespace', () => {
      const result = filterResourceList(mockResourceList, undefined, '   ');
      expect(result).toEqual(mockResourceList);
    });

    it('should trim search key before processing', () => {
      const result1 = filterResourceList(mockResourceList, undefined, '  database  ');
      const result2 = filterResourceList(mockResourceList, undefined, 'database');

      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(1);
    });
  });

  describe('Combined Filtering', () => {
    it('should apply both resource group and search key filters', () => {
      const result = filterResourceList(mockResourceList, 'production', 'redis');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('cache-redis');
      expect(result[0].resource_group_name).toBe('production');
    });

    it('should return empty when combined filters match nothing', () => {
      const result = filterResourceList(mockResourceList, 'staging', 'database');
      expect(result).toEqual([]);
    });

    it('should handle multiple matches with combined filters', () => {
      const result = filterResourceList(mockResourceList, 'production', 'prod');

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((item) => item.resource_group_name === 'production')).toBe(true);
      expect(
        result.some(
          (item) =>
            item.name?.toLowerCase().includes('prod') ||
            Object.values(item.props || {}).some((value) => value?.toLowerCase().includes('prod')),
        ),
      ).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle resources with undefined name', () => {
      const resourcesWithUndefinedName = [
        {
          name: undefined,
          resource_group_name: 'test',
          props: {
            'Aux/description': 'resource without name',
          },
        },
      ];

      const result = filterResourceList(resourcesWithUndefinedName, undefined, 'resource');
      expect(result).toHaveLength(1); // Should match via Aux property
    });

    it('should handle resources with null props', () => {
      const resourcesWithNullProps = [
        {
          name: 'null-props',
          resource_group_name: 'test',
          props: null as any,
        },
      ];

      const result = filterResourceList(resourcesWithNullProps, undefined, 'null');
      expect(result).toHaveLength(1); // Should match via name
    });

    it('should handle resources with undefined props', () => {
      const resourcesWithUndefinedProps = [
        {
          name: 'undefined-props',
          resource_group_name: 'test',
          // props is undefined
        },
      ];

      const result = filterResourceList(resourcesWithUndefinedProps, undefined, 'undefined');
      expect(result).toHaveLength(1); // Should match via name
    });

    it('should handle empty auxiliary property values', () => {
      const resourcesWithEmptyAux = [
        {
          name: 'empty-aux',
          resource_group_name: 'test',
          props: {
            'Aux/empty': '',
            'Aux/description': 'test resource',
          },
        },
      ];

      const result = filterResourceList(resourcesWithEmptyAux, undefined, 'test');
      expect(result).toHaveLength(1);
    });

    it('should handle auxiliary properties with undefined values', () => {
      const resourcesWithUndefinedAux = [
        {
          name: 'undefined-aux',
          resource_group_name: 'test',
          props: {
            'Aux/undefined': undefined as any,
            'Aux/description': 'test resource',
          },
        },
      ];

      const result = filterResourceList(resourcesWithUndefinedAux, undefined, 'test');
      expect(result).toHaveLength(1);
    });
  });

  describe('Performance and Large Datasets', () => {
    it('should handle large resource lists efficiently', () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => ({
        name: `resource-${i}`,
        resource_group_name: i % 10 === 0 ? 'production' : 'testing',
        props: {
          'Aux/description': `Description for resource ${i}`,
          'Aux/index': i.toString(),
        },
      }));

      const start = performance.now();
      const result = filterResourceList(largeList, 'production', 'resource');
      const end = performance.now();

      expect(result.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle resources with many properties', () => {
      const resourceWithManyProps = {
        name: 'many-props-resource',
        resource_group_name: 'test',
        props: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`Aux/prop${i}`, `value${i}`])),
      };

      const result = filterResourceList([resourceWithManyProps], undefined, 'value50');
      expect(result).toHaveLength(1);
    });
  });

  describe('Special Characters and Encoding', () => {
    it('should handle Unicode characters in names and properties', () => {
      const unicodeResource = [
        {
          name: 'résource-üñíçødé',
          resource_group_name: 'tëst',
          props: {
            'Aux/description': 'Descripción con acentos',
            'Aux/unicode': '测试资源',
          },
        },
      ];

      const result1 = filterResourceList(unicodeResource, undefined, 'résource');
      const result2 = filterResourceList(unicodeResource, undefined, '测试');

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
    });

    it('should handle special characters in search', () => {
      const specialCharResource = [
        {
          name: 'resource-with-special@#$%',
          resource_group_name: 'test',
          props: {
            'Aux/special': 'value@#$%^&*()',
          },
        },
      ];

      const result = filterResourceList(specialCharResource, undefined, '@#$%');
      expect(result).toHaveLength(1);
    });
  });
});
