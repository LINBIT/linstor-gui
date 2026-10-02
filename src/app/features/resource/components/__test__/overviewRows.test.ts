// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import type { ResourceDefinition } from '@app/features/resourceDefinition';
import type { ResourceDataType } from '../../types';
import { auxPropKeys, calculatePercentage, connectionStatus, mergeOverviewRows, resourceKey } from '../overview/rows';
import type { OverviewRow, OverviewVolume } from '../overview/types';

const definition = (over: Partial<ResourceDefinition> = {}) =>
  ({
    name: 'res-a',
    resource_group_name: 'rg1',
    volume_definitions: [
      { volume_number: 0, size_kib: 1024 },
      { volume_number: 1, size_kib: 2048 },
    ],
    ...over,
  }) as ResourceDefinition;

const resource = (over: Partial<ResourceDataType> = {}) =>
  ({
    name: 'res-a',
    node_name: 'node-1',
    flags: ['DRBD_DISKLESS'],
    state: { in_use: false },
    volumes: [{ volume_number: 0 }, { volume_number: 1 }],
    ...over,
  }) as ResourceDataType;

describe('mergeOverviewRows', () => {
  it('has no rows before the definitions arrive', () => {
    expect(mergeOverviewRows(undefined, [resource()])).toBeUndefined();
  });

  it('gives each definition its deployed volumes, sized from the matching volume definition', () => {
    const [row] = mergeOverviewRows([definition()], [resource(), resource({ name: 'res-b' })])!;
    expect(row.volumeDefinitions).toHaveLength(2);
    expect(row.volumes.map((v) => [v.node_name, v.volume_number, v.size_kib])).toEqual([
      ['node-1', 0, 1024],
      ['node-1', 1, 2048],
    ]);
    expect(row.volumes[0]).toMatchObject({
      resource_name: 'res-a',
      resource_group_name: 'rg1',
      flags: ['DRBD_DISKLESS'],
      primary_node: '',
    });
  });

  it('marks the node a resource is in use on as primary', () => {
    const [row] = mergeOverviewRows([definition()], [resource({ node_name: 'node-2', state: { in_use: true } })])!;
    expect(row.volumes.every((v) => v.primary_node === 'node-2')).toBe(true);
  });

  it('keeps a definition without volume definitions or deployments', () => {
    const [row] = mergeOverviewRows([definition({ volume_definitions: undefined })], undefined)!;
    expect(row.volumes).toEqual([]);
    expect(row.volumeDefinitions).toEqual([]);
  });

  it('sizes a volume without a matching definition as 0', () => {
    const [row] = mergeOverviewRows(
      [definition({ volume_definitions: [] })],
      [resource({ volumes: [{ volume_number: 3 }] } as Partial<ResourceDataType>)],
    )!;
    expect(row.volumes[0].size_kib).toBe(0);
  });
});

describe('connectionStatus', () => {
  const withConnections = (connections: Record<string, { connected?: boolean; message?: string }>) =>
    ({ layer_object: { drbd: { connections } } }) as unknown as ResourceDataType;

  it('is OK without DRBD connections', () => {
    expect(connectionStatus({} as ResourceDataType)).toBe('OK');
  });

  it('is OK when every peer is connected', () => {
    expect(connectionStatus(withConnections({ 'node-2': { connected: true } }))).toBe('OK');
  });

  it('lists each disconnected peer with its message', () => {
    expect(
      connectionStatus(
        withConnections({
          'node-2': { connected: false, message: 'Connecting' },
          'node-3': { connected: true },
          'node-4': { connected: false, message: 'StandAlone' },
        }),
      ),
    ).toBe('node-2 Connecting,node-4 StandAlone');
  });
});

describe('calculatePercentage', () => {
  it('is 0.00 for an empty total', () => {
    expect(calculatePercentage(10, 0)).toBe('0.00');
    expect(calculatePercentage()).toBe('0.00');
  });

  it('rounds to two places and caps at 100', () => {
    expect(calculatePercentage(1, 3)).toBe('33.33');
    expect(calculatePercentage(5, 4)).toBe('100.00');
  });
});

describe('auxPropKeys and resourceKey', () => {
  it('collects the Aux/* property names once', () => {
    const rows = [
      { props: { 'Aux/site': 'a', DrbdOptions: 'x' } },
      { props: { 'Aux/site': 'b', 'Aux/rack': '1' } },
      {},
    ] as unknown as OverviewRow[];
    expect(auxPropKeys(rows)).toEqual(['Aux/site', 'Aux/rack']);
    expect(auxPropKeys(undefined)).toEqual([]);
  });

  it('keys a deployed volume by resource and node', () => {
    expect(resourceKey({ resource_name: 'res-a', node_name: 'node-1' } as OverviewVolume)).toBe('res-a@node-1');
    expect(resourceKey({} as OverviewVolume)).toBe('@');
  });
});
