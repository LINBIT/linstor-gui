import React, { useEffect, useState } from 'react';
import { Button, Form, Table, Tag, Select, Popconfirm, Input, Checkbox, Dropdown } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

import { formatBytes } from '@app/utils/size';
import { CreateSnapshotRequestBody, SnapshotListQuery, SnapshotType } from '../types';
import { createSnapshot, getSnapshots } from '../api';
import { formatTime } from '@app/utils/time';

import { notify } from '@app/utils/toast';

export const List = () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<SnapshotListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const nodes = query.get('nodes');
    const queryO = {};

    if (nodes) {
      form.setFieldValue('nodes', nodes);
      queryO['nodes'] = nodes;
    }

    const storage_pools = query.get('storage_pools');

    if (storage_pools) {
      form.setFieldValue('storage_pools', storage_pools);
      queryO['storage_pools'] = storage_pools;
    }

    return queryO;
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data: snapshotList, isLoading } = useQuery(['getSnapshots', query], () => {
    return getSnapshots(query);
  });

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

    setQuery(newQuery);

    const new_url = `${location.pathname}?${queryS.toString()}`;

    history.push(new_url);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
    history.push('/inventory/storage-pools');
  };

  const columns: TableProps<SnapshotType>['columns'] = [
    {
      title: 'Resource Name',
      key: 'resourceName',
      dataIndex: 'resource_name',
      sorter: (a, b) => {
        return (a.resource_name ?? '').localeCompare(b.resource_name ?? '');
      },
      showSorterTooltip: false,
    },
    {
      title: 'Snapshot Name',
      key: 'name',
      dataIndex: 'name',
      sorter: (a, b) => {
        return (a?.name ?? '').localeCompare(b?.name ?? '');
      },
      showSorterTooltip: false,
    },
    Table.EXPAND_COLUMN,
    {
      title: 'Node Names',
      key: 'node_name',
      dataIndex: 'nodes',
      render: (nodes) => {
        return <span>{nodes.join(',')}</span>;
      },
    },
    {
      title: 'Volumes',
      key: 'volumes',
      dataIndex: 'volume_definitions',
      render: (volume_definitions) => {
        return (
          <span>
            {volume_definitions
              ?.map((e) => {
                return `${e.volume_number}: ${formatBytes(e.size_kib)}`;
              })
              .join(', ')}
          </span>
        );
      },
    },
    {
      title: 'Created',
      key: 'created',
      dataIndex: 'snapshots',
      render: (snapshots) => {
        return <span>{formatTime(snapshots[0].create_timestamp)}</span>;
      },
    },
    {
      title: 'State',
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
  ];

  return (
    <Table
      loading={isLoading}
      columns={columns}
      dataSource={snapshotList?.data ?? []}
      rowSelection={rowSelection}
      rowKey={(item) => item?.uuid || ''}
      expandable={{
        expandedRowRender: (record) => (
          <div>
            <div>Detail</div>
            {record.snapshots?.map((e) => {
              return (
                <div key={e.uuid}>
                  <p>Node: {e.node_name}</p>
                  {e.create_timestamp && <p>Snapshot Create Time: {formatTime(e.create_timestamp)}</p>}
                </div>
              );
            })}
          </div>
        ),
      }}
      pagination={{
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} items`,
      }}
    />
  );
};
