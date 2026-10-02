// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { ocfParamString, paramsToRecord, parseOcfString, recordToParams } from './ocfString';
import type { OcfAgentWithMetadata, ParamEntry, ParsedOcfAgent } from './types';

/**
 * An entry of the `ocf_agents` field a create-mode host form carries. params
 * arrive as a record, or as the entry list this editor writes back.
 */
export interface OcfAgentFormEntry {
  type?: 'ocf' | 'mount' | 'service';
  provider?: string;
  agent_type?: string;
  instance_name?: string;
  params?: Record<string, string> | ParamEntry[];
  value?: string;
}

/** What syncToParentForm writes to the host form's `ocf_agents`. */
export interface OcfAgentFormOutput {
  name: string;
  instance_name: string;
  params: ParamEntry[];
}

export const toParamEntries = (params: OcfAgentFormEntry['params']): ParamEntry[] =>
  Array.isArray(params) ? params : recordToParams(params ?? {});

/** One agent's slice of the editor form. */
export interface AgentFormValue {
  params?: Record<string, string>;
  original?: string;
}

/** The editor form's `agents` list for the given agents. */
export function agentsToFormValues(agents: OcfAgentWithMetadata[]): AgentFormValue[] {
  return agents.map((agentWithMeta) => {
    if (agentWithMeta.item.is_ocf && agentWithMeta.item.ocf_agent) {
      return {
        params: paramsToRecord(agentWithMeta.item.ocf_agent.params || []),
        original: agentWithMeta.item.original,
      };
    } else {
      return { original: agentWithMeta.item.original };
    }
  });
}

/** Editor agents for the lines of a `start` array, numbered from 0. */
export function agentsFromStartLines(startArray: string[]): OcfAgentWithMetadata[] {
  let instanceIdCounter = 0;
  return startArray.map((line: string) => {
    const parsed = parseOcfString(line);

    if (parsed.is_ocf && parsed.provider && parsed.agent_type && parsed.instance_name) {
      const { provider, agent_type, instance_name, params } = parsed;
      const paramsList = recordToParams(params || {});

      return {
        position: { section: 'resources', array_index: null, key: 'start', index: instanceIdCounter },
        item: {
          original: line,
          is_ocf: true,
          ocf_agent: { original: line, provider, agent_type, instance_name, params: paramsList },
        },
        metadata: null,
        instanceId: instanceIdCounter++,
      };
    } else {
      return {
        position: { section: 'resources', array_index: null, key: 'start', index: instanceIdCounter },
        item: { original: line, is_ocf: false, ocf_agent: null },
        metadata: null,
        instanceId: instanceIdCounter++,
      };
    }
  });
}

/** Editor agents for a create-mode host form's `ocf_agents`, numbered from 0. */
export function agentsFromFormEntries(ocfAgents: OcfAgentFormEntry[]): OcfAgentWithMetadata[] {
  let instanceIdCounter = 0;
  return ocfAgents.map((agentData): OcfAgentWithMetadata => {
    const position = {
      section: 'resources',
      array_index: null,
      key: 'start',
      index: instanceIdCounter,
    };

    // Check if it's OCF agent or plain systemd unit
    if (agentData.type === 'ocf') {
      // OCF agent
      const { provider = '', agent_type = '', instance_name = '' } = agentData;
      // Everything downstream reads params as an entry list; a record
      // handed over as-is used to crash the first render.
      const params = toParamEntries(agentData.params);
      const original = `ocf:${provider}:${agent_type} ${instance_name}`;

      // Build param string
      const paramStr = ocfParamString(params);

      const fullOriginal = paramStr ? `${original} ${paramStr}` : original;

      return {
        position,
        item: {
          original: fullOriginal,
          is_ocf: true,
          ocf_agent: {
            original: fullOriginal,
            provider,
            agent_type,
            instance_name,
            params,
          },
        },
        metadata: null, // Will load later
        instanceId: instanceIdCounter++,
      };
    }

    // Mount unit or service
    return {
      position,
      item: {
        original: agentData.value || '',
        is_ocf: false,
        ocf_agent: null,
      },
      metadata: null,
      instanceId: instanceIdCounter++,
    };
  });
}

/**
 * The index and value of the agent an antd onValuesChange reports. antd reports
 * a changed list entry as a sparse array, or keyed by index.
 */
export function findChangedAgent(
  changedAgents: (AgentFormValue | undefined)[] | Record<string, AgentFormValue | undefined>,
): { idx: number; changedValue: AgentFormValue | null | undefined } {
  // Find which index changed
  let idx = -1;
  let changedValue = null;

  if (Array.isArray(changedAgents)) {
    // Array format: find first non-undefined element
    idx = changedAgents.findIndex((item) => item && (item.params || item.original !== undefined));
    changedValue = idx >= 0 ? changedAgents[idx] : null;
  } else {
    // Object format: find numeric key
    const changedKey = Object.keys(changedAgents).find((key) => {
      const value = changedAgents[key];
      return typeof key === 'string' && /^\d+$/.test(key) && value;
    });
    if (changedKey) {
      idx = parseInt(changedKey, 10);
      changedValue = changedAgents[idx];
    }
  }

  return { idx, changedValue };
}

/**
 * The agent with changed form params merged in: edited values keep their place,
 * new keys are appended, and `original` is regenerated to match.
 */
export function withChangedParams(
  agent: OcfAgentWithMetadata,
  ocfAgent: ParsedOcfAgent,
  changedParams: Record<string, string>,
): OcfAgentWithMetadata['item'] {
  // Merge params: convert ParamEntry[] to Record, merge, then convert back to ParamEntry[]
  const originalParamsRecord = paramsToRecord(ocfAgent.params || []);
  const mergedParamsRecord = {
    ...originalParamsRecord,
    ...changedParams,
  };

  // Convert merged Record back to ParamEntry[], preserving order from original
  // For keys that exist in original, keep their order
  // For new keys from changedValue, append them
  const mergedParams: ParamEntry[] = [];

  // First, add all original params (with potentially updated values)
  for (const entry of ocfAgent.params || []) {
    const key = entry.key;
    // Use updated value if exists, otherwise use original
    const value = mergedParamsRecord[key] ?? entry.value;
    mergedParams.push({ key, value });
    // Mark as processed
    delete mergedParamsRecord[key];
  }

  // Then add any new params from changedValue
  for (const [key, value] of Object.entries(mergedParamsRecord)) {
    mergedParams.push({ key, value: String(value) });
  }

  // Regenerate the OCF string so `original` matches the new params, and
  // build the item once so ocf_agent is never spread from a nullable field.
  const paramStr = ocfParamString(mergedParams);

  const original =
    `ocf:${ocfAgent.provider}:${ocfAgent.agent_type} ${ocfAgent.instance_name}` + (paramStr ? ` ${paramStr}` : '');

  return {
    ...agent.item,
    original,
    ocf_agent: {
      ...ocfAgent,
      params: mergedParams,
      original,
    },
  };
}
