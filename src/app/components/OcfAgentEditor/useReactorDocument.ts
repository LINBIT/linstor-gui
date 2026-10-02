// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { FormInstance } from 'antd';
import { message } from 'antd';
import type { TFunction } from 'i18next';
import { logger } from '@app/utils/logger';
import type { DRBDReactorConfigValues } from './DRBDReactorConfig';
import {
  agentsFromFormEntries,
  agentsFromStartLines,
  agentsToFormValues,
  type OcfAgentFormEntry,
  type OcfAgentFormOutput,
} from './agentForm';
import { buildReactorToml, readReactorToml } from './reactorToml';
import type { OcfAgentWithMetadata } from './types';

interface ReactorDocumentOptions {
  mode: 'edit' | 'create';
  profile?: { name: string; id: string } | null;
  tomlContent?: string;
  form: FormInstance;
  externalForm?: FormInstance;
  onSave?: (tomlContent: string, resourceName: string, filePath?: string) => void;
  onAgentsChange?: (agents: OcfAgentFormOutput[]) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  parsedAgents: OcfAgentWithMetadata[];
  setParsedAgents: Dispatch<SetStateAction<OcfAgentWithMetadata[]>>;
  setNextInstanceId: Dispatch<SetStateAction<number>>;
  t: TFunction;
}

/**
 * The reactor file around the agents: loading it (from the profile's TOML, a
 * pasted one, or a create-mode host form), the reactor settings and metadata,
 * whether anything changed since loading, and saving it back as TOML.
 */
export function useReactorDocument({
  mode,
  profile,
  tomlContent,
  form,
  externalForm,
  onSave,
  onAgentsChange,
  onDirtyChange,
  parsedAgents,
  setParsedAgents,
  setNextInstanceId,
  t,
}: ReactorDocumentOptions) {
  const [saving, setSaving] = useState(false);

  // DRBD Reactor Config
  const [reactorConfig, setReactorConfig] = useState<DRBDReactorConfigValues>({});
  // Metadata Config
  const [metadataConfig, setMetadataConfig] = useState<Record<string, string | number | boolean>>({});

  // Initial state for dirty check
  const [initialState, setInitialState] = useState<{
    parsedAgents: { original: string; instanceId: number }[];
    reactorConfig: DRBDReactorConfigValues;
    metadataConfig: Record<string, string | number | boolean>;
  } | null>(null);

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

  const applyTomlContent = useCallback(
    (content: string, resourceNameOverride?: string) => {
      try {
        const {
          startArray,
          resourceName: finalResourceName,
          metadata,
          reactor,
        } = readReactorToml(content, resourceNameOverride || profile?.name || '');
        if (metadata) setMetadataConfig(metadata);
        if (reactor) setReactorConfig(reactor);

        if (mode === 'create' && finalResourceName) {
          form.setFieldValue('resource_name', finalResourceName);
          form.setFieldValue('file_path', finalResourceName);
        }

        const agentsWithIds = agentsFromStartLines(startArray);

        setParsedAgents(agentsWithIds);
        setNextInstanceId(agentsWithIds.length);

        form.setFieldsValue({ agents: agentsToFormValues(agentsWithIds) });
        return { agentsWithIds, initialReactor: reactor ?? {}, initialMetadata: metadata ?? {} };
      } catch (e) {
        logger.error('Failed to parse TOML content:', e);
        message.error(t('common:failed_to_parse_configuration'));
        return null;
      }
    },
    [form, mode, profile?.name, t, setParsedAgents, setNextInstanceId],
  );

  const loadParsedAgents = useCallback(async () => {
    // In create mode, load from form
    if (mode === 'create') {
      const ocfAgents: OcfAgentFormEntry[] = form.getFieldValue('ocf_agents') || [];
      if (ocfAgents.length > 0) {
        // Convert form data to parsed agents format
        const agentsWithIds = agentsFromFormEntries(ocfAgents);

        setParsedAgents(agentsWithIds);
        setNextInstanceId(agentsWithIds.length);

        setInitialState({
          parsedAgents: agentsWithIds.map((a) => ({ original: a.item.original, instanceId: a.instanceId })),
          reactorConfig: {},
          metadataConfig: {},
        });

        // Initialize form with agent data
        const initialValues = { agents: agentsToFormValues(agentsWithIds) };

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
  }, [mode, form, profile, tomlContent, applyTomlContent, setParsedAgents, setNextInstanceId]);

  // Sync parsedAgents back to parent form (for create mode)
  const syncToParentForm = useCallback(() => {
    if (mode === 'create' && externalForm) {
      // Convert parsedAgents back to ocf_agents format (backend expects)
      const ocfAgents = parsedAgents
        .filter((agentWithMeta) => agentWithMeta.item.is_ocf && agentWithMeta.item.ocf_agent)
        .map((agentWithMeta): OcfAgentFormOutput => {
          const ocfAgent = agentWithMeta.item.ocf_agent!;
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
        logger.warn('Form validation failed:', validationError);
        message.error(t('common:please_fix_validation_errors'));
        setSaving(false);
        return;
      }

      const resourceName = mode === 'create' ? values.resource_name : profile?.name;
      const filePath = mode === 'create' ? `/etc/drbd-reactor.d/${values.file_path}.toml` : undefined;

      if (!resourceName) {
        message.error(t('common:resource_name_required'));
        setSaving(false);
        return;
      }

      if (mode === 'create' && !filePath) {
        message.error(t('common:file_path_required'));
        setSaving(false);
        return;
      }

      const toml = buildReactorToml({ agents: parsedAgents, metadataConfig, reactorConfig, resourceName });

      onSave?.(toml, resourceName, filePath);
    } catch (err) {
      logger.error('Save failed:', err);
      message.error(t('common:failed_to_save', { message: (err as { message: string }).message }));
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    reactorConfig,
    setReactorConfig,
    metadataConfig,
    setMetadataConfig,
    isFormDirty,
    applyTomlContent,
    loadParsedAgents,
    syncToParentForm,
    handleSave,
  };
}
