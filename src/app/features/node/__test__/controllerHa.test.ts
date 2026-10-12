// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';

import { controllerHaResource, controllerResourceInReactorConfig } from '../controllerHa';

// As the controller HA guide and linstor-controller-ha-setup write it.
const CONTROLLER_CONFIG = `[[promoter]]

[promoter.resources.linstor_db]
start = [
  "var-lib-linstor.mount",
  "ocf:heartbeat:IPaddr2 service_ip cidr_netmask=24 ip=192.0.2.10",
  "linstor-controller.service",
]
`;

const MYSQL_CONFIG = `[[promoter]]
[promoter.resources.ha_mysql]
start = ["var-lib-mysql.mount", "mysql.service"]
`;

const file = (path: string, toml: string) => ({ path, content: btoa(toml) });

describe('controller HA resource', () => {
  it('finds the resource whose promoter starts the controller', () => {
    expect(controllerResourceInReactorConfig(CONTROLLER_CONFIG)).toBe('linstor_db');
    expect(controllerResourceInReactorConfig(CONTROLLER_CONFIG.replace(/linstor_db/g, 'ctrl_db'))).toBe('ctrl_db');
  });

  it('ignores promoters of other services and configs that do not parse', () => {
    expect(controllerResourceInReactorConfig(MYSQL_CONFIG)).toBeUndefined();
    expect(controllerResourceInReactorConfig('[[promoter')).toBeUndefined();
    expect(controllerResourceInReactorConfig('[prometheus]\nenums = true\n')).toBeUndefined();
  });

  it('takes the name from the drbd-reactor config among the external files', () => {
    expect(
      controllerHaResource([
        file('/etc/drbd-reactor.d/ha_mysql.toml', MYSQL_CONFIG),
        { path: '/etc/systemd/system/var-lib-mysql.mount', content: btoa('[Mount]') },
        file('/etc/drbd-reactor.d/ctrl.toml', CONTROLLER_CONFIG.replace(/linstor_db/g, 'ctrl_db')),
      ]),
    ).toBe('ctrl_db');
  });

  it('falls back to linstor_db when no config in LINSTOR starts the controller', () => {
    // The setup script writes its config on each node, outside LINSTOR.
    expect(controllerHaResource([file('/etc/drbd-reactor.d/ha_mysql.toml', MYSQL_CONFIG)])).toBe('linstor_db');
    expect(controllerHaResource([{ path: '/etc/drbd-reactor.d/broken.toml', content: '%%%' }])).toBe('linstor_db');
    expect(controllerHaResource([])).toBe('linstor_db');
  });
});
