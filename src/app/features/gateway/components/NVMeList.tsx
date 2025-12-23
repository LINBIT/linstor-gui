// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState, useMemo } from 'react';
import { Form, Modal, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';
import { Button } from '@app/components/Button';
import { Link } from '@app/components/Link';
import { formatBytes } from '@app/utils/size';

import { NVMEOFResource } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { SizeInput } from '@app/components/SizeInput';
import { useTranslation } from 'react-i18next';

type NVMeListProps = {
  list: NVMEOFResource[];
  handleDelete: (nqn: string) => void;
  handleStart: (nqn: string) => void;
  handleStop: (nqn: string) => void;
  handleDeleteVolume: (nqn: string, lun: number) => void;
  handleAddVolume: (nqn: string, LUN: number, size_kib: number) => void;
  loading?: boolean;
};

type NVMeOperationStatus = {
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};

type FormType = {
  size: number;
};

type VolumeData = {
  key: string;
  lunId: number;
  size_kib?: number;
  state?: string;
  nqn: string;
};

export const NVMeList = ({
  list,
  handleDelete,
  handleStop,
  handleStart,
  handleAddVolume,
  handleDeleteVolume,
  loading = false,
}: NVMeListProps) => {
  const [lunModal, setLunModal] = useState(false);
  const [NQN, setNQN] = useState('');
  const [LUN, setLUN] = useState(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const { t } = useTranslation(['common', 'nvme']);

  const { addingVolume } = useSelector((state: RootState) => ({
    addingVolume: state.loading.effects.nvme.addLUN,
  }));

  const [form] = Form.useForm<FormType>();

  // Main table columns (Target level)
  const columns: TableProps<NVMEOFResource & NVMeOperationStatus>['columns'] = [
    {
      title: t('nvme:nqn'),
      dataIndex: 'nqn',
      key: 'nqn',
      render: (nqn) => <span>{nqn}</span>,
    },
    {
      title: t('nvme:on_node'),
      key: 'node',
      render: (_, item) => {
        const nodeName = item?.status?.primary;
        if (!nodeName) return <span>-</span>;
        return <Link to={`/inventory/nodes/${nodeName}`}>{nodeName}</Link>;
      },
    },
    {
      title: t('nvme:service_ip'),
      dataIndex: 'service_ip',
      key: 'service_ip',
      render: (service_ip) => <span>{service_ip || '-'}</span>,
    },
    {
      title: t('nvme:resource_group'),
      dataIndex: 'resource_group',
      key: 'resource_group',
      render: (resource_group) => {
        if (!resource_group) return <span>-</span>;
        return (
          <Link to={`/storage-configuration/resource-groups?resource_groups=${resource_group}`}>{resource_group}</Link>
        );
      },
    },
    {
      title: t('nvme:service_state'),
      dataIndex: 'service_state',
      align: 'center',
      render: (_, item) => {
        const isStarted = item?.status?.service === 'Started';
        return <Tag color={isStarted ? SUCCESS_COLOR : ERROR_COLOR}>{item?.status?.service}</Tag>;
      },
    },
    {
      title: t('common:action'),
      key: 'action',
      render: (_, record) => {
        const isStarted = record?.status?.service === 'Started';

        return (
          <Space size="small">
            <Popconfirm
              title={`Are you sure to ${isStarted ? 'stop' : 'start'} this target?`}
              onConfirm={() => {
                if (record.nqn) {
                  if (isStarted) {
                    handleStop(record.nqn);
                  } else {
                    handleStart(record.nqn);
                  }
                }
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button type="secondary" size="small" loading={record.starting || record.stopping}>
                {record.starting && t('common:starting')}
                {record.stopping && t('common:stopping')}
                {!record.starting && !record.stopping && isStarted && t('common:stop')}
                {!record.starting && !record.stopping && !isStarted && t('common:start')}
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                if (record?.volumes && record.nqn) {
                  setNQN(record.nqn);
                  setLUN((record?.volumes?.[record?.volumes?.length - 1]?.number ?? 1) + 1);
                  setLunModal(true);
                }
              }}
              loading={addingVolume}
            >
              {addingVolume ? t('nvme:adding_volume') : t('nvme:add_volume')}
            </Button>
            <Popconfirm
              title="Are you sure to delete this target?"
              onConfirm={() => {
                if (record.nqn) {
                  handleDelete(record.nqn);
                }
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button danger size="small" loading={record.deleting}>
                {record.deleting ? t('common:deleting') : t('common:delete')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // Volume sub-table columns
  const volumeColumns: TableProps<VolumeData>['columns'] = [
    {
      title: 'LUN',
      dataIndex: 'lunId',
      key: 'lunId',
      width: 100,
    },
    {
      title: t('common:size'),
      dataIndex: 'size_kib',
      key: 'size_kib',
      width: 120,
      render: (size_kib) => (size_kib ? formatBytes(size_kib) : '-'),
    },
    {
      title: t('nvme:linstor_state'),
      dataIndex: 'state',
      key: 'state',
      width: 150,
      align: 'center',
      render: (state) => {
        const isOk = state === 'OK';
        return <Tag color={isOk ? SUCCESS_COLOR : ERROR_COLOR}>{state || 'Unknown'}</Tag>;
      },
    },
    {
      title: t('common:action'),
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Popconfirm
          title="Are you sure to delete this volume?"
          onConfirm={() => {
            if (record.nqn && record.lunId) {
              handleDeleteVolume(record.nqn, record.lunId);
            }
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button danger size="small">
            {t('nvme:delete_volume')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Get volumes for a target (excluding volume 0 which is metadata)
  const getVolumesForTarget = useMemo(() => {
    return (item: NVMEOFResource): VolumeData[] => {
      return (
        item.volumes
          ?.filter((v) => v?.number !== undefined && v.number > 0)
          ?.map((volume) => ({
            key: `${item.nqn}-${volume.number}`,
            lunId: volume.number!,
            size_kib: volume.size_kib,
            state: item.status?.volumes?.find((v) => v.number === volume.number)?.state,
            nqn: item.nqn || '',
          })) || []
      );
    };
  }, []);

  // Expanded row render function
  const expandedRowRender = (record: NVMEOFResource) => {
    const volumes = getVolumesForTarget(record);

    return (
      <div
        style={{
          background: '#fafafa',
          padding: '16px',
          margin: '-8px -8px -8px 24px',
          borderRadius: '4px',
        }}
      >
        <Table<VolumeData>
          columns={volumeColumns}
          dataSource={volumes}
          pagination={false}
          size="small"
          rowKey="key"
          style={{ background: 'white' }}
        />
      </div>
    );
  };

  // Custom expand icon
  const expandIcon = ({ expanded, onExpand, record }: any) => {
    const hasVolumes = record.volumes && record.volumes.filter((v: any) => v?.number > 0).length > 0;

    if (!hasVolumes) {
      return <span style={{ width: 24, display: 'inline-block' }} />;
    }

    return expanded ? (
      <DownOutlined
        style={{ cursor: 'pointer', marginRight: 8, color: '#1890ff' }}
        onClick={(e) => onExpand(record, e)}
      />
    ) : (
      <RightOutlined
        style={{ cursor: 'pointer', marginRight: 8, color: '#1890ff' }}
        onClick={(e) => onExpand(record, e)}
      />
    );
  };

  const handleOk = () => {
    const size = form.getFieldValue('size');
    handleAddVolume(NQN, LUN, size);
    setLunModal(false);
    form.resetFields();
  };

  return (
    <div>
      <Table<NVMEOFResource & NVMeOperationStatus>
        columns={columns}
        dataSource={list ?? []}
        rowKey="nqn"
        scroll={{ x: 960 }}
        loading={loading}
        expandable={{
          expandedRowRender,
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
          expandIcon,
          rowExpandable: (record) =>
            !!(record.volumes && record.volumes.filter((v) => v?.number !== undefined && v.number > 0).length > 0),
        }}
      />
      <Modal
        title={t('nvme:add_volume')}
        open={lunModal}
        onOk={handleOk}
        onCancel={() => setLunModal(false)}
        okText={t('common:confirm')}
        cancelText={t('common:cancel')}
        width={600}
        okButtonProps={{
          loading: addingVolume,
        }}
      >
        <Form<FormType> size="large" form={form}>
          <Form.Item label={t('common:size')} name="size" required>
            <SizeInput defaultUnit="GiB" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
