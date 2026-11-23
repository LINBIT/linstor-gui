// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2026 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { groupBy, sameList, uniqBy } from '../collection';

describe('collection', () => {
  describe('uniqBy', () => {
    it('keeps the first item for each key, in order', () => {
      const items = [
        { name: 'a', node: 'n1' },
        { name: 'b', node: 'n1' },
        { name: 'a', node: 'n2' },
      ];
      expect(uniqBy(items, 'name')).toEqual([
        { name: 'a', node: 'n1' },
        { name: 'b', node: 'n1' },
      ]);
    });

    it('gives an empty list for a missing list', () => {
      expect(uniqBy(undefined as { name: string }[] | undefined, 'name')).toEqual([]);
      expect(uniqBy(null as { name: string }[] | null, 'name')).toEqual([]);
    });
  });

  describe('groupBy', () => {
    it('groups items by the key value', () => {
      const items = [
        { node: 'n1', pool: 'p1' },
        { node: 'n2', pool: 'p1' },
        { node: 'n1', pool: 'p2' },
      ];
      expect(groupBy(items, 'node')).toEqual({
        n1: [
          { node: 'n1', pool: 'p1' },
          { node: 'n1', pool: 'p2' },
        ],
        n2: [{ node: 'n2', pool: 'p1' }],
      });
    });

    it('gives an empty object for a missing list', () => {
      expect(groupBy(undefined as { node: string }[] | undefined, 'node')).toEqual({});
    });
  });

  describe('sameList', () => {
    it('compares values and order', () => {
      expect(sameList(['a', 'b'], ['a', 'b'])).toBe(true);
      expect(sameList(['a', 'b'], ['b', 'a'])).toBe(false);
      expect(sameList(['a'], ['a', 'b'])).toBe(false);
      expect(sameList([], [])).toBe(true);
    });
  });
});
