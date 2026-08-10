// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it } from 'vitest';

import { HA_SETUP_SCRIPT_PATH, buildHaSetupCommand, isValidHaVip } from '../haSetupCommand';

describe('buildHaSetupCommand', () => {
  it('points at the script shipped by linstor-controller', () => {
    expect(buildHaSetupCommand()).toBe(HA_SETUP_SCRIPT_PATH);
    expect(HA_SETUP_SCRIPT_PATH).toBe('/usr/share/linstor-server/bin/linstor-controller-ha-setup');
  });

  it('passes the storage pool the wizard created', () => {
    expect(buildHaSetupCommand({ storagePool: 'ha_sp' })).toBe(`${HA_SETUP_SCRIPT_PATH} --storage-pool ha_sp`);
  });

  it('passes the controller candidates as one comma-separated list', () => {
    expect(buildHaSetupCommand({ storagePool: 'ha_sp', nodes: ['n1', 'n2', 'n3'] })).toBe(
      `${HA_SETUP_SCRIPT_PATH} --storage-pool ha_sp --nodes n1,n2,n3`,
    );
  });

  it('omits options it has no value for — the script then auto-detects', () => {
    expect(buildHaSetupCommand({ nodes: ['n1', 'n2'] })).toBe(`${HA_SETUP_SCRIPT_PATH} --nodes n1,n2`);
    expect(buildHaSetupCommand({ storagePool: '   ', nodes: [] })).toBe(HA_SETUP_SCRIPT_PATH);
  });

  it('drops blank node entries', () => {
    expect(buildHaSetupCommand({ nodes: [' n1 ', '', '  ', 'n2'] })).toBe(`${HA_SETUP_SCRIPT_PATH} --nodes n1,n2`);
  });

  it('passes an optional controller VIP', () => {
    expect(buildHaSetupCommand({ storagePool: 'ha_sp', nodes: ['n1', 'n2', 'n3'], vip: '10.0.0.100/24' })).toBe(
      `${HA_SETUP_SCRIPT_PATH} --storage-pool ha_sp --nodes n1,n2,n3 --vip 10.0.0.100/24`,
    );
  });

  it('leaves the VIP out when none is given — clients get the candidate list', () => {
    expect(buildHaSetupCommand({ nodes: ['n1', 'n2'] })).not.toContain('--vip');
    expect(buildHaSetupCommand({ nodes: ['n1', 'n2'], vip: '  ' })).not.toContain('--vip');
  });

  it('accepts only address/prefix as a VIP', () => {
    for (const good of ['10.0.0.100/24', '192.168.1.1/32', '172.16.0.5/16']) {
      expect(isValidHaVip(good), good).toBe(true);
    }
    for (const bad of ['10.0.0.100', '10.0.0.100/', '10.0.0.100/33', '10.0.0.100/0', '999.0.0.1/24', 'nope']) {
      expect(isValidHaVip(bad), bad).toBe(false);
    }
  });

  it('quotes values a shell would otherwise mangle', () => {
    expect(buildHaSetupCommand({ storagePool: 'my pool' })).toBe(`${HA_SETUP_SCRIPT_PATH} --storage-pool 'my pool'`);
    expect(buildHaSetupCommand({ storagePool: "it's" })).toContain(`'it'\\''s'`);
  });
});
