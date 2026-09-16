// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * Shapes shared by the editor, the sortable item and the previews. They used
 * to be imported from a module that does not exist in this repository.
 */
import type { AgentParameter } from './agentCatalog';

export type Parameter = AgentParameter;

export interface ResourceAgent {
  name: string;
  version?: string;
  shortdesc?: string;
  longdesc?: string;
  parameters: Parameter[];
}

export interface ResourceAgentsByProvider {
  providers: Record<string, ResourceAgent[]>;
}

export interface ParamEntry {
  key: string;
  value: string;
}

export interface ParsedOcfAgent {
  original?: string;
  provider: string;
  agent_type: string;
  instance_name: string;
  params: ParamEntry[];
}

export interface OcfAgentWithMetadata {
  position: {
    section: string;
    array_index: number | null;
    key: string;
    index: number;
  };
  item: {
    original: string;
    is_ocf: boolean;
    ocf_agent: (ParsedOcfAgent & { original: string }) | null;
  };
  metadata: ResourceAgent | null;
  instanceId: number;
}
