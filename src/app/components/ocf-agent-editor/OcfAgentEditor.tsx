import { EyeInvisibleOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from '@dnd-kit/core';

import type { FormInstance } from 'antd';
import { Button, Card, Col, Empty, Form, message, Row, Space, Tag, Typography } from 'antd';
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableAgentItem } from './SortableAgentItem';
import { allAgents as allAgentsData } from './all_agents';
import { AddAgentModal } from './AddAgentModal';
import { AddParameterModal } from './AddParameterModal';
import { AgentPreview } from './AgentPreview';

// CSS for drag animations
const dragAnimationCss = `
  .sortable-list .sortable-agent-item {
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
    will-change: transform;
  }

  .sortable-list .sortable-agent-item--dragging {
    opacity: 0.9;
    z-index: 1000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: scale(1.02) !important;
  }

  .sortable-list .sortable-agent-item--dragging > * {
    pointer-events: none;
  }
`;

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

interface Parameter {
  name: string;
  unique: boolean;
  required: boolean;
  shortdesc?: string;
  longdesc?: string;
  type: string;
  default?: string;
}

interface ResourceAgent {
  name: string;
  version?: string;
  shortdesc?: string;
  longdesc?: string;
  parameters: Parameter[];
}

interface ResourceAgentsByProvider {
  providers: Record<string, ResourceAgent[]>;
}

interface OcfAgentWithMetadata {
  position: {
    section: string;
    array_index: number | null;
    key: string;
    index: number;
  };
  item: {
    original: string;
    is_ocf: boolean;
    ocf_agent: {
      original: string;
      provider: string;
      agent_type: string;
      instance_name: string;
      params: Array<{ key: string; value: string }>;
    } | null;
  };
  metadata: ResourceAgent | null;
  instanceId: number;
}

interface ParsedOcfAgent {
  provider: string;
  agent_type: string;
  instance_name: string;
  params: Array<{ key: string; value: string }>;
}

interface ParamEntry {
  key: string;
  value: string;
}

const { Title, Text } = Typography;

// Helper functions to convert between ParamEntry[] and Record<string, string>
function paramsToRecord(params: ParamEntry[]): Record<string, string> {
  const record: Record<string, string> = {};
  params.forEach(({ key, value }) => {
    record[key] = value;
  });
  return record;
}

function _recordToParams(record: Record<string, string>): ParamEntry[] {
  return Object.entries(record).map(([key, value]) => ({ key, value }));
}

// Helper function to generate OCF string from agent data
function _generateOcfString(agent: ParsedOcfAgent, params?: ParamEntry[]): string {
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

interface OcfAgentEditorProps {
  // For edit mode
  profile?: { name: string; id: string } | null;
  onSave?: () => void;
  onCancel?: () => void;

  // For create/wizard mode
  mode?: 'edit' | 'create';
  externalForm?: FormInstance; // External form for create mode
  resources?: { name: string }[]; // Available resources for create mode
  services?: string[]; // Available services for create mode
  onAgentsChange?: (agents: any[]) => void; // Callback when agents change

  // Preview control
  showPreview?: boolean; // Controlled from outside
  onPreviewChange?: (show: boolean) => void; // Callback when preview toggle changes
}

export interface OcfAgentEditorRef {
  togglePreview: () => void;
}

export const OcfAgentEditor = forwardRef<OcfAgentEditorRef, OcfAgentEditorProps>(function OcfAgentEditor(
  {
    profile,
    onSave,
    onCancel,
    mode = 'edit',
    externalForm,
    resources = [],
    services = [],
    onAgentsChange,
    showPreview: externalShowPreview,
    onPreviewChange,
  }: OcfAgentEditorProps,
  ref,
) {
  const currentTheme = 'light'; // Default to light theme
  const [internalForm] = Form.useForm();

  // Use external form in create mode, internal form in edit mode
  const form = externalForm || internalForm;

  // Preview visibility state (default hidden in create mode, shown in edit mode)
  const [previewVisible, setPreviewVisible] = useState(mode === 'edit');

  // Toggle preview visibility
  const togglePreview = useCallback(() => {
    setPreviewVisible((prev) => {
      const newValue = !prev;
      onPreviewChange?.(newValue);
      return newValue;
    });
  }, [onPreviewChange]);

  // Expose togglePreview to parent (must be after togglePreview is defined)
  useImperativeHandle(
    ref,
    () => ({
      togglePreview,
    }),
    [togglePreview],
  );

  // Sync external showPreview prop
  useEffect(() => {
    if (externalShowPreview !== undefined) {
      setPreviewVisible(externalShowPreview);
    }
  }, [externalShowPreview]);

  const [saving, setSaving] = useState(false);

  // Parsed OCF agents (from start array)
  const [parsedAgents, setParsedAgents] = useState<OcfAgentWithMetadata[]>([]);

  // Original TOML content and resource name
  const [_originalToml, setOriginalToml] = useState<string>('');
  const [_resourceName, setResourceName] = useState<string>('');

  // Form values for live preview
  const [, forceUpdate] = useState({});

  // All available resource agents (grouped by provider) - using local static data
  const [allAgents] = useState<ResourceAgentsByProvider>(allAgentsData);

  // Expanded agent keys
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Add agent modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  // Split pane state for resizable panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [_isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(50);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftPanelWidth;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle drag move
  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const deltaX = e.clientX - startXRef.current;
    const deltaPercent = (deltaX / containerWidth) * 100;

    let newWidth = startWidthRef.current + deltaPercent;
    newWidth = Math.max(20, Math.min(80, newWidth));

    setLeftPanelWidth(newWidth);
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Track manually added parameters for each agent
  // Key is a unique instance ID that never changes
  const [addedParams, setAddedParams] = useState<Map<number, Set<string>>>(new Map());

  // Counter for generating unique instance IDs for agents
  const [nextInstanceId, setNextInstanceId] = useState(0);

  // Add parameter modal state
  const [addParamModalVisible, setAddParamModalVisible] = useState(false);
  const [currentAgentIndex, setCurrentAgentIndex] = useState<number | null>(null);
  const [selectedParam, setSelectedParam] = useState<string>('');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const loadParsedAgents = async () => {
    // In create mode, load from form
    if (mode === 'create') {
      const ocfAgents = form.getFieldValue('ocf_agents') || [];
      if (ocfAgents.length > 0) {
        // Convert form data to parsed agents format
        let instanceIdCounter = 0;
        const agentsWithIds = ocfAgents.map((agentData: any) => {
          // Check if it's OCF agent or plain systemd unit
          if (agentData.type === 'ocf') {
            // OCF agent
            const { provider, agent_type, instance_name, params } = agentData;
            const original = `ocf:${provider}:${agent_type} ${instance_name}`;

            // Build param string
            const paramStr = Object.entries(params || {})
              .filter(([_, value]) => value !== undefined && value !== '')
              .map(([key, value]) => {
                if (String(value).includes(' ') || String(value).includes(',') || String(value) === '') {
                  return `${key}='${value}'`;
                }
                return `${key}=${value}`;
              })
              .join(' ');

            const fullOriginal = paramStr ? `${original} ${paramStr}` : original;

            return {
              position: {
                section: 'resources',
                array_index: null,
                key: 'start',
                index: instanceIdCounter,
              },
              item: {
                original: fullOriginal,
                is_ocf: true,
                ocf_agent: {
                  original: fullOriginal,
                  provider,
                  agent_type,
                  instance_name,
                  params: params || {},
                },
              },
              metadata: null, // Will load later
              instanceId: instanceIdCounter++,
            };
          } else if (agentData.type === 'mount') {
            // Mount unit
            return {
              position: {
                section: 'resources',
                array_index: null,
                key: 'start',
                index: instanceIdCounter,
              },
              item: {
                original: agentData.value || '',
                is_ocf: false,
                ocf_agent: null,
              },
              metadata: null,
              instanceId: instanceIdCounter++,
            };
          } else {
            // Service
            return {
              position: {
                section: 'resources',
                array_index: null,
                key: 'start',
                index: instanceIdCounter,
              },
              item: {
                original: agentData.value || '',
                is_ocf: false,
                ocf_agent: null,
              },
              metadata: null,
              instanceId: instanceIdCounter++,
            };
          }
        });

        setParsedAgents(agentsWithIds);
        setNextInstanceId(instanceIdCounter);

        // Initialize form with agent data
        const initialValues = {
          agents: agentsWithIds.map((agentWithMeta) => {
            if (agentWithMeta.item.is_ocf && agentWithMeta.item.ocf_agent) {
              return {
                params: paramsToRecord(agentWithMeta.item.ocf_agent.params || []),
                original: agentWithMeta.item.original,
              };
            } else {
              return {
                original: agentWithMeta.item.original,
              };
            }
          }),
        };

        setTimeout(() => {
          form.setFieldsValue(initialValues);
        }, 50);
      }
      return;
    }

    // Edit mode - load from API (not available, use local data only)
    if (!profile) return;

    // For edit mode without API, just set empty agents
    setParsedAgents([]);
    setNextInstanceId(0);

    setTimeout(() => {
      form.setFieldsValue({ agents: [] });
    }, 50);
  };

  // Sync parsedAgents back to parent form (for create mode)
  const syncToParentForm = useCallback(() => {
    if (mode === 'create' && externalForm) {
      // Convert parsedAgents back to ocf_agents format (backend expects)
      const ocfAgents = parsedAgents
        .filter((agentWithMeta: any) => agentWithMeta.item.is_ocf && agentWithMeta.item.ocf_agent)
        .map((agentWithMeta: any) => {
          const ocfAgent = agentWithMeta.item.ocf_agent;
          return {
            name: `ocf:${ocfAgent.provider}:${ocfAgent.agent_type}`,
            instance_name: ocfAgent.instance_name,
            params: ocfAgent.params || {},
          };
        });

      externalForm.setFieldValue('ocf_agents', ocfAgents);
      // Also call the callback to notify parent component
      onAgentsChange?.(ocfAgents);
    }
  }, [mode, externalForm, onAgentsChange, parsedAgents]);

  // Load TOML and parse OCF agents / Load form data
  useEffect(() => {
    if (mode === 'create') {
      loadParsedAgents();
    } else if (profile) {
      loadParsedAgents();
    }
  }, [profile, mode, loadParsedAgents]);

  // Sync changes to parent form in create mode
  useEffect(() => {
    if (mode === 'create') {
      syncToParentForm();
    }
  }, [syncToParentForm, mode]);

  const handleSave = async () => {
    // In create mode, just sync and call callback
    if (mode === 'create') {
      syncToParentForm();
      onSave?.();
      return;
    }

    // Edit mode - call API
    if (!profile) return;

    setSaving(true);
    try {
      // Get current form values (with fallback)
      let values = form.getFieldsValue();

      // Try to validate, but use current values if validation fails
      try {
        values = await form.validateFields();
      } catch (validationError) {
        console.warn('Form validation failed, using current values:', validationError);
      }

      // Check if agents array exists (optional now, since we use parsedAgents as source of truth)
      const formAgents = values.agents || [];

      // Generate the updated start array strings using parsedAgents as source of truth
      // This ensures all agents are included even if form doesn't have complete data
      const startArrayItems = parsedAgents.map((agentWithMeta: any, index: number) => {
        const item = agentWithMeta.item;
        // Get form data for this agent if available
        const agentData = formAgents[index] || {};

        if (item.is_ocf && item.ocf_agent) {
          // OCF agent - generate string from parsedAgent (source of truth)
          // Form values are used to update params if user changed them
          const formParams = agentData.params || {};
          const originalParams = paramsToRecord(item.ocf_agent.params || []);
          // Merge: form params override original params
          const mergedParams = { ...originalParams, ...formParams };
          const agent = item.ocf_agent;

          // Generate parameter string (empty if no params)
          const paramStr = Object.entries(mergedParams)
            .filter(([_, value]) => value !== undefined && value !== '')
            .map(([key, value]) => {
              if (String(value).includes(' ') || String(value).includes(',') || String(value) === '') {
                return `${key}='${value}'`;
              }
              return `${key}=${value}`;
            })
            .join(' ');

          return `ocf:${agent.provider}:${agent.agent_type} ${agent.instance_name}${paramStr ? ` ${paramStr}` : ''}`;
        } else {
          // Non-OCF item - use original from parsedAgent
          return item.original;
        }
      });

      // Save locally (API not available)
      message.success('Configuration generated (API not available)');
      console.log('Generated start array:', startArrayItems);

      onSave?.();
    } catch (err) {
      console.error('Save failed:', err);
      message.error(`Failed to save: ${(err as { message: string }).message}`);
    } finally {
      setSaving(false);
    }
  };

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
        const newFormAgents = newAgents.map((agentWithMeta) => {
          if (agentWithMeta.item.is_ocf && agentWithMeta.item.ocf_agent) {
            return {
              params: paramsToRecord(agentWithMeta.item.ocf_agent.params || []),
              original: agentWithMeta.item.original,
            };
          } else {
            return {
              original: agentWithMeta.item.original,
            };
          }
        });

        form.setFieldValue('agents', newFormAgents);
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
  const handleFormValuesChange = (changedValues: any, _allValues: any) => {
    if (changedValues.agents) {
      const changedAgents = changedValues.agents;

      // Find which index changed
      let idx = -1;
      let changedValue = null;

      if (Array.isArray(changedAgents)) {
        // Array format: find first non-undefined element
        idx = changedAgents.findIndex((item: any) => item && (item.params || item.original !== undefined));
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

      if (idx >= 0 && changedValue) {
        const agent = parsedAgents[idx];

        if (agent) {
          const newAgent = { ...agent };

          // For OCF agents with params
          if (agent.item.is_ocf && agent.item.ocf_agent && changedValue.params) {
            // Merge params: convert ParamEntry[] to Record, merge, then convert back to ParamEntry[]
            const originalParamsRecord = paramsToRecord(agent.item.ocf_agent.params || []);
            const mergedParamsRecord = {
              ...originalParamsRecord,
              ...changedValue.params,
            };

            // Convert merged Record back to ParamEntry[], preserving order from original
            // For keys that exist in original, keep their order
            // For new keys from changedValue, append them
            const _originalParamsMap = new Map(agent.item.ocf_agent.params?.map((p) => [p.key, p.value]) || []);
            const mergedParams: ParamEntry[] = [];

            // First, add all original params (with potentially updated values)
            for (const entry of agent.item.ocf_agent.params || []) {
              const key = entry.key;
              // Use updated value if exists, otherwise use original
              const value = mergedParamsRecord[key] ?? entry.value;
              mergedParams.push({ key, value });
              // Mark as processed
              delete mergedParamsRecord[key];
            }

            // Then add any new params from changedValue
            for (const [key, value] of Object.entries(mergedParamsRecord)) {
              mergedParams.push({ key, value });
            }

            // Update ocf_agent
            newAgent.item = {
              ...agent.item,
              ocf_agent: {
                ...agent.item.ocf_agent,
                params: mergedParams,
              },
            };

            // CRITICAL: Also update the 'original' field to match the new params
            // Regenerate the OCF string with updated params
            const ocfAgent = agent.item.ocf_agent;
            newAgent.item.original = `ocf:${ocfAgent.provider}:${ocfAgent.agent_type} ${ocfAgent.instance_name}`;

            // Add parameters to the original string (using mergedParamsRecord)
            const paramStr = mergedParams
              .filter(({ value }) => value !== undefined && value !== '')
              .map(({ key, value }) => {
                if (String(value).includes(' ') || String(value).includes(',') || String(value) === '') {
                  return `${key}='${value}'`;
                }
                return `${key}=${value}`;
              })
              .join(' ');

            if (paramStr) {
              newAgent.item.original += ` ${paramStr}`;
            }

            // Also update the ocf_agent.original field
            newAgent.item.ocf_agent = {
              ...newAgent.item.ocf_agent,
              original: newAgent.item.original,
            };
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
    }

    // Trigger preview update
    forceUpdate({});

    // Sync to parent form in create mode
    if (mode === 'create') {
      syncToParentForm();
    }
  };

  // Delete agent
  const deleteAgent = (index: number) => {
    const newAgents = parsedAgents.filter((_, i) => i !== index);

    // DO NOT update position.index - keep original value for stable tracking
    // No need to rebuild the array, just filter

    // Update form
    const currentValues = form.getFieldsValue();
    const newAgentsData = (currentValues.agents || []).filter((_: any, i: number) => i !== index);
    form.setFieldValue('agents', newAgentsData);

    // No need to update addedParams - it uses stable keys (position.index)
    // The deleted agent's params will be unused, but that's fine

    setParsedAgents(newAgents);
    message.success('Agent removed');
  };

  // Remove parameter
  // stableKey parameter is the instanceId
  const handleRemoveParam = (stableKey: number, paramName: string) => {
    // Find agent by instanceId
    const arrayIndex = parsedAgents.findIndex((a: any) => a.instanceId === stableKey);
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

    message.success(`Parameter ${paramName} removed`);
  };

  // Open add parameter Modal
  // stableKey parameter is the instanceId
  const handleAddParam = (stableKey: number) => {
    setCurrentAgentIndex(stableKey);
    setSelectedParam('');
    setAddParamModalVisible(true);
  };

  // Confirm add parameter
  const confirmAddParam = () => {
    if (currentAgentIndex === null || !selectedParam) {
      message.error('Please select a parameter');
      return;
    }

    const stableKey = currentAgentIndex;
    // Find agent by instanceId
    const arrayIndex = parsedAgents.findIndex((a: any) => a.instanceId === stableKey);
    if (arrayIndex === -1) return;

    const agent = parsedAgents[arrayIndex];
    if (!agent.item.ocf_agent || !agent.metadata) return;

    // Find parameter metadata
    const paramMeta = agent.metadata.parameters.find((p) => p.name === selectedParam);
    if (!paramMeta) return;

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

    message.success(`Parameter ${selectedParam} added`);
    setAddParamModalVisible(false);
    setSelectedParam('');
    setCurrentAgentIndex(null);
  };

  // Add new agent
  const handleAddAgent = () => {
    if (!selectedProvider || !selectedAgent) {
      message.error('Please select provider and agent');
      return;
    }

    // Find metadata for selected agent
    const providerAgents = allAgents?.providers[selectedProvider] || [];
    const agentMetadata = providerAgents.find((a) => a.name === selectedAgent);

    if (!agentMetadata) {
      message.error('Agent metadata not found');
      return;
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
    } as any;

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

    message.success(`Added OCF agent: ${selectedProvider}:${selectedAgent}`);
    closeAddModal();
  };

  const openAddModal = () => {
    setAddModalVisible(true);
    setSelectedProvider('');
    setSelectedAgent('');
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
  };

  // Generate IDs for DnD - use instanceId for stable keys
  const items = useMemo(() => parsedAgents.map((agent) => `agent-${agent.instanceId}`), [parsedAgents]);

  if (mode === 'edit' && !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Text type="secondary">No profile selected</Text>
      </div>
    );
  }

  return (
    <>
      <style>{dragAnimationCss}</style>
      <div
        className="ocf-agent-editor sortable-list"
        style={{
          padding: mode === 'create' ? '0' : '24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header - only show in edit mode */}
        {mode === 'edit' && (
          <div style={{ marginBottom: '24px', flexShrink: 0 }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={3} style={{ margin: 0 }}>
                  OCF Agents Editor: {profile?.name}
                </Title>
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadParsedAgents}>
                    Reload
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    disabled={saving}
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                  {onCancel && <Button onClick={onCancel}>Cancel</Button>}
                </Space>
              </Col>
            </Row>
          </div>
        )}

        {/* Stats */}
        <div style={{ marginBottom: '16px', flexShrink: 0 }}>
          <Space>
            <Text strong>Total OCF Agents:</Text>
            <Tag color="blue">{parsedAgents.length}</Tag>

            <>
              <Text strong style={{ marginLeft: '16px' }}>
                Available Providers:
              </Text>
              {Object.keys(allAgents.providers)
                .sort()
                .map((provider) => (
                  <Tag key={provider} color="green">
                    {provider}
                  </Tag>
                ))}
            </>
          </Space>
        </div>

        {/* Main Content: Split View */}
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            alignItems: 'stretch',
          }}
        >
          {/* Left Panel - Editor */}
          <div
            style={{
              flex: previewVisible ? `0 0 ${leftPanelWidth}%` : '1 1 100%',
              minWidth: previewVisible ? '20%' : 'auto',
              overflow: 'hidden',
            }}
          >
            <Card
              title={
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {mode === 'edit' && (
                      <Button
                        type="text"
                        size="small"
                        icon={previewVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        onClick={togglePreview}
                        title={previewVisible ? 'Hide preview' : 'Show preview'}
                      />
                    )}
                    <Text strong>Editor</Text>
                  </div>
                  <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAddModal}>
                    Add Agent
                  </Button>
                </div>
              }
              bordered={false}
              style={{ height: '100%', boxShadow: 'none' }}
              bodyStyle={{
                padding: '16px',
                height: 'calc(100% - 57px)',
                overflow: 'auto',
              }}
            >
              {/* Main Form */}
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                onValuesChange={handleFormValuesChange}
                initialValues={{ agents: [] }}
                component={false}
              >
                {/* OCF Agents List with Drag and Drop */}
                {parsedAgents.length === 0 ? (
                  <Empty description="No OCF agents found in start array" />
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items} strategy={verticalListSortingStrategy}>
                      {parsedAgents.map((agentWithMeta, index) => {
                        const { item } = agentWithMeta;

                        // Attempt to find metadata from allAgents (only for OCF agents)
                        const matchedMetadata =
                          item.is_ocf && item.ocf_agent ? findAgentMetadata(item.ocf_agent) : null;

                        // If backend already returned metadata, use it; otherwise use matched one
                        const metadata = agentWithMeta.metadata || matchedMetadata;
                        const isLoadingMetadata = item.is_ocf && !metadata && !allAgents;

                        // Use instanceId for stable ID
                        const id = `agent-${agentWithMeta.instanceId}`;

                        return (
                          <SortableAgentItem
                            key={id}
                            id={id}
                            index={index}
                            agentWithMeta={agentWithMeta}
                            metadata={metadata}
                            isLoadingMetadata={isLoadingMetadata}
                            currentTheme={currentTheme}
                            onDelete={deleteAgent}
                            onExpand={toggleExpand}
                            expandedKeys={expandedKeys}
                            onRemoveParam={handleRemoveParam}
                            onAddParam={handleAddParam}
                            addedParams={addedParams}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                )}
              </Form>
            </Card>
          </div>

          {/* Drag Handle - only shown when preview is visible */}
          {previewVisible && (
            <div
              onMouseDown={handleMouseDown}
              title="Drag to resize"
              style={{
                cursor: 'col-resize',
                width: 20,
                userSelect: 'none',
                flex: '0 0 auto',
                alignSelf: 'stretch',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: '#bfbfbf',
                  }}
                />
                <div
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: '#bfbfbf',
                  }}
                />
                <div
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: '#bfbfbf',
                  }}
                />
              </div>
            </div>
          )}

          {/* Right Panel - Live Preview */}
          {previewVisible && (
            <div
              style={{
                flex: `0 0 ${100 - leftPanelWidth}%`,
                minWidth: '20%',
                overflow: 'hidden',
              }}
            >
              <AgentPreview parsedAgents={parsedAgents} loading={saving} currentTheme={currentTheme} />
            </div>
          )}
        </div>

        {/* Add Agent Modal */}
        <AddAgentModal
          visible={addModalVisible}
          onOk={handleAddAgent}
          onCancel={closeAddModal}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          allAgents={allAgents}
        />

        {/* Add Parameter Modal */}
        <AddParameterModal
          visible={addParamModalVisible}
          onOk={confirmAddParam}
          onCancel={() => {
            setAddParamModalVisible(false);
            setSelectedParam('');
            setCurrentAgentIndex(null);
          }}
          currentAgentIndex={currentAgentIndex}
          selectedParam={selectedParam}
          onParamChange={setSelectedParam}
          parsedAgents={parsedAgents}
        />
      </div>
    </>
  );
});
