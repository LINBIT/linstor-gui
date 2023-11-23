import React, { useEffect } from 'react';
import { useNodesFromVSAN } from '../hooks';
import { Space, Table, Tag, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { setNodeStandBy } from '../api';
import { notify } from '@app/utils/toast';
import { useMutation } from '@tanstack/react-query';

interface DataType {
  hostname: string;
  ip: string;
  online: boolean;
  standby: boolean;
  hasLinstorController: boolean;
}

export const VSANNodeList = () => {
  const { data: nodesFromVSAN, error } = useNodesFromVSAN();

  const standByMutation = useMutation({
    mutationFn: ({ hostname, status }: { hostname: string; status: boolean }) => {
      return setNodeStandBy(hostname, status);
    },
    onSuccess: () => {
      notify('StandBy status changed!', {
        type: 'success',
      });
    },
    onError: () => {
      notify('Standby status change failed!', {
        type: 'error',
      });
    },
  });

  useEffect(() => {
    notify('Fetch node list failed!', {
      type: 'error',
    });
  }, [error]);

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
            {record.hasLinstorController && <Tag color="success">LINSTOR Controller</Tag>}
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
              standByMutation.mutateAsync({
                hostname: record.hostname,
                status: checked,
              });
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
