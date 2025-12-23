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

import { ISCSIResource } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { SizeInput } from '@app/components/SizeInput';
import { useTranslation } from 'react-i18next';
import { formatBytes } from '@app/utils/size';

type ISCSIListProps = {
  list: ISCSIResource[];
  handleDelete: (iqn: string) => void;
  handleStart: (iqn: string) => void;
  handleStop: (iqn: string) => void;
  handleDeleteVolume: (iqn: string, lun: number) => void;
  handleAddVolume: (iqn: string, LUN: number, size_kib: number) => void;
  loading?: boolean;
};

type ISCSIOperationStatus = {
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
  iqn: string;
};

export const ISCSIList = ({
  list,
  handleDelete,
  handleStop,
  handleStart,
  handleAddVolume,
  handleDeleteVolume,
  loading = false,
}: ISCSIListProps) => {
  const [lunModal, setLunModal] = useState(false);
  const [IQN, setIQN] = useState('');
  const [LUN, setLUN] = useState(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const { t } = useTranslation(['common', 'iscsi']);

  const { addingVolume } = useSelector((state: RootState) => ({
    addingVolume: state.loading.effects.iscsi.addLUN,
  }));

  const [form] = Form.useForm<FormType>();

  // Main table columns (Target level)
  const columns: TableProps<ISCSIResource & ISCSIOperationStatus>['columns'] = [
    {
      title: t('iscsi:iqn'),
      dataIndex: 'iqn',
      key: 'iqn',
      render: (iqn) => <span>{iqn}</span>,
    },
    {
      title: t('iscsi:on_node'),
      key: 'node',
      render: (_, item) => {
        const nodeName = item?.status?.primary;
        if (!nodeName) return <span>-</span>;
        return <Link to={`/inventory/nodes/${nodeName}`}>{nodeName}</Link>;
      },
    },
    {
      title: t('iscsi:service_ips'),
      dataIndex: 'service_ips',
      key: 'service_ips',
      render: (_, item) => {
        return <pre style={{ margin: 0 }}>{item?.service_ips?.join(', ')}</pre>;
      },
    },
    {
      title: t('iscsi:resource_group'),
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
      title: t('iscsi:service_state'),
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
                if (record.iqn) {
                  if (isStarted) {
                    handleStop(record.iqn);
                  } else {
                    handleStart(record.iqn);
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
                if (record?.volumes) {
                  setIQN(record.iqn);
                  setLUN((record?.volumes?.[record?.volumes?.length - 1]?.number ?? 1) + 1);
                  setLunModal(true);
                }
              }}
              loading={addingVolume}
            >
              {addingVolume ? t('iscsi:adding_volume') : t('iscsi:add_volume')}
            </Button>
            <Popconfirm
              title="Are you sure to delete this target?"
              onConfirm={() => {
                if (record.iqn) {
                  handleDelete(record.iqn);
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
      title: t('iscsi:linstor_state'),
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
            if (record.iqn && record.lunId) {
              handleDeleteVolume(record.iqn, record.lunId);
            }
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button danger size="small">
            {t('iscsi:delete_volume')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Get volumes for a target (excluding volume 0 which is metadata)
  const getVolumesForTarget = useMemo(() => {
    return (item: ISCSIResource): VolumeData[] => {
      return (
        item.volumes
          ?.filter((v) => v?.number !== undefined && v.number > 0)
          ?.map((volume) => ({
            key: `${item.iqn}-${volume.number}`,
            lunId: volume.number!,
            size_kib: volume.size_kib,
            state: item.status?.volumes?.find((v) => v.number === volume.number)?.state,
            iqn: item.iqn,
          })) || []
      );
    };
  }, []);

  // Expanded row render function
  const expandedRowRender = (record: ISCSIResource) => {
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
    handleAddVolume(IQN, LUN, size);
    setLunModal(false);
    form.resetFields();
  };

  return (
    <div>
      <Table<ISCSIResource & ISCSIOperationStatus>
        columns={columns}
        dataSource={list ?? []}
        rowKey="iqn"
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
        title={t('iscsi:add_volume')}
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
