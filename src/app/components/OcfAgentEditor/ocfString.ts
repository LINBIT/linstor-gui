// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { ParamEntry, ParsedOcfAgent } from './types';

// Helper functions to convert between ParamEntry[] and Record<string, string>
export function paramsToRecord(params: ParamEntry[]): Record<string, string> {
  const record: Record<string, string> = {};
  params.forEach(({ key, value }) => {
    record[key] = value;
  });
  return record;
}

export function recordToParams(record: Record<string, string>): ParamEntry[] {
  return Object.entries(record).map(([key, value]) => ({ key, value: String(value) }));
}

export function parseOcfString(original: string): {
  is_ocf: boolean;
  provider?: string;
  agent_type?: string;
  instance_name?: string;
  params?: Record<string, string>;
} {
  // Simple regex for ocf:provider:type instance_name params...
  const ocfRegex = /^ocf:([^:]+):(\S+)\s+(\S+)(?:\s+(.*))?$/;
  const match = original.match(ocfRegex);

  if (match) {
    const [, provider, agent_type, instance_name, paramsStr] = match;
    const params: Record<string, string> = {};

    if (paramsStr) {
      // Regex to match key=value or key='value' or key="value"
      // This regex handles:
      // 1. key=
      // 2. 'value' (single quoted)
      // 3. "value" (double quoted)
      // 4. value (unquoted)
      const paramRegex = /(\w+)=(?:'([^']*)'|"([^"]*)"|(\S+))/g;
      let paramMatch;
      while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
        const key = paramMatch[1];
        const value = paramMatch[2] ?? paramMatch[3] ?? paramMatch[4];
        if (value !== undefined) {
          params[key] = value;
        }
      }
    }

    return {
      is_ocf: true,
      provider,
      agent_type,
      instance_name,
      params,
    };
  }

  return { is_ocf: false };
}

// Helper function to generate OCF string from agent data
export function generateOcfString(agent: ParsedOcfAgent, params?: ParamEntry[]): string {
  const { provider, agent_type, instance_name } = agent;
  const finalParams = params || agent.params;

  // Build key=value pairs - order is preserved from the array
  const paramStr = finalParams
    .map(({ key, value }) => {
      if (value === undefined || value === null) return '';
      // Quote values if they contain spaces or special characters
      if (String(value).includes(' ') || String(value).includes(',') || String(value) === '') {
        return `${key}='${value}'`;
      }
      return `${key}=${value}`;
    })
    .filter(Boolean)
    .join(' ');

  return `ocf:${provider}:${agent_type} ${instance_name}${paramStr ? ` ${paramStr}` : ''}`;
}

/**
 * The key=value part of an agent's `original` line as the editor rewrites it:
 * empty values are left out, values with spaces or commas are quoted.
 */
export function ocfParamString(params: ParamEntry[]): string {
  return params
    .filter(({ value }) => value !== undefined && value !== '')
    .map(({ key, value }) => {
      if (String(value).includes(' ') || String(value).includes(',') || String(value) === '') {
        return `${key}='${value}'`;
      }
      return `${key}=${value}`;
    })
    .join(' ');
}
