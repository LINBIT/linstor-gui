import React from 'react';
import { useNodesFromVSAN } from '../hooks';
import { Space, Table, Tag, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { setNodeStandBy } from '../api';

interface DataType {
  hostname: string;
  ip: string;
  online: boolean;
  standby: boolean;
  hasLinstorController: boolean;
}

export const VSANNodeList = () => {
  const { data: nodesFromVSAN } = useNodesFromVSAN();
  const handleStandBy = (hostname: string, status: boolean) => {
    setNodeStandBy(hostname, status);
  };

  const columns: ColumnsType<DataType> = [
    {
      title: 'Node Name',
      dataIndex: 'hostname',
      key: 'hostname',
    },
    {
      title: 'Default IP',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: 'Status',
      dataIndex: 'address',
      key: 'online',
      render: (_, record) => {
        return (
          <>
            <Tag color="success">{record.online ? 'Online' : 'Offline'}</Tag>
            {record.hasLinstorController && <Tag color="success">Linstor Controller</Tag>}
          </>
        );
      },
    },
    {
      title: 'StandBy',
      key: 'action',
      render: (_, record) => {
        return (
          <Switch
            onChange={(checked) => {
              handleStandBy(record.hostname, checked);
            }}
          />
        );
      },
    },
  ];

  return (
    <div>
      <Table columns={columns} dataSource={nodesFromVSAN} />
    </div>
  );
};
