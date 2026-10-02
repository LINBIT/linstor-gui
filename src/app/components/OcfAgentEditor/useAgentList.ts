// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { FormInstance } from 'antd';
import { message } from 'antd';
import type { TFunction } from 'i18next';
import { agentCatalog } from './agentCatalog';
import { agentsToFormValues, findChangedAgent, withChangedParams, type AgentFormValue } from './agentForm';
import type { OcfAgentWithMetadata, ParamEntry, ParsedOcfAgent, ResourceAgentsByProvider } from './types';

/**
 * The agents of the `start` array being edited, and every change to them. Each
 * change updates both the agents and the editor form's `agents` list.
 */
export function useAgentList(form: FormInstance, t: TFunction) {
  // Parsed OCF agents (from start array)
  const [parsedAgents, setParsedAgents] = useState<OcfAgentWithMetadata[]>([]);

  // All available resource agents, Linux and Windows, from the local catalog.
  // Grouped by provider for metadata lookup; the picker gets the flat list so
  // it can filter by platform.
  const [allAgents] = useState<ResourceAgentsByProvider>(agentCatalog);

  // Expanded agent keys
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Counter for generating unique instance IDs for agents
  const [nextInstanceId, setNextInstanceId] = useState(0);

  // Find matching metadata based on parsed agent
  const findAgentMetadata = (agent: ParsedOcfAgent) => {
    if (!allAgents) return null;

    const providerAgents = allAgents.providers[agent.provider];
    if (!providerAgents) return null;

    return providerAgents.find((a) => a.name === agent.agent_type) || null;
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find indices based on instanceId in the ID string
      const oldIndex = parsedAgents.findIndex((a) => `agent-${a.instanceId}` === active.id);
      const newIndex = parsedAgents.findIndex((a) => `agent-${a.instanceId}` === over.id);

      if (oldIndex >= 0 && newIndex >= 0) {
        // Move parsedAgents array - this has the latest data from handleFormValuesChange
        const newAgents = arrayMove(parsedAgents, oldIndex, newIndex);
        setParsedAgents(newAgents);

        // Rebuild form data from parsedAgents to ensure consistency
        // Don't rely on form.getFieldsValue() as it may be incomplete when panels are collapsed
        form.setFieldValue('agents', agentsToFormValues(newAgents));
      }
    }
  };

  // Toggle expand state
  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedKeys);

    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }

    setExpandedKeys(newExpanded);
  };

  // Sync form changes to parsedAgents immediately
  const applyAgentValuesChange = (
    changedAgents: (AgentFormValue | undefined)[] | Record<string, AgentFormValue | undefined>,
  ) => {
    const { idx, changedValue } = findChangedAgent(changedAgents);

    if (idx >= 0 && changedValue) {
      const agent = parsedAgents[idx];

      if (agent) {
        const newAgent = { ...agent };

        // For OCF agents with params
        if (agent.item.is_ocf && agent.item.ocf_agent && changedValue.params) {
          newAgent.item = withChangedParams(agent, agent.item.ocf_agent, changedValue.params);
        }
        // For systemd units
        else if (!agent.item.is_ocf && changedValue.original !== undefined) {
          newAgent.item = {
            ...agent.item,
            original: changedValue.original,
          };
        }

        // Only update the specific agent that changed
        const newAgents = [...parsedAgents];
        newAgents[idx] = newAgent;
        setParsedAgents(newAgents);
      }
    }
  };

  // Delete agent
  const deleteAgent = (index: number) => {
    const newAgents = parsedAgents.filter((_, i) => i !== index);

    // DO NOT update position.index - keep original value for stable tracking
    // No need to rebuild the array, just filter

    // Update form
    const currentValues = form.getFieldsValue();
    const newAgentsData = (currentValues.agents || []).filter((_: unknown, i: number) => i !== index);
    form.setFieldValue('agents', newAgentsData);

    // No need to update addedParams - it uses stable keys (position.index)
    // The deleted agent's params will be unused, but that's fine

    setParsedAgents(newAgents);
    message.success(t('common:agent_removed'));
  };

  /** Adds a resource agent with its required parameters; true once added. */
  const addAgent = (selectedProvider: string, selectedAgent: string): boolean => {
    if (!selectedProvider || !selectedAgent) {
      message.error(t('common:please_select_provider_and_agent'));
      return false;
    }

    // Find metadata for selected agent
    const providerAgents = allAgents?.providers[selectedProvider] || [];
    const agentMetadata = providerAgents.find((a) => a.name === selectedAgent);

    if (!agentMetadata) {
      message.error(t('common:agent_metadata_not_found'));
      return false;
    }

    // Generate default params from metadata
    const defaultParamsList: ParamEntry[] = [];
    const defaultParamsRecord: Record<string, string> = {};

    agentMetadata.parameters.forEach((param) => {
      // Only include required params
      if (param.required) {
        const value = param.default || '';
        defaultParamsList.push({ key: param.name, value });
        defaultParamsRecord[param.name] = value;
      }
    });

    const instanceName = `${selectedAgent}_new`;

    // Use nextInstanceId as the unique instance ID
    const instanceId = nextInstanceId;

    const newAgent: OcfAgentWithMetadata = {
      position: {
        section: 'resources',
        array_index: null,
        key: 'start',
        index: parsedAgents.length,
      },
      item: {
        original: `ocf:${selectedProvider}:${selectedAgent} ${instanceName}`,
        is_ocf: true,
        ocf_agent: {
          original: `ocf:${selectedProvider}:${selectedAgent} ${instanceName}`,
          provider: selectedProvider,
          agent_type: selectedAgent,
          instance_name: instanceName,
          params: defaultParamsList,
        },
      },
      metadata: agentMetadata,
      instanceId,
    };

    const newAgents = [...parsedAgents, newAgent];
    setParsedAgents(newAgents);

    // Auto-expand the newly added agent
    const newAgentKey = `agent-${instanceId}`;
    setExpandedKeys((prev) => new Set([...prev, newAgentKey]));

    // Increment instance ID counter for next agent
    setNextInstanceId(nextInstanceId + 1);

    // Update form
    const currentValues = form.getFieldsValue();
    const agents = currentValues.agents || [];
    form.setFieldValue('agents', [
      ...agents,
      {
        original: `ocf:${selectedProvider}:${selectedAgent} ${instanceName}`,
        params: defaultParamsRecord,
      },
    ]);

    message.success(t('common:added_ocf_agent', { agent: `${selectedProvider}:${selectedAgent}` }));
    return true;
  };

  /** Adds a systemd service or mount unit, suffixing the name if needed; true once added. */
  const addSystemdUnit = (systemdType: 'service' | 'mount', systemdUnitName: string): boolean => {
    const trimmedUnitName = systemdUnitName.trim();

    if (!trimmedUnitName) {
      message.error(t('common:please_enter_unit_name'));
      return false;
    }

    const expectedSuffix = systemdType === 'mount' ? '.mount' : '.service';
    const normalizedUnitName = trimmedUnitName.endsWith(expectedSuffix)
      ? trimmedUnitName
      : `${trimmedUnitName}${expectedSuffix}`;

    const instanceId = nextInstanceId;
    const newAgent: OcfAgentWithMetadata = {
      position: {
        section: 'resources',
        array_index: null,
        key: 'start',
        index: parsedAgents.length,
      },
      item: {
        original: normalizedUnitName,
        is_ocf: false,
        ocf_agent: null,
      },
      metadata: null,
      instanceId,
    };

    const newAgents = [...parsedAgents, newAgent];
    setParsedAgents(newAgents);
    setNextInstanceId(nextInstanceId + 1);

    const newAgentKey = `agent-${instanceId}`;
    setExpandedKeys((prev) => new Set([...prev, newAgentKey]));

    const currentValues = form.getFieldsValue();
    const agents = currentValues.agents || [];
    form.setFieldValue('agents', [
      ...agents,
      {
        original: normalizedUnitName,
      },
    ]);

    message.success(
      t(systemdType === 'mount' ? 'common:added_mount_unit' : 'common:added_service_unit', {
        name: normalizedUnitName,
      }),
    );
    return true;
  };

  return {
    parsedAgents,
    setParsedAgents,
    setNextInstanceId,
    allAgents,
    expandedKeys,
    findAgentMetadata,
    handleDragEnd,
    toggleExpand,
    applyAgentValuesChange,
    deleteAgent,
    addAgent,
    addSystemdUnit,
  };
}
