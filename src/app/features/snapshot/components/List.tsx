// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Table, Select, Popconfirm, Space, Dropdown, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled, MoreOutlined } from '@ant-design/icons';
import { LiaToolsSolid } from 'react-icons/lia';
import { uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';

import { formatBytes } from '@app/utils/size';
import { SnapshotListQuery, SnapshotType } from '../types';
import { deleteSnapshot, getSnapshots } from '../api';
import { formatTime } from '@app/utils/time';
import { useNodes } from '@app/features/node';
import { getResources } from '@app/features/resource';

import { SearchForm } from './styled';
import { CreateSnapshotForm } from './CreateForm';
import { RollbackSnapshotForm } from './RollbackForm';

export const List = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useTranslation(['common', 'snapshot']);

  const nodes = useNodes();
  const { data: resourceList } = useQuery({
    queryKey: ['getResource'],
    queryFn: () => {
      return getResources();
    },
  });

  const [query, setQuery] = useState<SnapshotListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const nodes = query.get('nodes');
    const queryO: SnapshotListQuery = {};

    if (nodes) {
      form.setFieldValue('nodes', nodes);
      queryO['nodes'] = [nodes];
    }

    const resources = query.get('resources');

    if (resources) {
      form.setFieldValue('resources', resources);
      queryO.resources = [resources];
    }

    return queryO;
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // State for rollback snapshot modal
  const [rollbackModalInfo, setRollbackModalInfo] = useState<{
    visible: boolean;
    resource: string;
    snapshot: string;
  }>({
    visible: false,
    resource: '',
    snapshot: '',
  });

  const {
    data: snapshotList,
    isLoading,
    refetch,
  } = useQuery(['getSnapshots', query], () => {
    return getSnapshots(query);
  });

  const deleteMutation = useMutation({
    mutationKey: ['deleteSnapshot'],
    mutationFn: (data: { resource: string; snapshot: string }) => deleteSnapshot(data.resource, data.snapshot),
    onSuccess: () => {
      refetch();
    },
  });

  // Handle rollback modal open
  const handleOpenRollbackModal = (resource: string, snapshot: string) => {
    setRollbackModalInfo({
      visible: true,
      resource,
      snapshot,
    });
  };

  // Handle rollback modal close
  const handleCloseRollbackModal = () => {
    setRollbackModalInfo({
      visible: false,
      resource: '',
      snapshot: '',
    });
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const queryS = new URLSearchParams({});
    const newQuery: SnapshotListQuery = { ...query };
    if (values.nodes) {
      newQuery.nodes = values.nodes;
      queryS.set('nodes', values.nodes);
    }

    if (values.resources) {
      newQuery.resources = values.resources;
      queryS.set('resources', values.resources);
    }

    setQuery(newQuery);

    const new_url = `${location.pathname}?${queryS.toString()}`;

    navigate(new_url);
  };

  const handleDeleteBulk = () => {
    selectedRowKeys.forEach((ele) => {
      const record = snapshotList?.data?.find((e) => e.uuid === ele);
      if (!record) {
        return;
      }

      deleteMutation.mutate({ resource: record.resource_name ?? '', snapshot: record.name ?? '' });
    });

    setSelectedRowKeys([]);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
    navigate('/snapshot');
  };

  const columns: TableProps<SnapshotType>['columns'] = [
    {
      title: t('snapshot:resource_name'),
      key: 'resourceName',
      dataIndex: 'resource_name',
      sorter: (a, b) => {
        return (a.resource_name ?? '').localeCompare(b.resource_name ?? '');
      },
      showSorterTooltip: false,
    },
    {
      title: t('snapshot:snapshot_name'),
      key: 'name',
      dataIndex: 'name',
      sorter: (a, b) => {
        return (a?.name ?? '').localeCompare(b?.name ?? '');
      },
      showSorterTooltip: false,
    },
    {
      title: t('snapshot:node_names'),
      key: 'node_name',
      dataIndex: 'nodes',
      render: (nodes) => {
        return <span>{nodes.join(',')}</span>;
      },
    },
    {
      title: t('snapshot:volumes'),
      key: 'volumes',
      dataIndex: 'volume_definitions',
      render: (volume_definitions) => {
        return (
          <span>
            {volume_definitions
              ?.map((e: { volume_number: string; size_kib: number }) => {
                return `${e.volume_number}: ${formatBytes(e.size_kib)}`;
              })
              .join(', ')}
          </span>
        );
      },
    },
    {
      title: t('common:created'),
      key: 'created',
      dataIndex: 'snapshots',
      render: (snapshots) => {
        return <span>{formatTime(snapshots[0].create_timestamp)}</span>;
      },
    },
    {
      title: t('common:state'),
      key: 'state',
      render: (_, item) => {
        const isSuccessful = item.flags?.includes('SUCCESSFUL');
        return (
          <span>
            {isSuccessful ? (
              <CheckCircleFilled style={{ color: 'green', fontSize: '24px' }} />
            ) : (
              <CloseCircleFilled style={{ color: 'grey', fontSize: '24px' }} />
            )}
          </span>
        );
      },
      align: 'center',
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
      render: (_, record) => (
        <Space size="small">
          <Dropdown
            menu={{
              items: [
                {
                  key: 'rollback',
                  label: (
                    <Button
                      type="text"
                      onClick={() => {
                        handleOpenRollbackModal(record.resource_name ?? '', record.name ?? '');
                      }}
                    >
                      {t('snapshot:rollback')}
                    </Button>
                  ),
                },
                {
                  key: 'delete',
                  label: (
                    <Button
                      type="text"
                      onClick={() => {
                        deleteMutation.mutate({ resource: record.resource_name ?? '', snapshot: record.name ?? '' });
                      }}
                    >
                      {t('common:delete')}
                    </Button>
                  ),
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <>
      <SearchForm>
        <Form
          form={form}
          name="node_list_form"
          layout="inline"
          initialValues={{
            show_default: true,
          }}
        >
          <Form.Item name="nodes" label={t('common:node')}>
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder="Please select node"
              options={nodes?.data?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="resources" label={t('common:resource')}>
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder="Please select resource"
              options={uniqBy(resourceList?.data, 'name')?.map((e: any) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Space size="small">
              <Button type="default" onClick={handleReset}>
                {t('common:reset')}
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  handleSearch();
                }}
              >
                {t('common:search')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
        <CreateSnapshotForm refetch={refetch} />

        {hasSelected && (
          <Popconfirm
            key="delete"
            title="Delete snapshots"
            description="Are you sure to delete selected snapshots?"
            okText="Yes"
            cancelText="No"
            onConfirm={handleDeleteBulk}
          >
            <Button type="primary" danger>
              {t('common:delete')}
            </Button>
          </Popconfirm>
        )}
      </SearchForm>
      <Table
        loading={isLoading}
        columns={columns}
        dataSource={snapshotList?.data ?? []}
        rowSelection={rowSelection}
        rowKey={(item) => item?.uuid || ''}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      {/* Rollback snapshot modal */}
      <RollbackSnapshotForm
        visible={rollbackModalInfo.visible}
        resource={rollbackModalInfo.resource}
        snapshot={rollbackModalInfo.snapshot}
        onClose={handleCloseRollbackModal}
        onSuccess={refetch}
      />
    </>
  );
};
