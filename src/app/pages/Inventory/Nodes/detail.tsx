// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Input, Modal, Space, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';

import PageBasic from '@app/components/PageBasic';
import { Resource, StoragePool, useNodes } from '@app/features/node';
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

import NetInterfaceList from './components/NetInterfaceList';
import { DashboardContainer, LabelText, TagContainer } from './detail.styled';
import { useWindowSize } from '@app/hooks';

const isValidArray = (nodeRes) => {
  return Array.isArray(nodeRes) && nodeRes.length > 0;
};

const DEFAULT_SP = 'DfltDisklessStorPool';

const handleStorageData = (storagePool, node) => {
  const validData = storagePool?.filter((item) => item.storage_pool_name !== DEFAULT_SP);

  if (!isValidArray(validData)) {
    return [];
  }

  const storagePoolUsedData = validData.map((item) => {
    return {
      storagePool: item.storage_pool_name,
      type: 'Used',
      value: item.total_capacity - item.free_capacity,
    };
  });

  const storagePoolFreeData = validData.map((item) => {
    return {
      storagePool: item.storage_pool_name,
      type: 'Total',
      value: item.total_capacity,
    };
  });

  const nodeFreeCapacity = validData.reduce((acc, curr) => {
    if (curr.free_capacity) {
      return acc + curr.free_capacity;
    } else {
      return acc;
    }
  }, 0);

  const nodeTotalCapacity = validData.reduce((acc, curr) => {
    if (curr.total_capacity) {
      return acc + curr.total_capacity;
    } else {
      return acc;
    }
  }, 0);

  const storagePoolOnNodeTotalData = {
    storagePool: `Total on ${node}`,
    type: 'Total',
    value: nodeTotalCapacity,
  };

  const storagePoolOnNodeFreeData = {
    storagePool: `Total on ${node}`,
    type: 'Used',
    value: nodeTotalCapacity - nodeFreeCapacity,
  };

  return [...storagePoolUsedData, ...storagePoolFreeData, storagePoolOnNodeFreeData, storagePoolOnNodeTotalData];
};

const handleResourceData = (resource) => {
  if (!isValidArray(resource)) {
    return [];
  }

  const resourceData =
    resource.reduce((acc, curr) => {
      const inUse = curr.state?.in_use;
      const inUseType = inUse ? 'in use' : 'not in use';

      const existingItem = acc.find((item) => item.type === inUseType);
      if (existingItem) {
        existingItem.value++;
      } else {
        acc.push({ type: inUseType, value: 1 });
      }

      return acc;
    }, []) || [];

  return resourceData;
};

const NodeDetail: React.FC = () => {
  const { t } = useTranslation('node_detail');
  const { node } = useParams() as { node: string };
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const nodeData = nodeInfo?.[0];
  const storagePoolData = handleStorageData(nodeStoragePoolInfo?.data, node) || [];
  const resourceData = handleResourceData(resourceInfo?.data) || [];

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

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);

    if (dashboardUrl) {
      setShowDashboard(true);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const createIFrame = () => {
    return {
      __html: dashboardUrl,
    };
  };

  return (
    <PageBasic title={t('title')} showBack>
      {/* TODO: add grafana dashboard here */}

      {/* <br />

      <Card title="Dashboard" size="small">
        {showDashboard ? (
          <div dangerouslySetInnerHTML={createIFrame()}></div>
        ) : (
          <EmptyDashboard onClick={showModal}>+</EmptyDashboard>
        )}
      </Card> */}

      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card size="small">
          <Space direction="vertical" size="small" style={{ display: 'flex' }}>
            <div>
              <LabelText>{t('node_name')}:</LabelText>
              {nodeData?.name}
            </div>
            <div>
              <LabelText>{t('node_type')}:</LabelText> {nodeData?.type?.toLowerCase()}
            </div>
            <div>
              <LabelText>{t('node_status')}: </LabelText>
              {nodeData?.connection_status === 'ONLINE' && (
                <CheckCircleOutlined style={{ color: 'green', marginRight: 4 }} />
              )}
              {nodeData?.connection_status?.toLowerCase()}
            </div>
            <TagContainer>
              <LabelText>{t('resource_layers')}:</LabelText>

              {nodeData
                ? nodeData?.resource_layers?.map((e) => (
                    <Tag key={e} color="success">
                      {e}
                    </Tag>
                  ))
                : null}
              {nodeData
                ? Object.keys(nodeData?.unsupported_layers ?? {}).map((e) => (
                    <Tag key={e} color="error">
                      {e}
                    </Tag>
                  ))
                : null}
            </TagContainer>

            <TagContainer>
              <LabelText>{t('storage_providers')}:</LabelText>
              {nodeData
                ? nodeData?.storage_providers?.map((e) => (
                    <Tag key={e} color="success">
                      {e}
                    </Tag>
                  ))
                : null}
              {nodeData
                ? Object.keys(nodeData?.unsupported_providers ?? {}).map((e) => (
                    <Tag key={e} color="error">
                      {e}
                    </Tag>
                  ))
                : null}
            </TagContainer>
          </Space>
        </Card>

        <Card title={t('network_interfaces')} size="small">
          <NetInterfaceList
            list={nodeInterfaceInfo?.data || []}
            handleDeleteNetWorkInterface={handleDeleteNetWorkInterface}
            handleSetActiveNetWorkInterface={handleUpdateNetWorkInterface}
          />

          <CreateForm node={nodeInfo?.[0].name} refetch={refetch} />
        </Card>

        <div className="flex gap-4">
          <Card title={t('storage_pool_info')} size="small" style={{ width: '50%' }}>
            {storagePoolData.length > 0 && <StoragePool data={storagePoolData} />}
          </Card>

          <Card title={t('resource_info')} size="small" style={{ width: '50%' }}>
            {resourceData.length > 0 && <Resource data={resourceData} />}
          </Card>
        </div>
      </Space>

      <Modal title="Import Grafana Dashboard" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <DashboardContainer>
          <Input.TextArea
            placeholder="Paste your grafana dashboard link here..."
            rows={6}
            onChange={(e) => setDashboardUrl(e.target.value)}
          />
        </DashboardContainer>
      </Modal>
    </PageBasic>
  );
};

export default NodeDetail;
