// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@app/utils/logger';
import { Table, Popover, Space, Modal, Progress, Tooltip, notification } from 'antd';
import { Tag, type TagTone } from '@app/components/Tag';
import { InputNumber } from '@app/components/InputNumber';
import type { ColumnsType } from 'antd/es/table';
import { getNodesFromVSAN, setNodeStandBy, setNodeMaintenance, getCloudStackNodes } from '../api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { compareIPv4 } from '@app/utils/ip';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';

import { cssVar } from '@app/const/themeTokens';
import { CloudStackNode, ErrorMessage, Node } from '../types';
import { UIMode } from '@app/features/settings/types';
import { useUIMode } from '@app/features/settings/useSettings';
import { Button } from '@app/components/Button';
import { Switch } from '@app/components/Switch';
import { Popconfirm } from '@app/components/Popconfirm';

const IS_DEV = import.meta.env.MODE === 'development';

export const VSANNodeList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [intervalModal, setIntervalModal] = useState(false);
  const [refetchInterval, setRefetchInterval] = useState<number | null>(10);
  const [tempIntervalVal, setTempIntervalVal] = useState<number | null>(null);
  const [api, contextHolder] = notification.useNotification();

  const modeFromSetting = useUIMode();

  const isVSAN = modeFromSetting === UIMode.VSAN;
  const isHCI = modeFromSetting === UIMode.HCI;

  const nodesFromVSAN = useQuery({
    queryKey: ['nodesFromVSAN'],
    queryFn: () => getNodesFromVSAN(),
    refetchInterval: refetchInterval ? refetchInterval * 1000 : false,
  });

  const cloudStackNodes = useQuery({
    queryKey: ['cloudStackNodes'],
    queryFn: () => getCloudStackNodes(),
    refetchInterval: refetchInterval ? refetchInterval * 1000 : false,
    enabled: isHCI,
  });

  const [showStandbyWarning, setShowStandbyWarning] = useState(false);
  const [standbyHost, setStandbyHost] = useState<{ hostname: string; checked: boolean }>({
    hostname: '',
    checked: false,
  });

  const [updatingInfo, setUpdatingInfo] = useState<
    Record<
      string,
      { upgrading: boolean; progress: { maxSteps: number; curStep: number; label: string; message?: string } }
    >
  >({});

  const [currentNode, setCurrentNode] = useState('');

  const upgradeNode = (nodeName: string) => {
    logger.debug('Upgrade node: ' + nodeName);
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
      logger.debug('Message from server ', event.data);
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
          title: t('vsan:update_failed'),
          description: progress?.error,
          duration: 0,
        });
      }
    });

    socket.addEventListener('close', () => {
      logger.debug('Update finished for node: ' + nodeName);
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
        title: t('vsan:update_finished', { node: nodeName }),
      });
    });
  };

  const standByMutation = useMutation({
    mutationFn: async ({ hostname, status }: { hostname: string; status: boolean }) => {
      // HCI mode needs to call both setNodeStandBy and setNodeMaintenance
      if (isHCI) {
        await Promise.all([setNodeStandBy(hostname, status), setNodeMaintenance(hostname, status)]);
      } else {
        await setNodeStandBy(hostname, status);
      }
    },
    onSuccess: () => {
      api.success({
        title: t('vsan:standby_changed'),
      });

      nodesFromVSAN.refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        title: err?.message,
        description: err?.detail || err?.explanation,
        duration: 0,
      });
    },
  });

  const goToDetailPage = (node: string) => {
    if (isVSAN) {
      navigate(`/vsan/nodes/${node}`);
      return;
    }
    if (isHCI) {
      navigate(`/hci/inventory/nodes/${node}`);
      return;
    }
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
      logger.error('Error while setting standby', error);
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

  const mergedNodesData = React.useMemo(() => {
    const vsanNodes = nodesFromVSAN?.data?.data ?? [];
    const cloudNodes = cloudStackNodes?.data?.data ?? [];

    if (!isHCI || !cloudNodes.length) {
      return vsanNodes;
    }

    return vsanNodes.map((node: Node) => {
      const cloudNode: CloudStackNode | undefined = cloudNodes.find((cn: CloudStackNode) => cn.name === node.hostname);
      return {
        ...node,
        num_vms: cloudNode?.num_vms || 0,
      };
    });
  }, [nodesFromVSAN?.data?.data, cloudStackNodes?.data?.data, isHCI]);

  const columns: ColumnsType<Node> = [
    {
      title: t('storage_pool:node_name'),
      dataIndex: 'hostname',
      key: 'hostname',
      sorter: (a, b) => a.hostname.localeCompare(b.hostname),
      showSorterTooltip: false,
    },
    {
      title: t('node_detail:default_ip'),
      dataIndex: 'service_ip',
      key: 'service_ip',
      sorter: (a, b) => compareIPv4(a.service_ip, b.service_ip),
      showSorterTooltip: false,
    },
    ...(isHCI
      ? [
          {
            title: t('vsan:vm_count'),
            dataIndex: 'num_vms',
            key: 'num_vms',
            sorter: (a: { num_vms?: number }, b: { num_vms?: number }) => (a.num_vms || 0) - (b.num_vms || 0),
            showSorterTooltip: false,
            render: (num_vms: number) => num_vms || 0,
          },
        ]
      : []),
    {
      title: () => (
        <Popover
          placement="top"
          title={t('common:color_coding')}
          content={() => (
            <div>
              <p>
                <Tag tone="success">{t('vsan:online')}</Tag>: {t('vsan:online_hint')}
              </p>
              <p>
                <Tag tone="warning">{t('vsan:standby')}</Tag>: {t('vsan:standby_hint')}
              </p>
              <p>
                <Tag tone="danger">{t('vsan:error')}</Tag>: {t('vsan:error_hint')}
              </p>
            </div>
          )}
        >
          <span>
            {t('common:status')} &nbsp; <InfoCircleOutlined />
          </span>
        </Popover>
      ),
      dataIndex: 'address',
      key: 'online',
      render: (_, record) => {
        let tone: TagTone;
        let statusText: string;

        if (!record.online) {
          tone = 'danger';
          statusText = t('vsan:error');
        } else if (record.standby) {
          tone = 'warning';
          statusText = t('vsan:standby');
        } else {
          tone = 'success';
          statusText = t('vsan:online');
        }

        return (
          <>
            <Tag tone={tone}>{statusText}</Tag>
            {record.has_linstor_controller && <Tag tone="brand">{isHCI ? 'LINSTOR' : 'Controller'}</Tag>}
            {isHCI && record?.has_cloudstack_db && <Tag tone="info">CS Manager</Tag>}
            {isHCI && record?.has_cloudstack_nfs && <Tag tone="info">NFS</Tag>}
          </>
        );
      },
    },
    {
      title: () => (
        <Popover
          placement="top"
          content={() => (
            <p className="w-[300px]">
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
            loading={standByMutation.isPending && currentNode === record.hostname}
            checked={record.standby}
            onChange={(checked) => {
              handleStandby(record.hostname, checked);
            }}
          />
        );
      },
    },
    {
      title: t('common:action'),
      key: 'action',
      render: (_, record) => {
        const updating = updatingInfo[record.hostname]?.upgrading ?? false;
        const upgradeProcess = updatingInfo[record.hostname];
        const updateProcess = upgradeProcess?.progress;
        const progress = updateProcess?.maxSteps
          ? Math.round(((updateProcess.curStep ?? 0) / updateProcess.maxSteps) * 100)
          : 0;
        let updateError = false;

        let tooltip =
          updateProcess?.label === 'Downloading' || updateProcess?.label === 'Installing'
            ? `${updateProcess?.label}  ${updateProcess?.curStep} of ${updateProcess?.maxSteps}`
            : updateProcess?.label;

        const inProgress = updateProcess?.label === 'Downloading' || updateProcess?.label === 'Installing';
        let tagTone: TagTone = inProgress ? 'brand' : 'success';
        let strokeColor = inProgress ? cssVar('brand/accent') : cssVar('status/success');

        if (updateProcess?.label === 'Error') {
          tagTone = 'danger';
          strokeColor = cssVar('status/error');
          updateError = true;
          tooltip = updateProcess?.message ?? 'Update failed!';
        }

        return (
          <>
            <Space>
              <Button type="primary" onClick={() => goToDetailPage(record.hostname)}>
                View
              </Button>
              <Popconfirm
                title={t('common:update_node')}
                description={t('common:are_you_sure_you_want_update_node')}
                onConfirm={() => upgradeNode(record.hostname)}
              >
                <Button disabled={!record.standby} type="default" loading={updating}>
                  {t('vsan:update')}
                </Button>
              </Popconfirm>
            </Space>
            {updating && (
              <div className="mt-1.5">
                <Tooltip title={tooltip || ''}>
                  <Progress percent={progress} status="active" strokeColor={strokeColor} />
                  <Tag tone={tagTone}>{updateProcess?.label}</Tag>
                </Tooltip>
              </div>
            )}
            {updateError && (
              <div className="mt-1.5">
                <Tooltip title={tooltip || ''}>
                  <Tag tone="danger">{updateProcess?.label}</Tag>
                </Tooltip>
              </div>
            )}
          </>
        );
      },
    },
  ];

  return (
    <div>
      {contextHolder}
      <div className="mb-2.5 flex justify-between">
        <Space>
          <Button type="default" onClick={() => nodesFromVSAN.refetch()}>
            {t('common:reload')}
          </Button>

          <Button type="primary">
            <a
              href={
                IS_DEV
                  ? import.meta.env.VITE_HCI_VSAN_API_HOST + '/addnode.html'
                  : 'https://' + window.location.hostname + '/addnode.html'
              }
              target="_blank"
              rel="noreferrer"
            >
              {t('vsan:add_nodes')}
            </a>
          </Button>

          <Button danger type="default">
            <a
              href={
                IS_DEV
                  ? import.meta.env.VITE_HCI_VSAN_API_HOST + '/delnode.html'
                  : 'https://' + window.location.hostname + '/delnode.html'
              }
              target="_blank"
              rel="noreferrer"
            >
              {t('vsan:delete_nodes')}
            </a>
          </Button>
        </Space>

        <Button type="primary" shape="circle" icon={<SettingOutlined />} onClick={() => setIntervalModal(true)} />
      </div>

      <Table
        rowKey="hostname"
        columns={columns}
        dataSource={mergedNodesData}
        loading={nodesFromVSAN.isPending || (isHCI && cloudStackNodes.isPending)}
        pagination={false}
      />

      <Modal
        title={t('common:warning')}
        open={showStandbyWarning}
        onOk={() => doStandBy(standbyHost)}
        onCancel={() => setShowStandbyWarning(false)}
      >
        <p>{t('vsan:standby_warning_move')}</p>
        <p>{t('vsan:standby_warning_replicas')}</p>
        <p>{t('vsan:standby_warning_confirm')}</p>
      </Modal>

      <Modal
        title={t('common:refresh_interval')}
        open={intervalModal}
        onOk={() => {
          setRefetchInterval(tempIntervalVal);
          setIntervalModal(false);
        }}
        onCancel={() => setIntervalModal(false)}
      >
        <span>{t('common:refresh_interval')}</span>:{' '}
        <Space.Compact>
          <InputNumber
            defaultValue={refetchInterval ?? 60}
            value={tempIntervalVal}
            onChange={(val) => setTempIntervalVal(val)}
          />
          <Space.Addon>seconds</Space.Addon>
        </Space.Compact>
      </Modal>
    </div>
  );
};
