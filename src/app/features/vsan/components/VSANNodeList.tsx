// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import {
  Table,
  Tag,
  Switch,
  Button,
  Popover,
  Space,
  Modal,
  InputNumber,
  Progress,
  Tooltip,
  Popconfirm,
  notification,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getNodesFromVSAN, setNodeStandBy } from '../api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { compareIPv4 } from '@app/utils/ip';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { ActionContainer, UpdateStatus } from './styled';
import { BRAND_COLOR, ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';
import { REFETCH_INTERVAL } from '@app/const/time';
import { ErrorMessage } from '../types';

interface DataType {
  hostname: string;
  service_ip: string;
  online: boolean;
  standby: boolean;
  has_linstor_controller: boolean;
  upgradeProgress: { maxSteps: number; curStep: number; label: string; message?: string } | null;
  updating?: boolean;
}

export const VSANNodeList = () => {
  const history = useHistory();
  const [intervalModal, setIntervalModal] = useState(false);
  const [refetchInterval, setRefetchInterval] = useState<number | null>(10);
  const [tempIntervalVal, setTempIntervalVal] = useState<number | null>(null);
  const [api, contextHolder] = notification.useNotification();

  const nodesFromVSAN = useQuery({
    queryKey: ['nodesFromVSAN'],
    queryFn: () => getNodesFromVSAN(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const [showStandbyWarning, setShowStandbyWarning] = useState(false);
  const [standbyHost, setStandbyHost] = useState<{ hostname: string; checked: boolean }>({
    hostname: '',
    checked: false,
  });

  const [updatingInfo, setUpdatingInfo] = useState<
    Record<string, { upgrading: boolean; progress: { maxSteps: number; curStep: number; label: string } }>
  >({});

  const [currentNode, setCurrentNode] = useState('');

  const upgradeNode = (nodeName: string) => {
    const IS_DEV = process.env.NODE_ENV === 'development';
    console.log('Upgrade node: ' + nodeName);
    setUpdatingInfo((prev) => {
      return {
        ...prev,
        [nodeName]: {
          upgrading: true,
          progress: { maxSteps: 0, curStep: 0, label: 'Checking' },
        },
      };
    });

    let url = new URL(
      location.origin.replace(/^http/, 'wss') + '/api/frontend/v1/system/update-with-reboot/' + nodeName,
    );

    if (IS_DEV) {
      url = new URL(
        process.env.VSAN_API_HOST?.replace('https', 'wss') + '/api/frontend/v1/system/update-with-reboot/' + nodeName,
      );
    }

    // const url = new URL('wss://192.168.123.217' + '/api/frontend/v1/system/update-with-reboot/' + nodeName);
    url.port = '';
    const updatedUrl = url.toString();
    const socket = new WebSocket(updatedUrl);

    socket.addEventListener('message', (event) => {
      console.log('Message from server ', event.data);
      const progress = JSON.parse(event.data);

      setUpdatingInfo((prev) => {
        return {
          ...prev,
          [nodeName]: {
            upgrading: true,
            progress: { maxSteps: progress.of, curStep: progress.number, label: progress.type },
          },
        };
      });

      if (progress.number === progress.of && progress.type === 'Downloading') {
        setUpdatingInfo((prev) => {
          return {
            ...prev,
            [nodeName]: {
              upgrading: true,
              progress: { maxSteps: 10, curStep: 0, label: 'Download Finished' },
            },
          };
        });
      }

      if (progress.number === progress.of && progress.type === 'Installing') {
        setUpdatingInfo((prev) => {
          return {
            ...prev,
            [nodeName]: {
              upgrading: true,
              progress: { maxSteps: 10, curStep: 0, label: 'Rebooting' },
            },
          };
        });
      }

      if (progress.type === 'Error') {
        setUpdatingInfo((prev) => {
          return {
            ...prev,
            [nodeName]: {
              upgrading: false,
              progress: { maxSteps: 10, curStep: 0, label: 'Error', message: progress?.error },
            },
          };
        });

        api.error({
          message: 'Failed to update node!',
          description: progress?.error,
          duration: 0,
        });
      }
    });

    socket.addEventListener('close', () => {
      console.log('Update finished for node: ' + nodeName);
      setUpdatingInfo((prev) => {
        return {
          ...prev,
          [nodeName]: {
            upgrading: false,
            progress: { maxSteps: 10, curStep: 10, label: 'Finished' },
          },
        };
      });

      api.success({
        message: 'Update finished for node: ' + nodeName,
      });
    });
  };

  const standByMutation = useMutation({
    mutationFn: ({ hostname, status }: { hostname: string; status: boolean }) => {
      return setNodeStandBy(hostname, status);
    },
    onSuccess: () => {
      api.success({
        message: 'Standby status changed!',
      });

      nodesFromVSAN.refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        message: err?.message,
        description: err?.detail || err?.explanation,
        duration: 0,
      });
    },
  });

  const goToDetailPage = (node) => {
    history.push(`/vsan/nodes/${node}`);
  };

  const doStandBy = (host: { hostname: string; checked: boolean }) => {
    setCurrentNode(host.hostname);
    try {
      standByMutation.mutate({
        hostname: host.hostname,
        status: host.checked,
      });

      setShowStandbyWarning(false);
      setStandbyHost({
        hostname: '',
        checked: false,
      });
    } catch (error) {
      console.error('Error while setting standby', error);
    }
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
                <Tag color={SUCCESS_COLOR}>Online</Tag>: Everything is ok
              </p>
              <p>
                <Tag color="yellow">Standby</Tag>: Node is in standby
              </p>
              <p>
                <Tag color={ERROR_COLOR}>Error</Tag>: Something is wrong
              </p>
            </div>
          )}
        >
          <span>
            Status &nbsp; <InfoCircleOutlined />
          </span>
        </Popover>
      ),
      dataIndex: 'address',
      key: 'online',
      render: (_, record) => {
        let color = SUCCESS_COLOR;
        let statusText = 'Online';

        if (record.online) {
          color = SUCCESS_COLOR;
          statusText = 'Online';

          if (record.standby) {
            color = 'yellow';
            statusText = 'Standby';
          }
        } else {
          color = ERROR_COLOR;
          statusText = 'Error';
        }

        return (
          <>
            <Tag color={color}>{statusText}</Tag>
            {record.has_linstor_controller && <Tag color="#f79133">Controller</Tag>}
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
            Standby &nbsp; <InfoCircleOutlined />
          </span>
        </Popover>
      ),
      key: 'standby',
      render: (_, record) => {
        return (
          <Switch
            loading={standByMutation.isLoading && currentNode === record.hostname}
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
        const updating = updatingInfo[record.hostname]?.upgrading ?? false;
        const upgradeProcess = updatingInfo[record.hostname];
        const updateProcess = upgradeProcess?.progress;
        const progress = updateProcess?.curStep ?? 0 / (updateProcess?.maxSteps ?? 100);
        let updateError = false;

        let tooltip =
          updateProcess?.label === 'Downloading' || updateProcess?.label === 'Installing'
            ? `${updateProcess?.label}  ${updateProcess?.curStep} of ${updateProcess?.maxSteps}`
            : updateProcess?.label;

        let color =
          updateProcess?.label === 'Downloading' || updateProcess?.label === 'Installing' ? BRAND_COLOR : SUCCESS_COLOR;

        if (updateProcess?.label === 'Error') {
          color = ERROR_COLOR;
          updateError = true;
          tooltip = record.upgradeProgress?.message ?? 'Update failed!';
        }

        return (
          <>
            <Space>
              <Button type="primary" onClick={() => goToDetailPage(record.hostname)}>
                View
              </Button>
              <Popconfirm
                title="Update node?"
                description="Are you sure you want to update this node?"
                onConfirm={() => upgradeNode(record.hostname)}
                okText="Yes"
                cancelText="No"
              >
                <Button disabled={!record.standby} type="default" loading={updating}>
                  Update
                </Button>
              </Popconfirm>
            </Space>
            {updating && (
              <UpdateStatus>
                <Tooltip title={tooltip || ''}>
                  <Progress percent={progress} status="active" strokeColor={color} />
                  <Tag color={color}>{updateProcess?.label}</Tag>
                </Tooltip>
              </UpdateStatus>
            )}
            {updateError && (
              <UpdateStatus>
                <Tooltip title={tooltip || ''}>
                  <Tag color={ERROR_COLOR}>{updateProcess?.label}</Tag>
                </Tooltip>
              </UpdateStatus>
            )}
          </>
        );
      },
    },
  ];

  const IS_DEV = process.env.NODE_ENV === 'development';

  return (
    <div>
      {contextHolder}
      <ActionContainer>
        <Space>
          <Button type="default" onClick={() => nodesFromVSAN.refetch()}>
            Reload
          </Button>

          <Button type="primary">
            <a
              href={
                IS_DEV
                  ? process.env.VSAN_API_HOST + '/addnode.html'
                  : 'https://' + window.location.hostname + '/addnode.html'
              }
              target="_blank"
              rel="noreferrer"
            >
              Add Nodes
            </a>
          </Button>

          <Button danger type="default">
            <a
              href={
                IS_DEV
                  ? process.env.VSAN_API_HOST + '/delnode.html'
                  : 'https://' + window.location.hostname + '/delnode.html'
              }
              target="_blank"
              rel="noreferrer"
            >
              Delete Nodes
            </a>
          </Button>
        </Space>

        <Button type="primary" shape="circle" icon={<SettingOutlined />} onClick={() => setIntervalModal(true)} />
      </ActionContainer>

      <Table
        columns={columns}
        dataSource={nodesFromVSAN?.data?.data ?? []}
        loading={nodesFromVSAN.isLoading}
        pagination={false}
      />

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
