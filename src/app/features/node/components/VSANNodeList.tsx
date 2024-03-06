import React, { useState } from 'react';
import { Table, Tag, Switch, Button, Popover, Space, Modal, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getNodesFromVSAN, setNodeStandBy } from '../api';
import { notify } from '@app/utils/toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { compareIPv4 } from '@app/utils/ip';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { ActionContainer } from './styled';

interface DataType {
  hostname: string;
  service_ip: string;
  online: boolean;
  standby: boolean;
  has_linstor_controller: boolean;
}

export const VSANNodeList = () => {
  const history = useHistory();
  const [intervalModal, setIntervalModal] = useState(false);
  const [refetchInterval, setRefetchInterval] = useState<number | null>(60);
  const [tempIntervalVal, setTempIntervalVal] = useState<number | null>(null);

  const nodesFromVSAN = useQuery({
    queryKey: ['nodesFromVSAN'],
    queryFn: () => getNodesFromVSAN(),
    refetchInterval: 10,
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showStandbyWarning, setShowStandbyWarning] = useState(false);
  const [standbyHost, setStandbyHost] = useState<{ hostname: string; checked: boolean }>({
    hostname: '',
    checked: false,
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

  const doStandBy = (host: { hostname: string; checked: boolean }) => {
    standByMutation.mutateAsync({
      hostname: host.hostname,
      status: host.checked,
    });

    setShowStandbyWarning(false);
    setStandbyHost({
      hostname: '',
      checked: false,
    });
  };

  const handleStandby = (hostname: string, checked: boolean) => {
    setStandbyHost({
      hostname,
      checked,
    });
    if (checked) {
      setShowStandbyWarning(true);
    } else {
      doStandBy({ hostname, checked });
    }
  };

  const columns: ColumnsType<DataType> = [
    {
      title: 'Node Name',
      dataIndex: 'hostname',
      key: 'hostname',
      sorter: (a, b) => a.hostname.localeCompare(b.hostname),
      showSorterTooltip: false,
    },
    {
      title: 'Default IP',
      dataIndex: 'service_ip',
      key: 'service_ip',
      sorter: (a, b) => compareIPv4(a.service_ip, b.service_ip),
      showSorterTooltip: false,
    },
    {
      title: () => (
        <Popover
          placement="top"
          title="Color Coding"
          content={() => (
            <div>
              <p>
                <Tag color="success">Online</Tag>:Everything is ok
              </p>
              <p>
                <Tag color="yellow">Standby</Tag>: Node is in standby
              </p>
              <p>
                <Tag color="red">Error</Tag>: Something is wrong
              </p>
            </div>
          )}
        >
          <span>
            Status &nbsp; <InfoCircleOutlined rev={null} />
          </span>
        </Popover>
      ),
      dataIndex: 'address',
      key: 'online',
      render: (_, record) => {
        let color = 'success';
        let statusText = 'Online';

        if (record.online) {
          color = 'success';
          statusText = 'Online';

          if (record.standby) {
            color = 'yellow';
            statusText = 'Standby';
          }
        } else {
          color = 'red';
          statusText = 'Error';
        }

        return (
          <>
            <Tag color={color}>{statusText}</Tag>
            {record.has_linstor_controller && <Tag color="#f79133">LINSTOR Controller</Tag>}
          </>
        );
      },
    },
    {
      title: () => (
        <Popover
          placement="top"
          content={() => (
            <p style={{ width: 300 }}>
              If the standby button shows &quot;off&quot;, the node is online and running normally. If you turn the
              standby button on, all resources running on that node get moved to another node and the node is put into
              standby.Nodes in standby can be freely shut down without having to worry about any resources.
            </p>
          )}
        >
          <span>
            Standby &nbsp; <InfoCircleOutlined rev={null} />
          </span>
        </Popover>
      ),
      key: 'standby',
      render: (_, record) => {
        return (
          <Switch
            checked={record.standby}
            onChange={(checked) => {
              handleStandby(record.hostname, checked);
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
          <Space>
            <Button type="primary" onClick={() => goToDetailPage(record.hostname)}>
              View
            </Button>
            <Button danger type="default" onClick={() => console.log(record.hostname)}>
              Delete
            </Button>
          </Space>
        );
      },
    },
  ];

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div>
      <ActionContainer>
        <Space>
          <Button type="default" onClick={() => nodesFromVSAN.refetch()} loading={nodesFromVSAN.isLoading}>
            Reload
          </Button>

          <Button danger type="default" disabled={!hasSelected}>
            Delete
          </Button>
        </Space>

        <Button
          type="primary"
          shape="circle"
          icon={<SettingOutlined rev={null} />}
          onClick={() => setIntervalModal(true)}
        />
      </ActionContainer>

      <Table columns={columns} dataSource={nodesFromVSAN.data?.data} rowSelection={rowSelection} />

      <Modal
        title="Warning"
        open={showStandbyWarning}
        onOk={() => doStandBy(standbyHost)}
        onCancel={() => setShowStandbyWarning(false)}
      >
        <p>
          By putting a node into standby, all resources currently running on that node will be moved to another node.
        </p>
        <p>This might cause your resources to have less replicas than you wanted.</p>
        <p>Are you sure you want to continue?</p>
      </Modal>

      <Modal
        title="Refresh Interval"
        open={intervalModal}
        onOk={() => {
          setRefetchInterval(tempIntervalVal);
          setIntervalModal(false);
        }}
        onCancel={() => setIntervalModal(false)}
      >
        <span>Refresh Interval</span>:{' '}
        <InputNumber
          addonAfter="seconds"
          defaultValue={refetchInterval ?? 60}
          value={tempIntervalVal}
          onChange={(val) => setTempIntervalVal(val)}
        />
      </Modal>
    </div>
  );
};
