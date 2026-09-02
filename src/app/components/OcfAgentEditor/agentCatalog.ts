// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * The resource-agent catalog the editor picks from.
 *
 * Two sources, one catalog: `all_agents.ts` is generated from the upstream
 * ClusterLabs/LINBIT agents (Linux), `windows_agents.ts` describes the WinDRBD
 * agents. A DRBD Reactor `start` entry is written as `ocf:<provider>:<type>`
 * either way — the platform is not part of that line, so it exists here only
 * to describe and filter what is on offer.
 */

import { allAgents as linuxAgents } from './all_agents';
import { windowsAgents } from './windows_agents';

export type AgentPlatform = 'linux' | 'windows';

export const AGENT_PLATFORMS: AgentPlatform[] = ['linux', 'windows'];

/**
 * Parse a build-time platform list such as "windows" or "linux,windows".
 * Unknown names are dropped; an empty or all-unknown list yields null so the
 * caller can fall back to the built-in default.
 */
export function parsePlatformList(value: string | undefined): AgentPlatform[] | null {
  if (!value) return null;
  const wanted = value
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is AgentPlatform => (AGENT_PLATFORMS as string[]).includes(p));
  return wanted.length > 0 ? [...new Set(wanted)] : null;
}

/** What the editor starts with. Linux only by default, so a Linux cluster is
 *  never offered agents it cannot run; a build for a Windows product (SDS /
 *  WinDRBD) sets VITE_OCF_AGENT_PLATFORMS=windows (or linux,windows) at
 *  build time to start on its own platform instead. */
export const DEFAULT_AGENT_PLATFORMS: AgentPlatform[] = parsePlatformList(import.meta.env.VITE_OCF_AGENT_PLATFORMS) ?? [
  'linux',
];

export const AGENT_PLATFORM_LABELS: Record<AgentPlatform, string> = {
  linux: 'Linux',
  windows: 'Windows',
};

export interface AgentParameter {
  name: string;
  unique?: boolean;
  required?: boolean;
  shortdesc?: string;
  longdesc?: string;
  type?: string;
  default?: string;
}

export interface CatalogAgent {
  name: string;
  version?: string;
  shortdesc?: string;
  longdesc?: string;
  parameters: AgentParameter[];
  /** Which platform this agent runs on. */
  platform: AgentPlatform;
  provider: string;
}

export interface AgentsByProvider {
  providers: Record<string, CatalogAgent[]>;
}

interface RawSource {
  providers: Record<string, Array<Omit<CatalogAgent, 'platform' | 'provider'>>>;
}

const tag = (source: RawSource, platform: AgentPlatform): CatalogAgent[] =>
  Object.entries(source.providers).flatMap(([provider, agents]) =>
    agents.map((agent) => ({ ...agent, platform, provider })),
  );

/**
 * Every agent, flat. Linux first: an `ocf:<provider>:<type>` line carries no
 * platform, so a lookup by provider+name has to keep resolving to what it
 * resolved to before Windows agents joined the catalog.
 */
export const agentList: CatalogAgent[] = [
  ...tag(linuxAgents as RawSource, 'linux'),
  ...tag(windowsAgents as RawSource, 'windows'),
];

/** The same agents grouped by provider, which is how metadata is looked up. */
export const agentCatalog: AgentsByProvider = {
  providers: agentList.reduce<Record<string, CatalogAgent[]>>((providers, agent) => {
    (providers[agent.provider] ??= []).push(agent);
    return providers;
  }, {}),
};

/** Stable identity of a catalog entry — provider and name alone are not unique
 *  across platforms. */
export const agentKey = (agent: Pick<CatalogAgent, 'platform' | 'provider' | 'name'>): string =>
  `${agent.platform}:${agent.provider}:${agent.name}`;

/** Agents on the given platforms. A strict include filter: clearing the
 *  selection shows nothing rather than quietly showing everything, which would
 *  contradict the Linux-only default. */
export const filterAgentsByPlatform = (agents: CatalogAgent[], platforms: AgentPlatform[]): CatalogAgent[] =>
  agents.filter((agent) => platforms.includes(agent.platform));

/** Which platforms actually occur in the catalog, in AGENT_PLATFORMS order. */
export const availablePlatforms = (agents: CatalogAgent[] = agentList): AgentPlatform[] =>
  AGENT_PLATFORMS.filter((platform) => agents.some((agent) => agent.platform === platform));
