// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import type { ResourceDefinition } from '@app/features/resourceDefinition';
import type { ResourceDataType } from '../../types';
import {
  auxPropKeys,
  calculatePercentage,
  connectionStatus,
  diskProblem,
  mergeOverviewRows,
  resourceKey,
} from '../overview/rows';
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
  it('counts the nodes a definition is placed on, 0 when it has no resource', () => {
    const rows = mergeOverviewRows(
      [definition(), definition({ name: 'res-none' })],
      [resource(), resource({ node_name: 'node-2' }), resource({ name: 'res-b' })],
    )!;
    expect(rows.map((r) => r.resourceCount)).toEqual([2, 0]);
  });

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

describe('diskProblem', () => {
  const vol = (state: Record<string, unknown>, flags: string[] = [], layers = ['DRBD', 'STORAGE']) =>
    ({
      node_name: 'node-2',
      layer_data_list: layers.map((type) => ({ type })),
      state,
      resource: { flags },
    }) as unknown as OverviewVolume;

  it('is nothing for an UpToDate disk, an intended diskless replica or a volume without DRBD', () => {
    expect(diskProblem(vol({ disk_state: 'UpToDate' }))).toBeNull();
    expect(diskProblem(vol({ disk_state: 'Diskless' }, ['DISKLESS', 'DRBD_DISKLESS']))).toBeNull();
    expect(diskProblem(vol({}, [], ['STORAGE']))).toBeNull();
  });

  it('is a danger for a disk that cannot serve the data', () => {
    expect(diskProblem(vol({ disk_state: 'Inconsistent' }))).toEqual({ text: 'node-2 Inconsistent', tone: 'danger' });
    expect(diskProblem(vol({ disk_state: 'Failed' }))).toEqual({ text: 'node-2 Failed', tone: 'danger' });
    // Diskless without the DISKLESS flag: the disk was lost, not left out on purpose.
    expect(diskProblem(vol({ disk_state: 'Diskless' }))).toEqual({ text: 'node-2 Diskless', tone: 'danger' });
  });

  it('is a warning for an outdated or unknown disk', () => {
    expect(diskProblem(vol({ disk_state: 'Outdated' }))).toEqual({ text: 'node-2 Outdated', tone: 'warning' });
    expect(diskProblem(vol({ disk_state: 'DUnknown' }))).toEqual({ text: 'node-2 Unknown', tone: 'warning' });
  });

  it('shows an Inconsistent disk that receives a sync as the sync with its progress, as a warning', () => {
    const syncing = (done?: number) =>
      vol({
        disk_state: 'Inconsistent',
        replication_states: { 'node-1': { replication_state: 'SyncTarget', done_percentage: done } },
      });
    expect(diskProblem(syncing(12.345))).toEqual({ text: 'node-2 SyncTarget 12.35%', tone: 'warning' });
    expect(diskProblem(syncing())).toEqual({ text: 'node-2 SyncTarget', tone: 'warning' });
  });

  it('stays a danger for an Inconsistent disk whose peers are only Established', () => {
    const stuck = vol({
      disk_state: 'Inconsistent',
      replication_states: { 'node-1': { replication_state: 'Established' } },
    });
    expect(diskProblem(stuck)).toEqual({ text: 'node-2 Inconsistent', tone: 'danger' });
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
