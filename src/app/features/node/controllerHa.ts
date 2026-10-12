// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { parse } from 'smol-toml';

/**
 * The resource holding the controller database when the controller is made
 * highly available: the name the user's guide and linstor-controller-ha-setup
 * give it. Used when no drbd-reactor config in LINSTOR names one (the setup
 * script writes its config on each node, outside LINSTOR).
 */
export const CONTROLLER_HA_RESOURCE = 'linstor_db';

const CONTROLLER_SERVICE = 'linstor-controller.service';

/** The controller's promoter in a drbd-reactor config: its resource, and the service IP it brings up. */
interface ControllerPromoter {
  resource: string;
  /** From an `ocf:heartbeat:IPaddr2 … ip=<address>` start entry. */
  vip?: string;
}

const controllerPromoterInReactorConfig = (toml: string): ControllerPromoter | undefined => {
  let doc: Record<string, unknown>;
  try {
    doc = parse(toml);
  } catch {
    return undefined;
  }
  const promoters = Array.isArray(doc.promoter) ? doc.promoter : [];
  for (const promoter of promoters) {
    const resources = (promoter as { resources?: Record<string, { start?: unknown }> })?.resources ?? {};
    for (const [name, resource] of Object.entries(resources)) {
      const start = (Array.isArray(resource?.start) ? resource.start : []).filter(
        (unit): unit is string => typeof unit === 'string',
      );
      if (start.some((unit) => unit.trim() === CONTROLLER_SERVICE)) {
        const vip = start.map((unit) => unit.match(/^ocf:heartbeat:IPaddr2\b.*\bip=(\S+)/)?.[1]).find(Boolean);
        return { resource: name, vip };
      }
    }
  }
  return undefined;
};

/** The resource whose drbd-reactor promoter starts the controller, if this config has one. */
export const controllerResourceInReactorConfig = (toml: string): string | undefined =>
  controllerPromoterInReactorConfig(toml)?.resource;

/**
 * The controller's promoter among LINSTOR's external files: the first
 * drbd-reactor config that starts the controller, else the conventional
 * resource name (and no known service IP).
 */
export const controllerHaPromoter = (files: { path?: string; content?: string }[]): ControllerPromoter => {
  for (const file of files) {
    if (!file.path?.startsWith('/etc/drbd-reactor.d/') || !file.path.endsWith('.toml') || !file.content) {
      continue;
    }
    let text: string;
    try {
      text = atob(file.content);
    } catch {
      continue;
    }
    const promoter = controllerPromoterInReactorConfig(text);
    if (promoter) {
      return promoter;
    }
  }
  return { resource: CONTROLLER_HA_RESOURCE };
};

/** The controller's HA resource among LINSTOR's external files (see controllerHaPromoter). */
export const controllerHaResource = (files: { path?: string; content?: string }[]): string =>
  controllerHaPromoter(files).resource;
