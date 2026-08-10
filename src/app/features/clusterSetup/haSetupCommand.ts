// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * Builds the command line for `linstor-controller-ha-setup`, the script that
 * ships with linstor-controller and turns a running controller into a highly
 * available one (LINSTOR user guide §3.1). The GUI does not carry the script
 * itself — it only assembles the invocation the operator pastes into a shell
 * on the controller node, filling in the choices it already knows (storage
 * pool, controller candidate nodes). Everything left out is discovered by the
 * script from the live cluster.
 */

/** Where linstor-controller installs the script (LS_PREFIX/bin). */
export const HA_SETUP_SCRIPT_PATH = '/usr/share/linstor-server/bin/linstor-controller-ha-setup';

/** The script itself refuses to run with fewer candidates than this. */
export const MIN_HA_NODES = 2;

/** Above this many nodes the operator gets to pick the controller candidates. */
export const HA_NODE_PICKER_THRESHOLD = 3;

/** Candidates preselected for a cluster that is large enough to need a choice. */
export const DEFAULT_HA_NODE_COUNT = 3;

/**
 * A virtual IP as the script wants it: `address/prefix`. Optional — without a
 * VIP, clients are given the list of controller candidates instead.
 */
export const HA_VIP_PATTERN = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

export const isValidHaVip = (value: string): boolean => {
  const [address, prefix] = value.split('/');
  return (
    HA_VIP_PATTERN.test(value) &&
    address.split('.').every((octet) => Number(octet) <= 255) &&
    Number(prefix) > 0 &&
    Number(prefix) <= 32
  );
};

export interface HaSetupCommandOptions {
  /** Storage pool backing the controller-DB resource. */
  storagePool?: string;
  /** Controller candidate nodes; omitted from the command when empty. */
  nodes?: string[];
  /** Optional controller VIP as `address/prefix`; drbd-reactor floats it. */
  vip?: string;
}

/** Quote a value only when a shell would otherwise mangle it. */
const shellArg = (value: string): string =>
  /^[A-Za-z0-9._:@%+=,/-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`;

export const buildHaSetupCommand = ({ storagePool, nodes, vip }: HaSetupCommandOptions = {}): string => {
  const parts = [HA_SETUP_SCRIPT_PATH];

  const pool = storagePool?.trim();
  if (pool) {
    parts.push('--storage-pool', shellArg(pool));
  }

  const candidates = (nodes ?? []).map((node) => node.trim()).filter(Boolean);
  if (candidates.length > 0) {
    parts.push('--nodes', shellArg(candidates.join(',')));
  }

  const address = vip?.trim();
  if (address) {
    parts.push('--vip', shellArg(address));
  }

  return parts.join(' ');
};
