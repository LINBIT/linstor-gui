// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { generateOcfString, ocfParamString, parseOcfString } from '../ocfString';
import { buildReactorToml, readReactorToml } from '../reactorToml';
import { agentsFromStartLines } from '../agentForm';

describe('parseOcfString / generateOcfString', () => {
  it('reads provider, type, instance and quoted or bare params', () => {
    expect(parseOcfString(`ocf:heartbeat:IPaddr2 vip ip=10.0.0.5 cidr_netmask='24' nic="eth0 1"`)).toEqual({
      is_ocf: true,
      provider: 'heartbeat',
      agent_type: 'IPaddr2',
      instance_name: 'vip',
      params: { ip: '10.0.0.5', cidr_netmask: '24', nic: 'eth0 1' },
    });
    expect(parseOcfString('mysql.service')).toEqual({ is_ocf: false });
  });

  it('quotes values with spaces, commas or nothing, and keeps the order', () => {
    const agent = { provider: 'p', agent_type: 'a', instance_name: 'i', params: [] };
    const params = [
      { key: 'b', value: 'x y' },
      { key: 'a', value: '1,2' },
      { key: 'c', value: '' },
      { key: 'd', value: 'plain' },
    ];
    expect(generateOcfString(agent, params)).toBe(`ocf:p:a i b='x y' a='1,2' c='' d=plain`);
    // The line the editor rewrites leaves empty values out.
    expect(ocfParamString(params)).toBe(`b='x y' a='1,2' d=plain`);
  });
});

describe('readReactorToml', () => {
  const file = `
[[promoter]]
[promoter.metadata]
owner = "ha"
[promoter.resources.web]
target-as = "Requires"
start = ["ocf:heartbeat:IPaddr2 vip ip=10.0.0.5", "nginx.service"]
stop = ["x"]
`;

  it('takes the named resource, its other settings and the metadata', () => {
    expect(readReactorToml(file, 'web')).toEqual({
      startArray: ['ocf:heartbeat:IPaddr2 vip ip=10.0.0.5', 'nginx.service'],
      resourceName: 'web',
      metadata: { owner: 'ha' },
      reactor: { 'target-as': 'Requires' },
    });
  });

  it('falls back to the first resource when none is named', () => {
    expect(readReactorToml(file, '').resourceName).toBe('web');
  });

  it('leaves the reactor settings alone when the named resource is missing', () => {
    const read = readReactorToml(file, 'other');
    expect(read.startArray).toEqual([]);
    expect(read.reactor).toBeUndefined();
    expect(read.metadata).toEqual({ owner: 'ha' });
  });

  it('reads a plain top-level start array', () => {
    expect(readReactorToml('start = ["a.service"]', '').startArray).toEqual(['a.service']);
  });

  it('throws on content that is not TOML', () => {
    expect(() => readReactorToml('[[promoter', 'web')).toThrow();
  });
});

describe('buildReactorToml', () => {
  it('writes metadata, the reactor settings and the start lines of one resource', () => {
    const agents = agentsFromStartLines(['ocf:heartbeat:IPaddr2 vip ip=10.0.0.5', 'nginx.service']);
    expect(
      buildReactorToml({
        agents,
        metadataConfig: { owner: 'ha', weight: 2 },
        reactorConfig: { 'target-as': 'Requires', 'on-drbd-demote-failure': '' },
        resourceName: 'web',
      }),
    ).toBe(
      [
        '[[promoter]]',
        '',
        '[promoter.metadata]',
        'owner = "ha"',
        'weight = 2',
        '',
        '[promoter.resources.web]',
        'target-as = "Requires"',
        'start = [',
        '  "ocf:heartbeat:IPaddr2 vip ip=10.0.0.5",',
        '  "nginx.service",',
        ']',
        '',
      ].join('\n'),
    );
  });

  it('round-trips through readReactorToml', () => {
    const lines = ['ocf:heartbeat:Filesystem fs device=/dev/drbd1000 directory=/srv', 'srv.mount'];
    const toml = buildReactorToml({
      agents: agentsFromStartLines(lines),
      metadataConfig: {},
      reactorConfig: {},
      resourceName: 'r1',
    });
    expect(readReactorToml(toml, 'r1').startArray).toEqual(lines);
  });
});
