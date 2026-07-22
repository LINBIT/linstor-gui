// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';

import { buildHaSetupScript } from '../haSetupScript';

describe('buildHaSetupScript', () => {
  it('prefills the wizard storage pool', () => {
    const script = buildHaSetupScript({ storagePool: 'ha_sp' });
    expect(script).toContain('STORAGE_POOL = "ha_sp"');
  });

  it('defaults to auto-detection without wizard input', () => {
    const script = buildHaSetupScript();
    expect(script).toContain('STORAGE_POOL = ""');
    expect(script).toContain('def resolve_storage_pool');
  });

  it('resolves the storage pool at runtime — auto for one, interactive for many', () => {
    const script = buildHaSetupScript();
    expect(script).toContain('def choose');
    expect(script).toContain('Multiple storage pools found');
    // no longer bails out asking the user to hand-edit a constant
    expect(script).not.toContain('cannot auto-detect the storage pool');
    // still supports a non-interactive override + rejects an EOF (piped) run
    expect(script).toContain('no TTY to choose');
  });

  it('discovers nodes, replica count and controller IPs at runtime', () => {
    const script = buildHaSetupScript({ storagePool: 'p' });
    // no wizard-baked cluster facts besides the pool prefill
    expect(script).not.toContain('CLUSTER_NODES =');
    expect(script).not.toContain('PLACE_COUNT =');
    expect(script).toContain('def cluster_node_names');
    expect(script).toContain('def db_place_count');
    expect(script).toContain('def client_conf_text');
    expect(script).toContain('/etc/linstor/linstor-client.conf');
  });

  it('contains the key setup phases in guide order', () => {
    const script = buildHaSetupScript({ storagePool: 'p' });
    const phases = [
      '#!/usr/bin/env python3',
      'resource-group', // create RG
      '--auto-promote=no', // drbd options
      'spawn-resources',
      'mkfs.ext4',
      'systemctl", "start", "var-lib-linstor.mount',
      'install_reactor_reload', // hand off to reactor via the reload path unit
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

  it('requires the local node to be a registered cluster node', () => {
    const script = buildHaSetupScript({ storagePool: 'p' });
    expect(script).toContain('is not registered in the LINSTOR');
  });

  it('sanity-checks packages without auto-installing', () => {
    const script = buildHaSetupScript({ storagePool: 'p' });
    expect(script).toContain('command -v drbd-reactor >/dev/null');
    expect(script).toContain('deliberately does not install packages');
    expect(script).not.toContain('chattr');
    expect(script).not.toContain('apt-get install');
  });

  it('activates the promoter via the auto-reload path unit, not a restart', () => {
    const script = buildHaSetupScript({ storagePool: 'p' });
    // local flow + standby block both install the reload path unit
    expect(script).toContain('drbd-reactor-reload.path');
    expect(script).toContain('def install_reactor_reload');
    expect(script).toContain('PathChanged=/etc/drbd-reactor.d');
    // the fragile `systemctl restart drbd-reactor` is gone (SIGHUP reload instead)
    expect(script).not.toContain('systemctl restart drbd-reactor');
    expect(script).not.toContain('"restart", "drbd-reactor"');
  });
});
