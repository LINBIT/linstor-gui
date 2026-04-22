// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Modal, Select, Typography, Space, Dropdown, MenuProps, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, MoreOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';

import {
  useHA,
  useFileContent,
  useResources,
  useDrbdReactorStatus,
  useEvictDrbdReactor,
  useDeleteHA,
  useUnmanageHA,
  useManageHA,
  useAllResourceDefinitions,
  useLinstorFiles,
  useDisableDrbdReactor,
  useEnableDrbdReactor,
} from './useHA';
import { Link } from '@app/components/Link';
import { Button } from '@app/components/Button';
import { LiaToolsSolid } from 'react-icons/lia';
import { useNodes } from '@app/features/node/hooks/useNode';
import { getEvictOutcome } from './evict';
import type { DrbdReactorStatus } from './api';

const { Text } = Typography;

interface HARecord {
  name: string;
  uuid: string;
  props?: Record<string, string>;
  layer_data?: Array<{
    type: string;
    data?: Record<string, unknown>;
  }>;
  resource_group_name?: string;
  volume_definitions?: Array<{
    volume_number: number;
    size_kib: number;
    props?: Record<string, string>;
    uuid: string;
    layer_data?: Array<{
      type: string;
      data?: Record<string, unknown>;
    }>;
  }>;
}

const decodeExecText = (text?: string | null): string => {
  if (!text) return '';
  return text;
};

type PromoterEntry = NonNullable<DrbdReactorStatus['promoter']>[number];

const getServiceStatusColor = (status?: string) => {
  if (status === 'active' || status === 'running') {
    return '#52c41a';
  }

  if (status === 'failed') {
    return '#ff4d4f';
  }

  return '#999';
};

const renderPromoterTree = (
  promoter: PromoterEntry,
  resourceName: string,
  activeNodeLabel: string,
  titleNodeLabel?: string,
) => {
  const symbol = promoter.status === 'active' ? '●' : '○';
  const symbolColor = getServiceStatusColor(promoter.status);
  const dependencies = promoter.dependencies ?? [];

  return (
    <div
      style={{
        fontSize: 12,
        minWidth: 520,
        overflowX: 'auto',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontFamily: 'inherit', marginBottom: 4 }}>
        Promoter: Resource {resourceName} currently {promoter.status} on {titleNodeLabel ?? activeNodeLabel}
      </div>
      {promoter.target ? (
        <div style={{ fontFamily: 'inherit' }}>
          <span style={{ color: symbolColor }}>{symbol}</span> {promoter.target.name}{' '}
          <span style={{ color: getServiceStatusColor(promoter.target.status) }}>({promoter.target.status})</span>
        </div>
      ) : null}
      {dependencies.map((dep, index) => {
        const branch = index === dependencies.length - 1 ? '└─' : '├─';

        return (
          <div key={dep.name} style={{ fontFamily: 'inherit', paddingLeft: 14 }}>
            <span style={{ color: symbolColor }}>{symbol}</span> {branch} {dep.name}{' '}
            <span style={{ color: getServiceStatusColor(dep.status) }}>({dep.status})</span>
          </div>
        );
      })}
    </div>
  );
};

const syncEvictedResourceInStatus = (
  status: Record<string, DrbdReactorStatus> | undefined,
  resourceName: string,
  activeNode: string,
): Record<string, DrbdReactorStatus> | undefined => {
  if (!status) {
    return status;
  }

  let changed = false;
  const nextStatus = Object.fromEntries(
    Object.entries(status).map(([nodeName, nodeStatus]) => {
      const promoter = nodeStatus.promoter;
      if (!promoter?.some((item) => item.drbd_resource === resourceName)) {
        return [nodeName, nodeStatus];
      }

      changed = true;
      return [
        nodeName,
        {
          ...nodeStatus,
          promoter: promoter.map((item) =>
            item.drbd_resource === resourceName
              ? {
                  ...item,
                  primary_on: activeNode,
                  status: nodeName === activeNode ? 'active' : 'inactive',
                  target: item.target
                    ? {
                        ...item.target,
                        status: nodeName === activeNode ? 'active' : 'inactive',
                      }
                    : item.target,
                }
              : item,
          ),
        },
      ];
    }),
  ) as Record<string, DrbdReactorStatus>;

  return changed ? nextStatus : status;
};

const isResourceActiveInStatus = (
  status: Record<string, DrbdReactorStatus> | undefined,
  resourceName: string,
): boolean => {
  if (!status) {
    return false;
  }

  return Object.values(status).some((nodeStatus) =>
    nodeStatus.promoter?.some((promoter) => promoter.drbd_resource === resourceName && promoter.status === 'active'),
  );
};

interface FileContentModalProps {
  filePath: string;
  visible: boolean;
  onClose: () => void;
}

interface ResourceNodesProps {
  resourceName: string;
  reactorStatus?: Record<string, { promoter?: Array<{ drbd_resource: string; primary_on: string; status: string }> }>;
}

const ResourceNodes: React.FC<ResourceNodesProps> = ({ resourceName, reactorStatus }) => {
  const { data: resourcesView, isLoading } = useResources(resourceName);

  if (isLoading) {
    return <LoadingOutlined spin style={{ color: 'rgba(0, 0, 0, 0.45)' }} />;
  }

  const resourceNodes =
    (resourcesView?.data as Array<{
      name: string;
      node_name: string;
      state?: { in_use?: boolean };
    }>) || [];

  if (resourceNodes.length === 0) {
    return <span>-</span>;
  }

  // Find primary node from reactor status
  let primaryNodeFromReactor: string | null = null;
  if (reactorStatus) {
    for (const nodeStatus of Object.values(reactorStatus)) {
      const promoter = nodeStatus.promoter?.find((p) => p.drbd_resource === resourceName);
      if (promoter && promoter.status === 'active') {
        primaryNodeFromReactor = promoter.primary_on;
        break;
      }
    }
  }

  return (
    <Space size="small" wrap>
      {resourceNodes.map((resourceObj) => {
        // Once DRBD Reactor status is available, treat it as the source of truth.
        // Falling back to resources-view in_use after HA actions keeps showing stale primary nodes.
        const isPrimary =
          reactorStatus !== undefined
            ? resourceObj.node_name === primaryNodeFromReactor
            : !!resourceObj.state && resourceObj.state.in_use === true;

        // Find this node's promoter info from reactor status
        const nodePromoter = reactorStatus
          ? Object.entries(reactorStatus)
              .flatMap(([nodeName, nodeStatus]) =>
                (nodeStatus.promoter ?? [])
                  .filter((p) => p.drbd_resource === resourceName)
                  .map((p) => ({ nodeName, promoter: p })),
              )
              .find((item) => item.nodeName === resourceObj.node_name)
          : null;

        const nodeTooltipContent = nodePromoter
          ? renderPromoterTree(
              nodePromoter.promoter as PromoterEntry,
              resourceName,
              `node '${nodePromoter.promoter.primary_on}'`,
              nodePromoter.promoter.primary_on === nodePromoter.nodeName
                ? 'this node'
                : `node '${nodePromoter.nodeName}'`,
            )
          : null;

        const tag = (
          <Tag color={isPrimary ? 'success' : 'default'} key={resourceObj.node_name}>
            <Link to={`/inventory/nodes/${resourceObj.node_name}`}>{resourceObj.node_name}</Link>
          </Tag>
        );

        return (
          <Tooltip
            title={nodeTooltipContent}
            key={resourceObj.node_name}
            overlayStyle={{ maxWidth: 'none' }}
            overlayInnerStyle={{ width: 'max-content', maxWidth: 'none', padding: 12 }}
          >
            {tag}
          </Tooltip>
        );
      })}
    </Space>
  );
};

const FileContentModal: React.FC<FileContentModalProps> = ({ filePath, visible, onClose }) => {
  const { t } = useTranslation(['ha', 'common']);
  const { data: fileContent, isLoading: contentLoading } = useFileContent(filePath);

  const content = (fileContent?.data as unknown as { path?: string; content?: string })?.content;

  let decodedContent = '';
  if (content) {
    try {
      decodedContent = atob(content);
    } catch {
      decodedContent = content;
    }
  }

  return (
    <Modal
      title={filePath.replace('files/', '/')}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common:close')}
        </Button>,
      ]}
      width={800}
      styles={{ body: { maxHeight: '70vh', overflow: 'auto', padding: '16px' } }}
    >
      {contentLoading ? (
        <Text type="secondary">{t('common:loading')}</Text>
      ) : decodedContent ? (
        <pre
          style={{
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 4,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {decodedContent}
        </pre>
      ) : (
        <Text type="secondary">-</Text>
      )}
    </Modal>
  );
};

export const List = () => {
  const { t } = useTranslation(['ha', 'common']);
  const { data, isLoading } = useHA();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get all nodes for reactor status query
  const { data: nodesData } = useNodes();
  const nodeNames = useMemo(() => {
    if (!nodesData) return [];
    return nodesData.map((n) => n.name);
  }, [nodesData]);

  // When non-null, an evict is in flight: track which resource and which node it was evicted from.
  const [evictingResource, setEvictingResource] = useState<{ resourceName: string; fromNode: string } | null>(null);
  const [evictStartedAt, setEvictStartedAt] = useState<number | null>(null);
  const [stoppingResource, setStoppingResource] = useState<string | null>(null);
  const [stopStartedAt, setStopStartedAt] = useState<number | null>(null);

  // Fetch reactor status once for the page, then temporarily switch to polling while an evict is in flight.
  const {
    data: reactorStatus,
    isLoading: reactorStatusLoading,
    dataUpdatedAt: reactorStatusUpdatedAt,
    refetch: refetchReactorStatus,
  } = useDrbdReactorStatus(nodeNames, nodeNames.length > 0, evictingResource || stoppingResource ? 5000 : false);

  // Evict mutation
  const evictMutation = useEvictDrbdReactor();

  // Delete / Unmanage mutations
  const deleteMutation = useDeleteHA();
  const unmanageMutation = useUnmanageHA();

  // Manage mutation
  const manageMutation = useManageHA();

  // Disable/Enable mutations
  const disableMutation = useDisableDrbdReactor();
  const enableMutation = useEnableDrbdReactor();

  // Detect evict completion once the source node no longer reports the resource as active.
  useEffect(() => {
    if (!evictingResource || !reactorStatus) return;
    if (evictStartedAt !== null && reactorStatusUpdatedAt <= evictStartedAt) return;

    const { resourceName } = evictingResource;
    const outcome = getEvictOutcome(reactorStatus, evictingResource);
    if (outcome.status === 'waiting') return;

    message.destroy('evict-in-progress');
    message.success(
      outcome.status === 'migrated'
        ? `"${resourceName}" migrated to ${outcome.newNode}`
        : `"${resourceName}" evicted successfully`,
    );
    setEvictingResource(null);
    setEvictStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    queryClient.invalidateQueries({ queryKey: ['resources-view'] });
    queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
  }, [queryClient, reactorStatus, reactorStatusUpdatedAt, evictStartedAt, evictingResource]);

  useEffect(() => {
    if (!stoppingResource || !reactorStatus) return;
    if (stopStartedAt !== null && reactorStatusUpdatedAt <= stopStartedAt) return;
    if (isResourceActiveInStatus(reactorStatus, stoppingResource)) return;

    message.destroy('stop-in-progress');
    message.success(`"${stoppingResource}" stopped successfully`);
    setStoppingResource(null);
    setStopStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    queryClient.invalidateQueries({ queryKey: ['resources-view'] });
    queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
  }, [queryClient, reactorStatus, reactorStatusUpdatedAt, stopStartedAt, stoppingResource]);

  const [startingResource, setStartingResource] = useState<string | null>(null);
  const [startStartedAt, setStartStartedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!startingResource || !reactorStatus) return;
    if (startStartedAt !== null && reactorStatusUpdatedAt <= startStartedAt) return;
    if (!isResourceActiveInStatus(reactorStatus, startingResource)) return;

    message.destroy('start-in-progress');
    message.success(`"${startingResource}" started successfully`);
    setStartingResource(null);
    setStartStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    queryClient.invalidateQueries({ queryKey: ['resources-view'] });
    queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
  }, [queryClient, reactorStatus, reactorStatusUpdatedAt, startStartedAt, startingResource]);

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewFilePath, setViewFilePath] = useState('');

  // Manage modal state
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [manageFile, setManageFile] = useState<string | undefined>();
  const [manageResource, setManageResource] = useState<string | undefined>();

  const { data: allRDData } = useAllResourceDefinitions();
  const { data: filesData } = useLinstorFiles();

  const openViewModal = (filePath: string) => {
    setViewFilePath(filePath);
    setViewModalVisible(true);
  };

  // Get the node that is actively running the resource (status === 'active').
  // We key on the map entry (node name) rather than the promoter.primary_on field
  // because primary_on reflects the DRBD-level primary, which may still be set
  // even when the DRBD Reactor service stack has failed/gone inactive — sending
  // evict to such a node would result in a 500 from the backend.
  const getPrimaryNode = (resourceName: string): string | null => {
    if (!reactorStatus) {
      return null;
    }
    for (const [nodeName, nodeStatus] of Object.entries(reactorStatus)) {
      const activePromoter = nodeStatus.promoter?.find(
        (p) => p.drbd_resource === resourceName && p.status === 'active',
      );
      if (activePromoter) {
        return nodeName;
      }
    }
    return null;
  };

  /**
   * Extract the drbd-reactorctl config name from the resource's LINSTOR props.
   * The prop key has the form "files/etc/drbd-reactor.d/<config>.toml".
   * drbd-reactorctl evict takes the config name (without path or extension).
   */
  const getConfigName = (record: HARecord): string | null => {
    if (!record.props) return null;
    const key = Object.keys(record.props).find((k) => k.startsWith('files/etc/drbd-reactor.d/'));
    if (!key) return null;
    // key = "files/etc/drbd-reactor.d/mysql_config.toml"
    const filename = key.split('/').pop() ?? '';
    return filename.replace(/\.toml$/, '') || null;
  };

  /**
   * Check if a resource is currently active (running on any node).
   */
  const isResourceActive = (resourceName: string): boolean => {
    return isResourceActiveInStatus(reactorStatus, resourceName);
  };

  /**
   * Get all nodes where the resource is present (either active or inactive).
   */
  const getResourceNodes = (resourceName: string): string[] => {
    if (!reactorStatus) return [];
    const nodes: string[] = [];
    for (const [nodeName, nodeStatus] of Object.entries(reactorStatus)) {
      const promoter = nodeStatus.promoter?.find((p) => p.drbd_resource === resourceName);
      if (promoter) {
        nodes.push(nodeName);
      }
    }
    return nodes;
  };

  /**
   * Handle stop: disable on non-active nodes first, then disable --now on active node.
   */
  const handleStop = async (record: HARecord) => {
    const configName = getConfigName(record);
    if (!configName) {
      message.warning(`Resource "${record.name}" has no DRBD Reactor configuration file — stop is not possible.`);
      return;
    }

    const activeNode = getPrimaryNode(record.name);
    const allNodes = getResourceNodes(record.name);

    if (allNodes.length === 0) {
      message.warning(`Resource "${record.name}" is not present on any node.`);
      return;
    }

    const nonActiveNodes = allNodes.filter((n) => n !== activeNode);

    message.loading({ content: `Stopping "${record.name}"...`, key: 'stop-in-progress', duration: 0 });

    try {
      // Step 1: Disable on all non-active nodes first
      if (nonActiveNodes.length > 0) {
        await disableMutation.mutateAsync({ nodes: nonActiveNodes, config: configName });
      }

      // Step 2: Disable --now on the active node
      if (activeNode) {
        await disableMutation.mutateAsync({ nodes: [activeNode], config: configName, now: true });
      }

      message.loading({
        content: `Stopping "${record.name}", waiting for DRBD Reactor status…`,
        key: 'stop-in-progress',
        duration: 0,
      });
      const startedAt = Date.now();
      setStopStartedAt(startedAt);
      setStoppingResource(record.name);
      void refetchReactorStatus();
    } catch (err) {
      setStoppingResource(null);
      setStopStartedAt(null);
      message.destroy('stop-in-progress');
      message.error(`Failed to stop "${record.name}": ${err}`);
    }
  };

  /**
   * Handle start: enable on all nodes.
   */
  const handleStart = async (record: HARecord) => {
    const configName = getConfigName(record);
    if (!configName) {
      message.warning(`Resource "${record.name}" has no DRBD Reactor configuration file — start is not possible.`);
      return;
    }

    // When stopped, DRBD Reactor doesn't report the resource, so fall back to all cluster nodes
    const allNodes = getResourceNodes(record.name);
    const targetNodes = allNodes.length > 0 ? allNodes : nodeNames;

    if (targetNodes.length === 0) {
      message.warning(`No nodes available to start "${record.name}".`);
      return;
    }

    message.loading({ content: `Starting "${record.name}"...`, key: 'start-in-progress', duration: 0 });

    try {
      await enableMutation.mutateAsync({ nodes: targetNodes, config: configName });
      message.loading({
        content: `Starting "${record.name}", waiting for DRBD Reactor status…`,
        key: 'start-in-progress',
        duration: 0,
      });
      const startedAt = Date.now();
      setStartStartedAt(startedAt);
      setStartingResource(record.name);
      void refetchReactorStatus();
    } catch (err) {
      message.destroy('start-in-progress');
      message.error(`Failed to start "${record.name}": ${err}`);
    }
  };

  const handleEvict = (record: HARecord) => {
    const primaryNode = getPrimaryNode(record.name);

    if (!primaryNode) {
      message.warning(`Resource "${record.name}" has no active node — evict is not possible in this state.`);
      return;
    }

    const configName = getConfigName(record);
    if (!configName) {
      message.warning(`Resource "${record.name}" has no DRBD Reactor configuration file — evict is not possible.`);
      return;
    }

    message.loading({
      content: `Evicting "${record.name}" from ${primaryNode}, waiting for completion…`,
      key: 'evict-in-progress',
      duration: 0,
    });

    evictMutation.mutate(
      { nodes: [primaryNode], resource: configName, wait: true },
      {
        onSuccess: (results) => {
          const result = results[0];
          if (result && result.exit_code !== 0) {
            setEvictingResource(null);
            setEvictStartedAt(null);
            message.destroy('evict-in-progress');
            message.error(`Evict failed: ${decodeExecText(result.stderr_utf8) || `exit code ${result.exit_code}`}`);
            return;
          }

          if (result?.active_node) {
            setEvictingResource(null);
            setEvictStartedAt(null);
            queryClient.setQueryData<Record<string, DrbdReactorStatus> | undefined>(
              ['drbd-reactor-status', nodeNames],
              (currentStatus) => syncEvictedResourceInStatus(currentStatus, record.name, result.active_node as string),
            );
            message.destroy('evict-in-progress');
            message.success(`"${record.name}" migrated to ${result.active_node}`);
            queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
            queryClient.invalidateQueries({ queryKey: ['resources-view'] });
            queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
            return;
          }

          message.loading({
            content: `Evicting "${record.name}" from ${primaryNode}, waiting for DRBD Reactor status…`,
            key: 'evict-in-progress',
            duration: 0,
          });
          const startedAt = Date.now();
          setEvictStartedAt(startedAt);
          setEvictingResource({ resourceName: record.name, fromNode: primaryNode });
          void refetchReactorStatus();
        },
        onError: (err) => {
          setEvictingResource(null);
          setEvictStartedAt(null);
          message.destroy('evict-in-progress');
          message.error(`Evict failed: ${err}`);
        },
      },
    );
  };

  const columns: ColumnsType<HARecord> = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('common:status'),
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (reactorStatusLoading) {
          return <LoadingOutlined spin style={{ color: 'rgba(0, 0, 0, 0.45)' }} />;
        }
        const active = isResourceActive(record.name);

        // Collect only the active promoter's info
        const activePromoter = reactorStatus
          ? Object.entries(reactorStatus).flatMap(([nodeName, nodeStatus]) =>
              (nodeStatus.promoter ?? [])
                .filter((p) => p.drbd_resource === record.name && p.status === 'active')
                .map((p) => ({ nodeName, promoter: p })),
            )[0]
          : null;

        const tooltipContent = activePromoter
          ? renderPromoterTree(
              activePromoter.promoter as PromoterEntry,
              record.name,
              activePromoter.nodeName === 'this node' ? 'this node' : `node '${activePromoter.nodeName}'`,
            )
          : null;

        const tag = <Tag color={active ? 'success' : 'default'}>{active ? 'Running' : 'Stopped'}</Tag>;

        return tooltipContent ? (
          <Tooltip
            title={tooltipContent}
            overlayStyle={{ maxWidth: 'none' }}
            overlayInnerStyle={{ width: 'max-content', maxWidth: 'none', padding: 12 }}
          >
            {tag}
          </Tooltip>
        ) : (
          tag
        );
      },
    },
    {
      title: t('common:nodes'),
      key: 'nodes',
      render: (_, record) => <ResourceNodes resourceName={record.name} reactorStatus={reactorStatus} />,
    },
    {
      title: t('ha:config_files'),
      key: 'config_files',
      render: (_, record) => {
        if (!record.props) return '-';
        const configFiles = Object.keys(record.props).filter((key) => key.startsWith('files/etc/drbd-reactor.d/'));
        return (
          <Space size={4} direction="vertical">
            {configFiles.map((file) => (
              <Text key={file} code>
                {file.replace('files/', '/')}
                <EyeOutlined
                  style={{ marginLeft: 8, cursor: 'pointer', color: '#499BBB' }}
                  onClick={() => openViewModal(file)}
                />
              </Text>
            ))}
          </Space>
        );
      },
    },
    {
      title: () => (
        <Tooltip title={t('common:action')}>
          <span className="flex justify-center">
            <LiaToolsSolid className="w-4 h-4" />
          </span>
        </Tooltip>
      ),
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        const configFiles = Object.keys(record.props || {}).filter((key) =>
          key.startsWith('files/etc/drbd-reactor.d/'),
        );
        const editPath =
          configFiles.length > 0 ? `/reactor/edit/${record.name}?filePath=${encodeURIComponent(configFiles[0])}` : '';

        const items: MenuProps['items'] = [
          {
            key: 'edit',
            label: t('common:edit'),
            disabled: !editPath,
            onClick: () => editPath && navigate(editPath),
          },
          { type: 'divider' },
          {
            key: 'evict',
            label: 'Evict',
            disabled: !getPrimaryNode(record.name) || !getConfigName(record),
            onClick: () => {
              const activeNode = getPrimaryNode(record.name);
              const configName = getConfigName(record);
              if (!activeNode || !configName) return;

              const modal = Modal.confirm({
                title: 'Evict Resource',
                content: `Evict configuration "${configName}" from active node "${activeNode}"? This will trigger failover.`,
                footer: (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => modal.destroy()}>{t('common:cancel')}</Button>
                    <Button
                      danger
                      onClick={() => {
                        modal.destroy();
                        handleEvict(record);
                      }}
                    >
                      Evict
                    </Button>
                  </div>
                ),
              });
            },
          },
          {
            key: 'stop',
            label: (() => {
              const isActive = isResourceActive(record.name);
              return isActive ? t('common:stop') : t('common:start');
            })(),
            disabled: !getConfigName(record),
            onClick: () => {
              const isActive = isResourceActive(record.name);
              const configName = getConfigName(record);
              if (!configName) return;

              const modal = Modal.confirm({
                title: isActive ? 'Stop Resource' : 'Start Resource',
                content: isActive
                  ? `Stop configuration "${configName}"? This will disable the HA service on all nodes.`
                  : `Start configuration "${configName}"? This will enable the HA service on all nodes.`,
                footer: (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => modal.destroy()}>{t('common:cancel')}</Button>
                    <Button
                      type="primary"
                      danger={isActive}
                      onClick={() => {
                        modal.destroy();
                        if (isActive) {
                          handleStop(record);
                        } else {
                          handleStart(record);
                        }
                      }}
                    >
                      {isActive ? t('common:stop') : t('common:start')}
                    </Button>
                  </div>
                ),
              });
            },
          },
          {
            key: 'unmanage',
            label: 'Unmanage',
            disabled: configFiles.length === 0,
            onClick: () => {
              if (configFiles.length === 0) return;
              const filePath = configFiles[0].replace('files', '');
              const modal = Modal.confirm({
                title: 'Unmanage Resource',
                content: `Stop LINSTOR from managing the HA configuration for "${record.name}"? The configuration file will remain on disk but LINSTOR will no longer track or sync it.`,
                footer: (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => modal.destroy()}>{t('common:cancel')}</Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        unmanageMutation.mutate(
                          { resourceName: record.name, filePath },
                          {
                            onSuccess: () => {
                              message.success(`"${record.name}" is no longer managed by LINSTOR`);
                              modal.destroy();
                            },
                            onError: (err) => {
                              message.error(`Failed to unmanage: ${err}`);
                              modal.destroy();
                            },
                          },
                        );
                      }}
                    >
                      Unmanage
                    </Button>
                  </div>
                ),
              });
            },
          },
          { type: 'divider' },
          {
            key: 'delete',
            label: <span className="text-red-600">{t('common:delete')}</span>,
            icon: <DeleteOutlined className="text-red-600" />,
            onClick: () => {
              const modal = Modal.confirm({
                title: t('common:delete'),
                content: `Are you sure you want to delete "${record.name}"? This will remove the HA configuration file from all nodes.`,
                footer: (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => modal.destroy()}>{t('common:cancel')}</Button>
                    <Button
                      type="primary"
                      danger
                      loading={deleteMutation.isLoading}
                      onClick={() => {
                        if (configFiles.length > 0) {
                          const filePath = configFiles[0].replace('files', '');
                          deleteMutation.mutate(
                            { resourceName: record.name, filePath },
                            {
                              onSuccess: () => {
                                message.success(`HA configuration for "${record.name}" deleted successfully`);
                                modal.destroy();
                              },
                              onError: (err) => {
                                message.error(`Failed to delete: ${err}`);
                              },
                            },
                          );
                        } else {
                          message.warning('No configuration file found to delete');
                          modal.destroy();
                        }
                      }}
                    >
                      {t('common:delete')}
                    </Button>
                  </div>
                ),
              });
            },
          },
        ];

        return (
          <Dropdown menu={{ items }}>
            <span className="cursor-pointer text-gray-600 hover:text-gray-800">
              <MoreOutlined />
            </span>
          </Dropdown>
        );
      },
    },
  ];

  // Compute unmanaged DRBD Reactor files (in LINSTOR file registry but not deployed to any HA resource)
  const managedFilePaths = useMemo(() => {
    const paths = new Set<string>();
    data?.forEach((rd) => {
      if (rd.props) {
        Object.keys(rd.props)
          .filter((k) => k.startsWith('files/etc/drbd-reactor.d/'))
          .forEach((k) => paths.add(k.replace('files', '')));
      }
    });
    return paths;
  }, [data]);

  const unmanagedFiles = useMemo(() => {
    const files = (filesData?.data as Array<{ path: string }>) || [];
    return files
      .filter((f) => f.path.startsWith('/etc/drbd-reactor.d/') && f.path.endsWith('.toml'))
      .filter((f) => !managedFilePaths.has(f.path));
  }, [filesData, managedFilePaths]);

  const allResourceDefinitions = useMemo(() => {
    return ((allRDData?.data as Array<{ name: string }>) || []).map((rd) => rd.name);
  }, [allRDData]);

  const handleManageSubmit = () => {
    if (!manageFile || !manageResource) return;
    manageMutation.mutate(
      { resourceName: manageResource, filePath: manageFile },
      {
        onSuccess: () => {
          message.success(`"${manageFile}" is now managed under resource "${manageResource}"`);
          setManageModalVisible(false);
          setManageFile(undefined);
          setManageResource(undefined);
        },
        onError: (err) => {
          message.error(`Failed to manage: ${err}`);
        },
      },
    );
  };

  return (
    <>
      {unmanagedFiles.length > 0 && (
        <div className="mb-4">
          <Button onClick={() => setManageModalVisible(true)}>Manage ({unmanagedFiles.length} unmanaged)</Button>
        </div>
      )}
      <Table columns={columns} dataSource={data} rowKey="uuid" loading={isLoading} pagination={false} />
      <FileContentModal filePath={viewFilePath} visible={viewModalVisible} onClose={() => setViewModalVisible(false)} />
      <Modal
        title="Manage HA Configuration"
        open={manageModalVisible}
        onCancel={() => setManageModalVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setManageModalVisible(false)}>{t('common:cancel')}</Button>
            <Button
              type="primary"
              disabled={!manageFile || !manageResource}
              loading={manageMutation.isLoading}
              onClick={handleManageSubmit}
            >
              Manage
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div>
            <Text strong>Configuration File</Text>
            <Select
              className="w-full mt-1"
              placeholder="Select an unmanaged configuration file"
              value={manageFile}
              onChange={setManageFile}
              options={unmanagedFiles.map((f) => ({ label: f.path, value: f.path }))}
            />
          </div>
          <div>
            <Text strong>Resource Definition</Text>
            <Select
              className="w-full mt-1"
              placeholder="Select a resource definition"
              value={manageResource}
              onChange={setManageResource}
              showSearch
              options={allResourceDefinitions.map((name) => ({ label: name, value: name }))}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};
