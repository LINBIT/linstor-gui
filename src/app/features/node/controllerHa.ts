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

/** The resource whose drbd-reactor promoter starts the controller, if this config has one. */
export const controllerResourceInReactorConfig = (toml: string): string | undefined => {
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
      const start = Array.isArray(resource?.start) ? resource.start : [];
      if (start.some((unit) => typeof unit === 'string' && unit.trim() === CONTROLLER_SERVICE)) {
        return name;
      }
    }
  }
  return undefined;
};

/**
 * The controller's HA resource among LINSTOR's external files: the first
 * drbd-reactor config that starts the controller, else the conventional name.
 */
export const controllerHaResource = (files: { path?: string; content?: string }[]): string => {
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
    const resource = controllerResourceInReactorConfig(text);
    if (resource) {
      return resource;
    }
  }
  return CONTROLLER_HA_RESOURCE;
};
