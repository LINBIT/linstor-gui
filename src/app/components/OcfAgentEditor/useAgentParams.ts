// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { FormInstance } from 'antd';
import { message } from 'antd';
import type { TFunction } from 'i18next';
import type { OcfAgentWithMetadata, ParamEntry, ResourceAgentsByProvider } from './types';

/**
 * Adding and removing an agent's parameters, in the agents and in the editor
 * form. Parameters added here are remembered per agent instance.
 */
export function useAgentParams(
  parsedAgents: OcfAgentWithMetadata[],
  setParsedAgents: Dispatch<SetStateAction<OcfAgentWithMetadata[]>>,
  allAgents: ResourceAgentsByProvider,
  form: FormInstance,
  t: TFunction,
) {
  // Track manually added parameters for each agent
  // Key is a unique instance ID that never changes
  const [addedParams, setAddedParams] = useState<Map<number, Set<string>>>(new Map());

  // Remove parameter
  // stableKey parameter is the instanceId
  const handleRemoveParam = (stableKey: number, paramName: string) => {
    // Find agent by instanceId
    const arrayIndex = parsedAgents.findIndex((a) => a.instanceId === stableKey);
    if (arrayIndex === -1) return;

    const agent = parsedAgents[arrayIndex];
    if (!agent.item.ocf_agent) return;

    // Remove from params (filter out the param to remove)
    const newParams = (agent.item.ocf_agent.params || []).filter((p: ParamEntry) => p.key !== paramName);

    // Update agent
    const newAgent = {
      ...agent,
      item: {
        ...agent.item,
        ocf_agent: {
          ...agent.item.ocf_agent,
          params: newParams,
        },
      },
    };

    const newAgents = [...parsedAgents];
    newAgents[arrayIndex] = newAgent;
    setParsedAgents(newAgents);

    // Update form
    const currentValues = form.getFieldsValue();
    if (currentValues.agents?.[arrayIndex]?.params) {
      const newFormParams = { ...currentValues.agents[arrayIndex].params };
      delete newFormParams[paramName];
      form.setFieldValue(['agents', arrayIndex, 'params'], newFormParams);
    }

    // Remove from addedParams tracking
    setAddedParams((prev) => {
      const newMap = new Map(prev);
      const params = newMap.get(stableKey);
      if (params) {
        params.delete(paramName);
        if (params.size === 0) {
          newMap.delete(stableKey);
        } else {
          newMap.set(stableKey, params);
        }
      }
      return newMap;
    });

    message.success(t('common:parameter_removed', { name: paramName }));
  };

  /** Adds a parameter with its default value; true once added. */
  const addParam = (stableKey: number, selectedParam: string): boolean => {
    // Find agent by instanceId
    const arrayIndex = parsedAgents.findIndex((a) => a.instanceId === stableKey);
    if (arrayIndex === -1) return false;

    const agent = parsedAgents[arrayIndex];
    if (!agent.item.ocf_agent) return false;

    // Find metadata: use attached metadata or look it up in allAgents
    const metadata =
      agent.metadata ||
      allAgents.providers[agent.item.ocf_agent.provider]?.find((a) => a.name === agent.item.ocf_agent!.agent_type);

    if (!metadata) {
      message.error(t('common:agent_metadata_not_found'));
      return false;
    }

    // Find parameter metadata
    const paramMeta = metadata.parameters.find((p) => p.name === selectedParam);
    if (!paramMeta) return false;

    // Add to params with default value (append new param to end)
    const newParamEntry: ParamEntry = {
      key: selectedParam,
      value: paramMeta.default || '',
    };
    const newParams = [...(agent.item.ocf_agent.params || []), newParamEntry];

    // Update agent
    const newAgent = {
      ...agent,
      item: {
        ...agent.item,
        ocf_agent: {
          ...agent.item.ocf_agent,
          params: newParams,
        },
      },
    };

    const newAgents = [...parsedAgents];
    newAgents[arrayIndex] = newAgent;
    setParsedAgents(newAgents);

    // Update form
    const currentValues = form.getFieldsValue();
    const params = currentValues.agents?.[arrayIndex]?.params || {};
    form.setFieldValue(['agents', arrayIndex, 'params'], {
      ...params,
      [selectedParam]: paramMeta.default || '',
    });

    // Add to addedParams tracking using stable key
    setAddedParams((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(stableKey) || new Set();
      existing.add(selectedParam);
      newMap.set(stableKey, existing);
      return newMap;
    });

    message.success(t('common:parameter_added', { name: selectedParam }));
    return true;
  };

  return { addedParams, handleRemoveParam, addParam };
}
