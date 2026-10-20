// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Space, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';

import PageBasic from '@app/components/PageBasic';
import { NodeResources, NodeSummary, StoragePoolCapacity, useActiveController, useNodes } from '@app/features/node';
import { getControllerVersion } from '@app/features/node/api';
import { compareVersions } from '@app/utils/version';
import {
  CreateForm,
  CreateNetWorkInterfaceRequestBody,
  deleteNetWorkInterface,
  getNetWorkInterfaceByNode,
  updateNetWorkInterface,
} from '@app/features/ip';
import { fullySuccess } from '@app/features/requests';
import { useStoragePools } from '@app/features/storagePool';
import { useResources } from '@app/features/snapshot';
import { useSettings, useUIMode } from '@app/features/settings/useSettings';
import { UIMode } from '@app/features/settings/types';
import { grafanaEnabled } from '@app/features/settings/grafana';
import GrafanaCharts from '@app/components/GrafanaCharts';

import NetInterfaceList from './components/NetInterfaceList';

const NodeDetail: React.FC = () => {
  const { t } = useTranslation(['node_detail', 'common']);
  const activeController = useActiveController();
  const { node } = useParams() as { node: string };
  const [searchParams, setSearchParams] = useSearchParams();
  const { grafanaConfig } = useSettings();
  // The open tab goes into the URL, so coming back from a linked resource or
  // pool lands on the same tab. It is read once: AppLayout strips the query
  // string whenever the page changes, right after this page has rendered.
  const [requestedTab, setRequestedTab] = useState(() => searchParams.get('tab'));

  const { data: nodeInfo } = useNodes({
    nodes: [node],
  });

  const { data: nodeInterfaceInfo, refetch } = useQuery({
    queryKey: ['getNetworkByNode', node],
    queryFn: () => getNetWorkInterfaceByNode(node),
  });

  const nodeStoragePoolInfo = useStoragePools({
    nodes: [node],
  });

  const resourceInfo = useResources({
    nodes: [node],
  });

  const { data: linstorVersion, isFetched: versionFetched } = useQuery({
    queryKey: ['linstorVersion'],
    queryFn: () => getControllerVersion(),
  });

  const platformAvailable = versionFetched && compareVersions(linstorVersion?.data?.rest_api_version, '1.28.0');

  const routePrefix = useUIMode() === UIMode.HCI ? '/hci' : '';

  const nodeData = nodeInfo?.[0];

  const deleteNetWorkInterfaceMutation = useMutation({
    mutationFn: (data: { node: string; netinterface: string }) => {
      const { node, netinterface } = data;

      return deleteNetWorkInterface(node, netinterface);
    },
    onSuccess: (data) => {
      if (fullySuccess(data?.data)) {
        refetch();
      }
    },
  });

  const updateNetWorkInterfaceMutation = useMutation({
    mutationFn: (
      data: CreateNetWorkInterfaceRequestBody & {
        node: string;
      },
    ) => {
      const { node, ...rest } = data;

      return updateNetWorkInterface(node, rest);
    },
    onSuccess: (data) => {
      if (fullySuccess(data?.data)) {
        refetch();
      }
    },
  });

  const handleDeleteNetWorkInterface = (netinterface: string) => {
    deleteNetWorkInterfaceMutation.mutate({
      node,
      netinterface,
    });
  };

  const handleUpdateNetWorkInterface = (data: CreateNetWorkInterfaceRequestBody) => {
    updateNetWorkInterfaceMutation.mutate({
      node,
      ...data,
      is_active: true,
    });
  };

  const tabs: TabsProps['items'] = [
    {
      key: 'storage-pools',
      label: t('storage_pools'),
      children: <StoragePoolCapacity node={node} pools={nodeStoragePoolInfo?.data ?? []} routePrefix={routePrefix} />,
    },
    {
      key: 'resources',
      label: t('resources'),
      children: <NodeResources resources={resourceInfo?.data ?? []} routePrefix={routePrefix} />,
    },
    {
      key: 'network-interfaces',
      label: t('network_interfaces'),
      children: (
        <>
          <NetInterfaceList
            list={nodeInterfaceInfo?.data || []}
            handleDeleteNetWorkInterface={handleDeleteNetWorkInterface}
            handleSetActiveNetWorkInterface={handleUpdateNetWorkInterface}
          />

          {/* nodeInfo?.[0].name threw once the list came back empty: the `?.`
              guards the list, not its first entry. */}
          <div className="mt-4">
            <CreateForm node={nodeData?.name} refetch={refetch} />
          </div>
        </>
      ),
    },
    // Without Grafana there is nothing to chart, so no tab for it either.
    ...(grafanaEnabled(grafanaConfig)
      ? [{ key: 'performance', label: t('common:performance_metrics'), children: <GrafanaCharts hostname={node} /> }]
      : []),
  ];

  // Performance is missing until the settings have loaded, so a request for it
  // is kept rather than dropped.
  const activeTab = tabs.some((tab) => tab.key === requestedTab) ? (requestedTab as string) : 'storage-pools';
  const onTabChange = (key: string) => {
    setRequestedTab(key);
    setSearchParams(
      (params) => {
        params.set('tab', key);
        return params;
      },
      { replace: true },
    );
  };

  return (
    <PageBasic title={t('title')} showBack>
      <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
        <NodeSummary
          node={nodeData}
          showPlatform={!!platformAvailable}
          activeController={!!nodeData?.name && nodeData.name === activeController}
        />

        <Card size="small">
          <Tabs activeKey={activeTab} onChange={onTabChange} items={tabs} />
        </Card>
      </Space>
    </PageBasic>
  );
};

export default NodeDetail;
