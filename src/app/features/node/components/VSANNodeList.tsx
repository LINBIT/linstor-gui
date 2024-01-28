import React from 'react';
import { Table, Tag, Switch, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getNodesFromVSAN, setNodeStandBy } from '../api';
import { notify } from '@app/utils/toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';

interface DataType {
  hostname: string;
  ip: string;
  online: boolean;
  standby: boolean;
  has_linstor_controller: boolean;
}

export const VSANNodeList = () => {
  const history = useHistory();
  const nodesFromVSAN = useQuery({
    queryKey: ['nodesFromVSAN'],
    queryFn: () => getNodesFromVSAN(),
  });

  const standByMutation = useMutation({
    mutationFn: ({ hostname, status }: { hostname: string; status: boolean }) => {
      return setNodeStandBy(hostname, status);
    },
    onSuccess: () => {
      notify('Standby status changed!', {
        type: 'success',
      });

      nodesFromVSAN.refetch();
    },
    onError: () => {
      notify('Standby status change failed!', {
        type: 'error',
      });
    },
  });

  const goToDetailPage = (node) => {
    history.push(`/inventory/nodes/${node}`);
  };

  const columns: ColumnsType<DataType> = [
    {
      title: 'Node Name',
      dataIndex: 'hostname',
      key: 'hostname',
    },
    {
      title: 'Default IP',
      dataIndex: 'service_ip',
      key: 'service_ip',
    },
    {
      title: 'Status',
      dataIndex: 'address',
      key: 'online',
      render: (_, record) => {
        return (
          <>
            <Tag color={record.online ? 'success' : 'yellow'}>{record.online ? 'Online' : 'Offline'}</Tag>
            {record.has_linstor_controller && <Tag color="success">LINSTOR Controller</Tag>}
          </>
        );
      },
    },
    {
      title: 'Standby',
      key: 'standby',
      render: (_, record) => {
        return (
          <Switch
            checked={record.standby}
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
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        return (
          <Button type="primary" onClick={() => goToDetailPage(record.hostname)}>
            View
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <Table columns={columns} dataSource={nodesFromVSAN.data?.data} />
    </div>
  );
};
