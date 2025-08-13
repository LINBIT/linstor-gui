// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { filterResourceList } from '../filterResourceList';

describe('filterResourceList', () => {
  const mockResources = [
    {
      name: 'resource-1',
      resource_group_name: 'group-a',
      props: {
        'Aux/description': 'Test resource 1',
        'Aux/environment': 'production',
        'NonAux/other': 'value',
      },
    },
    {
      name: 'resource-2',
      resource_group_name: 'group-b',
      props: {
        'Aux/description': 'Development resource',
        'Aux/team': 'backend',
      },
    },
    {
      name: 'prod-resource',
      resource_group_name: 'group-a',
      props: {
        'Aux/environment': 'staging',
      },
    },
    {
      name: 'test-resource',
      resource_group_name: 'group-c',
      props: {},
    },
  ];

  describe('Basic Filtering', () => {
    it('should return empty array when list is undefined', () => {
      const result = filterResourceList(undefined, undefined, undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array when list is null', () => {
      const result = filterResourceList(null as any, undefined, undefined);
      expect(result).toEqual([]);
    });

    it('should return all items when no filters applied', () => {
      const result = filterResourceList(mockResources, undefined, undefined);
      expect(result).toHaveLength(4);
      expect(result).toEqual(mockResources);
    });

    it('should return copy of original array', () => {
      const result = filterResourceList(mockResources, undefined, undefined);
      expect(result).not.toBe(mockResources);
      expect(result).toEqual(mockResources);
    });
  });

  describe('Resource Group Filtering', () => {
    it('should filter by resource group', () => {
      const result = filterResourceList(mockResources, 'group-a', undefined);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name)).toEqual(['resource-1', 'prod-resource']);
    });

    it('should filter by resource group with no matches', () => {
      const result = filterResourceList(mockResources, 'nonexistent-group', undefined);
      expect(result).toHaveLength(0);
    });

    it('should handle empty resource group string', () => {
      const result = filterResourceList(mockResources, '', undefined);
      expect(result).toHaveLength(4);
    });

    it('should filter by specific resource group', () => {
      const result = filterResourceList(mockResources, 'group-c', undefined);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-resource');
    });
  });

  describe('Search Key Filtering', () => {
    it('should filter by name match', () => {
      const result = filterResourceList(mockResources, undefined, 'resource-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('resource-1');
    });

    it('should filter by partial name match', () => {
      const result = filterResourceList(mockResources, undefined, 'prod');
      expect(result).toHaveLength(2); // matches 'prod-resource' and any other with 'prod' in aux props
      expect(result.some((r) => r.name === 'prod-resource')).toBe(true);
    });

    it('should be case insensitive for name matching', () => {
      const result = filterResourceList(mockResources, undefined, 'RESOURCE-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('resource-1');
    });

    it('should filter by auxiliary property value', () => {
      const result = filterResourceList(mockResources, undefined, 'production');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('resource-1');
    });

    it('should filter by auxiliary property value case insensitive', () => {
      const result = filterResourceList(mockResources, undefined, 'DEVELOPMENT');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('resource-2');
    });

    it('should ignore search keys shorter than 2 characters', () => {
      const result = filterResourceList(mockResources, undefined, 'r');
      expect(result).toHaveLength(4);
    });

    it('should handle empty search key', () => {
      const result = filterResourceList(mockResources, undefined, '');
      expect(result).toHaveLength(4);
    });

    it('should handle whitespace-only search key', () => {
      const result = filterResourceList(mockResources, undefined, '   ');
      expect(result).toHaveLength(4);
    });

    it('should trim search key before filtering', () => {
      const result = filterResourceList(mockResources, undefined, '  production  ');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('resource-1');
    });
  });

  describe('Auxiliary Properties Filtering', () => {
    it('should match auxiliary properties but not non-aux properties', () => {
      const result = filterResourceList(mockResources, undefined, 'value');
      expect(result).toHaveLength(0); // 'value' is in 'NonAux/other', not 'Aux/*'
    });

    it('should match multiple auxiliary properties', () => {
      const result = filterResourceList(mockResources, undefined, 'resource');
      expect(result).toHaveLength(4); // matches name + aux description for all resources
    });

    it('should handle resources without props', () => {
      const resourcesWithoutProps = [{ name: 'no-props-resource', resource_group_name: 'group-a' }];
      const result = filterResourceList(resourcesWithoutProps as any, undefined, 'no-props');
      expect(result).toHaveLength(1);
    });

    it('should handle resources with empty props', () => {
      const result = filterResourceList(mockResources, undefined, 'test');
      expect(result).toHaveLength(2); // matches 'test-resource' name and other matches
      expect(result.some((r) => r.name === 'test-resource')).toBe(true);
    });
  });

  describe('Combined Filtering', () => {
    it('should apply both resource group and search key filters', () => {
      const result = filterResourceList(mockResources, 'group-a', 'resource-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('resource-1');
    });

    it('should return empty when both filters exclude all items', () => {
      const result = filterResourceList(mockResources, 'group-a', 'development');
      expect(result).toHaveLength(0);
    });

    it('should handle resource group filter with search in aux properties', () => {
      const result = filterResourceList(mockResources, 'group-a', 'staging');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('prod-resource');
    });

    it('should preserve filter order: resource group first, then search', () => {
      const result = filterResourceList(mockResources, 'group-b', 'backend');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('resource-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle resources with missing name property', () => {
      const resourcesWithMissingName = [
        { resource_group_name: 'group-a', props: {} },
        { name: 'valid-resource', resource_group_name: 'group-a', props: {} },
      ];
      const result = filterResourceList(resourcesWithMissingName as any, undefined, 'valid');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('valid-resource');
    });

    it('should handle resources with undefined auxiliary property values', () => {
      const resourcesWithUndefinedProps = [
        {
          name: 'test-resource',
          resource_group_name: 'group-a',
          props: { 'Aux/description': undefined },
        },
      ];
      const result = filterResourceList(resourcesWithUndefinedProps as any, undefined, 'test');
      expect(result).toHaveLength(1); // should match by name
    });

    it('should handle null auxiliary property values', () => {
      const resourcesWithNullProps = [
        {
          name: 'test-resource',
          resource_group_name: 'group-a',
          props: { 'Aux/description': null },
        },
      ];
      const result = filterResourceList(resourcesWithNullProps as any, undefined, 'description');
      expect(result).toHaveLength(0); // null value should not match
    });

    it('should handle very long search keys', () => {
      const longSearchKey = 'a'.repeat(1000);
      const result = filterResourceList(mockResources, undefined, longSearchKey);
      expect(result).toHaveLength(0);
    });

    it('should handle special characters in search key', () => {
      const resourceWithSpecialChars = [
        {
          name: 'resource-with-special-chars',
          resource_group_name: 'group-a',
          props: { 'Aux/description': 'special-chars: @#$%' },
        },
      ];
      const result = filterResourceList(resourceWithSpecialChars, undefined, '@#$%');
      expect(result).toHaveLength(1);
    });
  });

  describe('Performance and Memory', () => {
    it('should not mutate original array', () => {
      const originalResources = [...mockResources];
      filterResourceList(mockResources, 'group-a', undefined);
      expect(mockResources).toEqual(originalResources);
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        name: `resource-${i}`,
        resource_group_name: i % 2 === 0 ? 'group-even' : 'group-odd',
        props: { 'Aux/index': i.toString() },
      }));

      const result = filterResourceList(largeDataset, 'group-even', '50');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((r) => r.resource_group_name === 'group-even')).toBe(true);
    });
  });
});
