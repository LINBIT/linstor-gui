import {
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import type { FormInstance } from 'antd';
import { Card, Col, Empty, Form, message, Row, Space, Typography, Tabs, Input, Select, Modal } from 'antd';
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { parse } from 'smol-toml';
import { useAllResourceDefinitions } from '@app/features/ha/useHA';
import { SortableAgentItem } from './SortableAgentItem';
import { allAgents as allAgentsData } from './all_agents';
import { AddAgentModal } from './AddAgentModal';
import { AddParameterModal } from './AddParameterModal';
import { AgentPreview } from './AgentPreview';
import { DRBDReactorConfig, DRBDReactorConfigValues } from './DRBDReactorConfig';
import { MetadataEditor } from './MetadataEditor';
import { TomlPreview } from './TomlPreview';
import { Button } from '@app/components/Button';
import { HAResourceDefinition } from '@app/features/ha/useHA';

interface Parameter {
  name: string;
  unique: boolean;
  required: boolean;
  shortdesc?: string;
  longdesc?: string;
  type: string;
  default?: string;
}

function generateReactorConfigString(config: DRBDReactorConfigValues): string {
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

function generateMetadataString(metadata: Record<string, string | number | boolean>): string {
  return Object.entries(metadata)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key} = "${value}"`;
      }
      return `${key} = ${value}`;
    })
    .join('\n');
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

function parseOcfString(original: string): {
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
  tomlContent?: string;
  hideTitle?: boolean;
  onSave?: (tomlContent: string, resourceName: string, filePath?: string) => void;
  onCancel?: () => void;

  // For create/wizard mode
  mode?: 'edit' | 'create';
  externalForm?: FormInstance; // External form for create mode
  resources?: { name: string }[]; // Available resources for create mode
  services?: string[]; // Available services for create mode
  onAgentsChange?: (agents: any[]) => void; // Callback when agents change
  onDirtyChange?: (isDirty: boolean) => void; // Callback when dirty state changes

  // Preview control
  showPreview?: boolean; // Controlled from outside
  onPreviewChange?: (show: boolean) => void; // Callback when preview toggle changes
}

export interface OcfAgentEditorRef {
  togglePreview: () => void;
  isDirty: () => boolean;
}

export const OcfAgentEditor = forwardRef<OcfAgentEditorRef, OcfAgentEditorProps>(function OcfAgentEditor(
  {
    profile,
    tomlContent,
    hideTitle,
    onSave,
    onCancel,
    mode = 'edit',
    externalForm,
    resources = [],
    services = [],
    onAgentsChange,
    onDirtyChange,
    showPreview: externalShowPreview,
    onPreviewChange,
  }: OcfAgentEditorProps,
  ref,
) {
  const currentTheme = 'light'; // Default to light theme
  const [internalForm] = Form.useForm();

  // Use external form in create mode, internal form in edit mode
  const form = externalForm || internalForm;

  // Preview visibility state (default hidden)
  const [previewVisible, setPreviewVisible] = useState(false);

  const { data: allRDData, isLoading: rdLoading } = useAllResourceDefinitions();

  const rdOptions = useMemo(() => {
    if (!allRDData?.data || !Array.isArray(allRDData.data)) return [];
    return (allRDData.data as HAResourceDefinition[])
      .filter((rd) => !Object.keys(rd.props || {}).some((key) => key.startsWith('files/etc/drbd-reactor.d/')))
      .map((rd) => ({
        label: rd.name,
        value: rd.name,
      }));
  }, [allRDData]);

  // Toggle preview visibility
  const togglePreview = useCallback(() => {
    setPreviewVisible((prev) => {
      const newValue = !prev;
      onPreviewChange?.(newValue);
      return newValue;
    });
  }, [onPreviewChange]);

  // Sync external showPreview prop
  useEffect(() => {
    if (externalShowPreview !== undefined) {
      setPreviewVisible(externalShowPreview);
    }
  }, [externalShowPreview]);

  const [saving, setSaving] = useState(false);

  // Parsed OCF agents (from start array)
  const [parsedAgents, setParsedAgents] = useState<OcfAgentWithMetadata[]>([]);
  // DRBD Reactor Config
  const [reactorConfig, setReactorConfig] = useState<DRBDReactorConfigValues>({});
  // Metadata Config
  const [metadataConfig, setMetadataConfig] = useState<Record<string, string | number | boolean>>({});

  // Initial state for dirty check
  const [initialState, setInitialState] = useState<{
    parsedAgents: any[];
    reactorConfig: any;
    metadataConfig: any;
  } | null>(null);

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
  const [addSystemdModalVisible, setAddSystemdModalVisible] = useState(false);
  const [systemdType, setSystemdType] = useState<'service' | 'mount'>('service');
  const [systemdUnitName, setSystemdUnitName] = useState('');

  // Split pane state for resizable panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [_isDragging, setIsDragging] = useState(false);
  const activeContainerRef = useRef<HTMLElement | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(50);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftPanelWidth;
    activeContainerRef.current = e.currentTarget.parentElement as HTMLElement;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle drag move
  const handleMouseMove = (e: MouseEvent) => {
    if (!activeContainerRef.current) return;

    const containerRect = activeContainerRef.current.getBoundingClientRect();
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
    activeContainerRef.current = null;
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

  // Paste TOML modal state
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pastedToml, setPastedToml] = useState('');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const isFormDirty = useMemo(() => {
    if (!initialState) return false;

    const simplifyAgents = (agents: OcfAgentWithMetadata[]) =>
      agents.map((a) => ({
        original: a.item.original,
        instanceId: a.instanceId,
      }));

    return (
      JSON.stringify(simplifyAgents(parsedAgents)) !== JSON.stringify(initialState.parsedAgents) ||
      JSON.stringify(reactorConfig) !== JSON.stringify(initialState.reactorConfig) ||
      JSON.stringify(metadataConfig) !== JSON.stringify(initialState.metadataConfig)
    );
  }, [initialState, parsedAgents, reactorConfig, metadataConfig]);

  // Sync dirty state to parent
  useEffect(() => {
    onDirtyChange?.(isFormDirty);
  }, [isFormDirty, onDirtyChange]);

  // Expose methods to parent (must be after togglePreview and isFormDirty are defined)
  useImperativeHandle(
    ref,
    () => ({
      togglePreview,
      isDirty: () => isFormDirty,
    }),
    [togglePreview, isFormDirty],
  );

  const applyTomlContent = useCallback(
    (content: string, resourceNameOverride?: string) => {
      try {
        const parsedToml = parse(content) as any;
        let startArray: string[] = [];
        let initialMetadata = {};
        let initialReactor = {};
        let finalResourceName = resourceNameOverride || profile?.name || '';

        if (Array.isArray(parsedToml.start)) {
          startArray = parsedToml.start;
        } else if (parsedToml.promoter) {
          const promoters = Array.isArray(parsedToml.promoter) ? parsedToml.promoter : [parsedToml.promoter];
          for (const p of promoters) {
            if (p.metadata) {
              initialMetadata = p.metadata;
              setMetadataConfig(p.metadata);
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

              const { start, stop, ...otherConfig } = resourceConfig;
              initialReactor = otherConfig;
              setReactorConfig(otherConfig);
              break;
            }
          }
        }

        if (mode === 'create' && finalResourceName) {
          form.setFieldValue('resource_name', finalResourceName);
          form.setFieldValue('file_path', finalResourceName);
        }

        let instanceIdCounter = 0;
        const agentsWithIds = startArray.map((line: string) => {
          const parsed = parseOcfString(line);

          if (parsed.is_ocf && parsed.provider && parsed.agent_type && parsed.instance_name) {
            const { provider, agent_type, instance_name, params } = parsed;
            const paramsList = _recordToParams(params || {});

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

        setParsedAgents(agentsWithIds);
        setNextInstanceId(instanceIdCounter);

        const initialValues = {
          agents: agentsWithIds.map((agentWithMeta) => {
            if (agentWithMeta.item.is_ocf && agentWithMeta.item.ocf_agent) {
              return {
                params: paramsToRecord(agentWithMeta.item.ocf_agent.params || []),
                original: agentWithMeta.item.original,
              };
            } else {
              return { original: agentWithMeta.item.original };
            }
          }),
        };

        form.setFieldsValue(initialValues);
        return { agentsWithIds, initialReactor, initialMetadata };
      } catch (e) {
        console.error('Failed to parse TOML content:', e);
        message.error('Failed to parse configuration content');
        return null;
      }
    },
    [form, mode, profile?.name],
  );

  const handlePasteConfirm = () => {
    if (!pastedToml) {
      setPasteModalVisible(false);
      return;
    }

    const result = applyTomlContent(pastedToml);
    if (result) {
      message.success('Configuration applied');
      setPasteModalVisible(false);
      setPastedToml('');
    }
  };

  const loadParsedAgents = useCallback(async () => {
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

        setInitialState({
          parsedAgents: agentsWithIds.map((a) => ({ original: a.item.original, instanceId: a.instanceId })),
          reactorConfig: {},
          metadataConfig: {},
        });

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
      } else {
        // Create mode with no initial agents - set empty initial state
        setParsedAgents([]);
        setNextInstanceId(0);
        setInitialState({
          parsedAgents: [],
          reactorConfig: {},
          metadataConfig: {},
        });
      }
      return;
    }

    // Edit mode - load from API
    if (!profile) return;

    if (tomlContent) {
      const result = applyTomlContent(tomlContent);
      if (result) {
        setInitialState({
          parsedAgents: result.agentsWithIds.map((a) => ({ original: a.item.original, instanceId: a.instanceId })),
          reactorConfig: result.initialReactor,
          metadataConfig: result.initialMetadata,
        });
      }
    } else {
      setParsedAgents([]);
      setNextInstanceId(0);
      setInitialState({
        parsedAgents: [],
        reactorConfig: {},
        metadataConfig: {},
      });

      setTimeout(() => {
        form.setFieldsValue({ agents: [] });
      }, 50);
    }
  }, [mode, form, profile, tomlContent, applyTomlContent]);

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
    } else if (profile?.id || tomlContent) {
      loadParsedAgents();
    }
    // We only want to run this when the source data (profile or tomlContent) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, tomlContent, mode]);

  // Sync changes to parent form in create mode
  useEffect(() => {
    if (mode === 'create') {
      syncToParentForm();
    }
  }, [syncToParentForm, mode]);

  const handleSave = async () => {
    // In create mode, just sync and call callback if not handled here
    // But we want to generate TOML now
    setSaving(true);
    try {
      // Get current form values (with fallback)
      const values = form.getFieldsValue();

      // Try to validate
      try {
        await form.validateFields();
      } catch (validationError) {
        console.warn('Form validation failed:', validationError);
        message.error('Please fix validation errors');
        setSaving(false);
        return;
      }

      const resourceName = mode === 'create' ? values.resource_name : profile?.name;
      const filePath = mode === 'create' ? `/etc/drbd-reactor.d/${values.file_path}.toml` : undefined;

      if (!resourceName) {
        message.error('Resource name is required');
        setSaving(false);
        return;
      }

      if (mode === 'create' && !filePath) {
        message.error('File path is required');
        setSaving(false);
        return;
      }

      // Generate start array items
      const agentStrings = parsedAgents.map((agentWithMeta) => {
        const item = agentWithMeta.item;
        if (item.is_ocf && item.ocf_agent) {
          const agent = item.ocf_agent;
          const params = agent.params || [];
          const result = _generateOcfString(agent, params);
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

      onSave?.(toml, resourceName, filePath);
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
    if (changedValues.resource_name && mode === 'create') {
      form.setFieldValue('file_path', changedValues.resource_name);
    }

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
          // Check if form is dirty
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
    if (!agent.item.ocf_agent) return;

    // Find metadata: use attached metadata or look it up in allAgents
    const metadata =
      agent.metadata ||
      allAgents.providers[agent.item.ocf_agent.provider]?.find((a) => a.name === agent.item.ocf_agent!.agent_type);

    if (!metadata) {
      message.error('Agent metadata not found');
      return;
    }

    // Find parameter metadata
    const paramMeta = metadata.parameters.find((p) => p.name === selectedParam);
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

  const openAddSystemdModal = () => {
    setSystemdType('service');
    setSystemdUnitName('');
    setAddSystemdModalVisible(true);
  };

  const closeAddSystemdModal = () => {
    setAddSystemdModalVisible(false);
  };

  const handleAddSystemdUnit = () => {
    const trimmedUnitName = systemdUnitName.trim();

    if (!trimmedUnitName) {
      message.error('Please enter a unit name');
      return;
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

    message.success(`Added ${systemdType} unit: ${normalizedUnitName}`);
    closeAddSystemdModal();
  };

  // Generate IDs for DnD - use instanceId for stable keys
  const items = useMemo(() => parsedAgents.map((agent) => `agent-${agent.instanceId}`), [parsedAgents]);

  const renderSplitView = (editorContent: React.ReactNode, previewContent: React.ReactNode) => (
    <div
      style={{
        display: 'flex',
        height: '100%',
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {editorContent}
      </div>

      {/* Drag Handle */}
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
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: '#bfbfbf',
                }}
              />
            ))}
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
          {previewContent}
        </div>
      )}
    </div>
  );

  if (mode === 'edit' && !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Text type="secondary">No profile selected</Text>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .ocf-agent-editor .ant-tabs-content {
            height: 100%;
          }
          .ocf-agent-editor .ant-tabs-tabpane {
            height: 100%;
          }
        `}
      </style>
      <div
        className="ocf-agent-editor sortable-list"
        style={{
          padding: '24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Tabs
          defaultActiveKey="services"
          tabBarExtraContent={
            <Space>
              <Button icon={<ImportOutlined />} onClick={() => setPasteModalVisible(true)}>
                Paste
              </Button>
              {mode === 'edit' && (
                <Button icon={<ReloadOutlined />} onClick={loadParsedAgents} disabled={!isFormDirty}>
                  Reset
                </Button>
              )}
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={saving || !isFormDirty}
                loading={saving}
              >
                Save
              </Button>
              <Button
                type={previewVisible ? 'primary' : undefined}
                icon={previewVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={togglePreview}
              >
                Preview
              </Button>
            </Space>
          }
          style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, overflow: 'hidden' }}
          items={[
            {
              key: 'services',
              label: 'Services',
              children: renderSplitView(
                <Card
                  title={
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Space>
                        <Button icon={<PlusOutlined />} onClick={openAddSystemdModal}>
                          Add Systemd/Mount
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
                          Add Resource Agent
                        </Button>
                      </Space>
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
                    {mode === 'create' && (
                      <div style={{ padding: '0 12px 12px 12px' }}>
                        <Form.Item
                          name="resource_name"
                          label="Resource Name"
                          rules={[{ required: true, message: 'Please select resource' }]}
                        >
                          <Select
                            placeholder="Select resource"
                            showSearch
                            loading={rdLoading}
                            options={rdOptions}
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                        <Form.Item
                          name="file_path"
                          label="Config File"
                          rules={[{ required: true, message: 'Please enter filename' }]}
                        >
                          <Input addonBefore="/etc/drbd-reactor.d/" addonAfter=".toml" placeholder="my-resource" />
                        </Form.Item>
                      </div>
                    )}

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
                </Card>,

                <AgentPreview parsedAgents={parsedAgents} loading={saving} currentTheme={currentTheme} />,
              ),
            },

            {
              key: 'reactor',

              label: 'DRBD Reactor Config',

              children: renderSplitView(
                <div style={{ height: '100%', overflowY: 'auto', padding: '0 12px 24px 12px' }}>
                  <DRBDReactorConfig
                    initialValues={reactorConfig}
                    onValuesChange={(values) => setReactorConfig(values)}
                  />
                </div>,

                <TomlPreview
                  content={generateReactorConfigString(reactorConfig)}
                  loading={saving}
                  currentTheme={currentTheme}
                />,
              ),
            },

            {
              key: 'metadata',

              label: 'Metadata',

              children: renderSplitView(
                <div style={{ height: '100%', overflowY: 'auto', padding: '0 12px 24px 12px' }}>
                  <MetadataEditor
                    initialValues={metadataConfig}
                    onValuesChange={(values) => setMetadataConfig(values)}
                  />
                </div>,

                <TomlPreview
                  content={generateMetadataString(metadataConfig)}
                  loading={saving}
                  currentTheme={currentTheme}
                />,
              ),
            },
          ]}
        />

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

        <Modal
          title="Add Systemd/Mount"
          open={addSystemdModalVisible}
          onCancel={closeAddSystemdModal}
          footer={[
            <Button key="cancel" onClick={closeAddSystemdModal}>
              Cancel
            </Button>,
            <Button key="add" type="primary" onClick={handleAddSystemdUnit}>
              Add
            </Button>,
          ]}
        >
          <Form layout="vertical">
            <Form.Item label="Unit Type" required>
              <Select
                value={systemdType}
                onChange={(value) => setSystemdType(value)}
                options={[
                  { label: 'Service', value: 'service' },
                  { label: 'Mount', value: 'mount' },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="Unit Name"
              required
              extra={
                systemdType === 'mount'
                  ? 'Examples: var-lib-mysql.mount or var-lib-mysql'
                  : 'Examples: mysql.service or mysql'
              }
            >
              <Input
                value={systemdUnitName}
                onChange={(e) => setSystemdUnitName(e.target.value)}
                placeholder={systemdType === 'mount' ? 'var-lib-mysql.mount' : 'mysql.service'}
                onPressEnter={handleAddSystemdUnit}
              />
            </Form.Item>
          </Form>
        </Modal>

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
          allAgents={allAgents}
        />

        {/* Paste TOML Modal */}
        <Modal
          title="Paste TOML Configuration"
          open={pasteModalVisible}
          onOk={handlePasteConfirm}
          onCancel={() => setPasteModalVisible(false)}
          width={800}
          destroyOnClose
        >
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Paste a full DRBD Reactor TOML configuration below to overwrite the current editor content.
            </Text>
          </div>
          <Input.TextArea
            rows={15}
            placeholder="[[promoter]]&#10;  [promoter.resources.my-resource]&#10;    start = [ ... ]"
            value={pastedToml}
            onChange={(e) => setPastedToml(e.target.value)}
            style={{ fontFamily: 'monospace' }}
          />
        </Modal>
      </div>
    </>
  );
});
