// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import {
  agentsFromFormEntries,
  agentsFromStartLines,
  agentsToFormValues,
  findChangedAgent,
  withChangedParams,
} from '../agentForm';

describe('agentsFromStartLines / agentsToFormValues', () => {
  it('numbers the agents and gives OCF agents their params in the form', () => {
    const agents = agentsFromStartLines(['ocf:heartbeat:IPaddr2 vip ip=10.0.0.5', 'nginx.service']);
    expect(agents.map((a) => a.instanceId)).toEqual([0, 1]);
    expect(agents[0].item.ocf_agent?.params).toEqual([{ key: 'ip', value: '10.0.0.5' }]);
    expect(agents[1].item).toEqual({ original: 'nginx.service', is_ocf: false, ocf_agent: null });
    expect(agentsToFormValues(agents)).toEqual([
      { params: { ip: '10.0.0.5' }, original: 'ocf:heartbeat:IPaddr2 vip ip=10.0.0.5' },
      { original: 'nginx.service' },
    ]);
  });
});

describe('agentsFromFormEntries', () => {
  it('builds OCF lines from record or list params, and keeps systemd units as given', () => {
    const agents = agentsFromFormEntries([
      { type: 'ocf', provider: 'heartbeat', agent_type: 'IPaddr2', instance_name: 'vip', params: { ip: '10.0.0.5' } },
      {
        type: 'ocf',
        provider: 'heartbeat',
        agent_type: 'Filesystem',
        instance_name: 'fs',
        params: [
          { key: 'directory', value: '/srv data' },
          { key: 'fstype', value: '' },
        ],
      },
      { type: 'mount', value: 'srv.mount' },
      { type: 'service' },
    ]);
    expect(agents.map((a) => a.item.original)).toEqual([
      'ocf:heartbeat:IPaddr2 vip ip=10.0.0.5',
      `ocf:heartbeat:Filesystem fs directory='/srv data'`,
      'srv.mount',
      '',
    ]);
    // A record arrives as an entry list, which everything downstream reads.
    expect(agents[0].item.ocf_agent?.params).toEqual([{ key: 'ip', value: '10.0.0.5' }]);
    expect(agents.map((a) => a.instanceId)).toEqual([0, 1, 2, 3]);
  });
});

describe('findChangedAgent', () => {
  it('finds the entry in a sparse array', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(findChangedAgent([, , { params: { ip: '1' } }])).toEqual({ idx: 2, changedValue: { params: { ip: '1' } } });
  });

  it('finds the entry keyed by index', () => {
    expect(findChangedAgent({ 1: { original: 'a.service' } })).toEqual({
      idx: 1,
      changedValue: { original: 'a.service' },
    });
  });

  it('reports nothing when no entry changed', () => {
    expect(findChangedAgent([undefined, {}]).idx).toBe(-1);
  });
});

describe('withChangedParams', () => {
  it('updates values in place, appends new keys and regenerates the line', () => {
    const [agent] = agentsFromStartLines(['ocf:heartbeat:IPaddr2 vip ip=10.0.0.5 nic=eth0']);
    const item = withChangedParams(agent, agent.item.ocf_agent!, { nic: 'eth 1', cidr_netmask: '24' });
    expect(item.ocf_agent?.params).toEqual([
      { key: 'ip', value: '10.0.0.5' },
      { key: 'nic', value: 'eth 1' },
      { key: 'cidr_netmask', value: '24' },
    ]);
    expect(item.original).toBe(`ocf:heartbeat:IPaddr2 vip ip=10.0.0.5 nic='eth 1' cidr_netmask=24`);
    expect(item.ocf_agent?.original).toBe(item.original);
  });
});
