// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';

import { buildHaSetupScript } from '../haSetupScript';

describe('buildHaSetupScript', () => {
  it('interpolates the storage pool and node names', () => {
    const script = buildHaSetupScript({ storagePool: 'ha_sp', nodeNames: ['gui01', 'gui02', 'gui03'] });
    expect(script).toContain('STORAGE_POOL = "ha_sp"');
    expect(script).toContain('CLUSTER_NODES = ["gui01","gui02","gui03"]');
    expect(script).toContain('PLACE_COUNT = 3');
  });

  it('falls back to a placeholder pool and default place count without input', () => {
    const script = buildHaSetupScript();
    expect(script).toContain('STORAGE_POOL = "my-thin-pool"');
    expect(script).toContain('CLUSTER_NODES = []');
    expect(script).toContain('PLACE_COUNT = 3');
  });

  it('uses two replicas on a two-node cluster', () => {
    const script = buildHaSetupScript({ storagePool: 'pool', nodeNames: ['a', 'b'] });
    expect(script).toContain('PLACE_COUNT = 2');
  });

  it('trims and drops empty node names', () => {
    const script = buildHaSetupScript({ storagePool: ' pool ', nodeNames: [' a ', '', 'b'] });
    expect(script).toContain('STORAGE_POOL = "pool"');
    expect(script).toContain('CLUSTER_NODES = ["a","b"]');
  });

  it('contains the key setup phases in guide order', () => {
    const script = buildHaSetupScript({ storagePool: 'p', nodeNames: ['a', 'b', 'c'] });
    const phases = [
      '#!/usr/bin/env python3',
      'resource-group', // create RG
      '--auto-promote=no', // drbd options
      'spawn-resources',
      'mkfs.ext4',
      'systemctl", "start", "var-lib-linstor.mount',
      'restart", "drbd-reactor',
      'ON EACH STANDBY NODE',
    ];
    let cursor = -1;
    for (const phase of phases) {
      const at = script.indexOf(phase, cursor + 1);
      expect(at, `phase not found in order: ${phase}`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it('guards against re-running on an HA-configured cluster', () => {
    const script = buildHaSetupScript({ storagePool: 'p' });
    expect(script).toContain('already exists — this cluster');
    expect(script).toContain('confirm("Continue?")');
  });
});
