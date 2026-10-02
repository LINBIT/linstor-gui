// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { parse } from 'smol-toml';
import type { DRBDReactorConfigValues } from './DRBDReactorConfig';
import { generateOcfString } from './ocfString';
import type { OcfAgentWithMetadata } from './types';

export function generateReactorConfigString(config: DRBDReactorConfigValues): string {
  return Object.entries(config)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key} = ${JSON.stringify(value)}`;
      }
      if (typeof value === 'string') {
        return `${key} = "${value}"`;
      }
      return `${key} = ${value}`;
    })
    .join('\n');
}

export function generateMetadataString(metadata: Record<string, string | number | boolean>): string {
  return Object.entries(metadata)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key} = "${value}"`;
      }
      return `${key} = ${value}`;
    })
    .join('\n');
}

/**
 * The parts of a drbd-reactor TOML file the editor reads. smol-toml returns an
 * untyped table, so this is asserted, not checked.
 */
interface ReactorResourceSection {
  start?: string[];
  stop?: string[];
  [key: string]: unknown;
}
interface ReactorToml {
  start?: string[];
  promoter?: PromoterSection | PromoterSection[];
}
interface PromoterSection {
  metadata?: Record<string, string | number | boolean>;
  resources?: Record<string, ReactorResourceSection>;
}

/**
 * What the editor reads from a drbd-reactor file: the start lines of one
 * promoter resource (the named one, else the first), its other settings, and
 * the promoter metadata. Throws when the content is not TOML.
 */
export function readReactorToml(
  content: string,
  resourceName: string,
): {
  startArray: string[];
  resourceName: string;
  metadata?: Record<string, string | number | boolean>;
  reactor?: DRBDReactorConfigValues;
} {
  const parsedToml = parse(content) as ReactorToml;
  let startArray: string[] = [];
  let metadata: Record<string, string | number | boolean> | undefined;
  let reactor: DRBDReactorConfigValues | undefined;
  let finalResourceName = resourceName;

  if (Array.isArray(parsedToml.start)) {
    startArray = parsedToml.start;
  } else if (parsedToml.promoter) {
    const promoters = Array.isArray(parsedToml.promoter) ? parsedToml.promoter : [parsedToml.promoter];
    for (const p of promoters) {
      if (p.metadata) {
        metadata = p.metadata;
      }

      if (!finalResourceName && p.resources) {
        const resourceNames = Object.keys(p.resources);
        if (resourceNames.length > 0) {
          finalResourceName = resourceNames[0];
        }
      }

      if (finalResourceName && p.resources?.[finalResourceName]) {
        const resourceConfig = p.resources[finalResourceName];
        if (resourceConfig.start && Array.isArray(resourceConfig.start)) {
          startArray = resourceConfig.start;
        }

        // start/stop are edited as agents; everything else is reactor config.
        const { start: _start, stop: _stop, ...otherConfig } = resourceConfig;
        reactor = otherConfig;
        break;
      }
    }
  }

  return { startArray, resourceName: finalResourceName, metadata, reactor };
}

/** The drbd-reactor promoter file the editor saves. */
export function buildReactorToml({
  agents,
  metadataConfig,
  reactorConfig,
  resourceName,
}: {
  agents: OcfAgentWithMetadata[];
  metadataConfig: Record<string, string | number | boolean>;
  reactorConfig: DRBDReactorConfigValues;
  resourceName: string;
}): string {
  // Generate start array items
  const agentStrings = agents.map((agentWithMeta) => {
    const item = agentWithMeta.item;
    if (item.is_ocf && item.ocf_agent) {
      const agent = item.ocf_agent;
      const params = agent.params || [];
      const result = generateOcfString(agent, params);
      return `"${result}"`;
    } else {
      return `"${item.original}"`;
    }
  });

  // Construct full TOML
  let toml = `[[promoter]]\n\n`;

  if (Object.keys(metadataConfig).length > 0) {
    toml += `[promoter.metadata]\n`;
    toml += generateMetadataString(metadataConfig) + '\n\n';
  }

  toml += `[promoter.resources.${resourceName}]\n`;

  const reactorConfigString = generateReactorConfigString(reactorConfig);
  if (reactorConfigString) {
    toml += reactorConfigString + '\n';
  }

  toml += `start = [\n${agentStrings.map((s) => `  ${s},`).join('\n')}\n]\n`;

  return toml;
}
