// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it } from 'vitest';

import { allAgents as linuxAgents } from '../all_agents';
import { windowsAgents } from '../windows_agents';
import {
  AGENT_PLATFORMS,
  CatalogAgent,
  DEFAULT_AGENT_PLATFORMS,
  agentCatalog,
  agentKey,
  agentList,
  availablePlatforms,
  filterAgentsByPlatform,
} from '../agentCatalog';

const countOf = (source: { providers: Record<string, unknown[]> }) =>
  Object.values(source.providers).reduce((total, agents) => total + agents.length, 0);

describe('agentCatalog', () => {
  it('holds both platforms in one catalog', () => {
    expect(agentList).toHaveLength(countOf(linuxAgents) + countOf(windowsAgents));
    expect(availablePlatforms()).toEqual(AGENT_PLATFORMS);
  });

  it('tags every agent with its platform and provider', () => {
    expect(agentList.every((agent) => AGENT_PLATFORMS.includes(agent.platform))).toBe(true);
    expect(agentList.every((agent) => agent.provider.length > 0)).toBe(true);

    const windows = agentList.filter((agent) => agent.platform === 'windows');
    expect(windows.map((agent) => agent.name)).toContain('windows_service');
    expect(windows.every((agent) => agent.provider === 'linbit')).toBe(true);
  });

  it('keeps provider lookup resolving to the Linux agent it resolved to before', () => {
    // An `ocf:linbit:drbd` line carries no platform, so merging the Windows
    // agents in must not change what that line resolves to.
    const linbit = agentCatalog.providers.linbit;
    const drbd = linbit.find((agent) => agent.name === 'drbd');
    expect(drbd?.platform).toBe('linux');

    // ...while the Windows-only agents are reachable under the same provider.
    expect(linbit.find((agent) => agent.name === 'windows_service')?.platform).toBe('windows');
  });

  it('groups by provider without losing anyone', () => {
    const grouped = Object.values(agentCatalog.providers).reduce((total, agents) => total + agents.length, 0);
    expect(grouped).toBe(agentList.length);
    expect(Object.keys(agentCatalog.providers).sort()).toEqual(['heartbeat', 'linbit', 'pacemaker']);
  });

  it('gives every entry a key that survives a cross-platform name clash', () => {
    const keys = agentList.map(agentKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('filterAgentsByPlatform', () => {
  const agents = [
    { name: 'a', platform: 'linux', provider: 'heartbeat', parameters: [] },
    { name: 'b', platform: 'windows', provider: 'linbit', parameters: [] },
  ] as CatalogAgent[];

  it('filters to the selected platforms', () => {
    expect(filterAgentsByPlatform(agents, ['windows']).map((a) => a.name)).toEqual(['b']);
    expect(filterAgentsByPlatform(agents, ['linux']).map((a) => a.name)).toEqual(['a']);
    expect(filterAgentsByPlatform(agents, ['linux', 'windows'])).toHaveLength(2);
  });

  it('shows nothing when no platform is selected', () => {
    // A strict include filter: the alternative -- empty meaning "everything" --
    // would contradict the Linux-only default the picker starts with.
    expect(filterAgentsByPlatform(agents, [])).toEqual([]);
  });

  it('starts on Linux only, so Windows agents are opt-in', () => {
    expect(DEFAULT_AGENT_PLATFORMS).toEqual(['linux']);
    expect(filterAgentsByPlatform(agents, DEFAULT_AGENT_PLATFORMS).map((a) => a.name)).toEqual(['a']);
  });

  it('only offers platforms that actually occur', () => {
    expect(availablePlatforms([agents[0]])).toEqual(['linux']);
    expect(availablePlatforms([])).toEqual([]);
  });
});
