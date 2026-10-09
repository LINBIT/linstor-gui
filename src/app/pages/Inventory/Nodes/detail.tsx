// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Space } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';

import PageBasic from '@app/components/PageBasic';
import { NodeResources, NodeSummary, StoragePoolCapacity, useNodes } from '@app/features/node';
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
import { useUIMode } from '@app/features/settings/useSettings';
import { UIMode } from '@app/features/settings/types';
import GrafanaCharts from '@app/components/GrafanaCharts';

import NetInterfaceList from './components/NetInterfaceList';

const NodeDetail: React.FC = () => {
  const { t } = useTranslation('node_detail');
  const { node } = useParams() as { node: string };

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

  return (
    <PageBasic title={t('title')} showBack>
      <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
        <NodeSummary node={nodeData} showPlatform={!!platformAvailable} />

        {/* One row each: side by side at one height, the shorter card was
            mostly empty space. */}
        <Card title={t('storage_pool_info')} size="small">
          <StoragePoolCapacity node={node} pools={nodeStoragePoolInfo?.data ?? []} routePrefix={routePrefix} />
        </Card>

        <Card title={t('resource_info')} size="small">
          <NodeResources resources={resourceInfo?.data ?? []} routePrefix={routePrefix} />
        </Card>

        <Card title={t('network_interfaces')} size="small">
          <NetInterfaceList
            list={nodeInterfaceInfo?.data || []}
            handleDeleteNetWorkInterface={handleDeleteNetWorkInterface}
            handleSetActiveNetWorkInterface={handleUpdateNetWorkInterface}
          />

          {/* nodeInfo?.[0].name threw once the list came back empty: the `?.`
              guards the list, not its first entry. */}
          <CreateForm node={nodeData?.name} refetch={refetch} />
        </Card>

        <GrafanaCharts hostname={node} />
      </Space>
    </PageBasic>
  );
};

export default NodeDetail;
