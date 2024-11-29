// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Modal, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';

import { ISCSIResource } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { SizeInput } from '@app/components/SizeInput';
import { useTranslation } from 'react-i18next';

type ISCSIListProps = {
  list: ISCSIResource[];
  handleDelete: (iqn: string) => void;
  handleStart: (iqn: string) => void;
  handleStop: (iqn: string) => void;
  handleDeleteVolume: (iqn: string, lun: number) => void;
  handleAddVolume: (iqn: string, LUN: number, size_kib: number) => void;
};

type ISCSIOperationStatus = {
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};

type FormType = {
  size: number;
};

export const ISCSIList = ({
  list,
  handleDelete,
  handleStop,
  handleStart,
  handleAddVolume,
  handleDeleteVolume,
}: ISCSIListProps) => {
  const [lunModal, setLunModal] = useState(false);
  const [IQN, setIQN] = useState('');
  const [LUN, setLUN] = useState(0);
  const { t } = useTranslation(['common', 'iscsi']);

  const { addingVolume } = useSelector((state: RootState) => ({
    addingVolume: state.loading.effects.iscsi.addLUN,
  }));

  const [form] = Form.useForm<FormType>();

  const dataWithChildren = list.map((item) => {
    return {
      ...item,
      children: item.volumes
        ?.filter((v) => v?.number && v?.number > 1)
        ?.map((volume) => {
          return {
            iqn: item.iqn,
            ...volume,
            key: volume.number,
            status: {
              state: item.status?.volumes?.find((v) => v.number === volume.number)?.state,
              service: item.status?.service,
            },
            volumes: [
              {},
              {
                number: volume.number,
              },
            ],
            isChild: true,
          };
        }),
    };
  });

  const columns: TableProps<
    ISCSIResource &
      ISCSIOperationStatus & {
        isChild?: boolean;
      }
  >['columns'] = [
    {
      title: t('iscsi:iqn'),
      dataIndex: 'iqn',
      key: 'iqn',
      render: (iqn, record) => {
        if (record.isChild) {
          return null;
        }
        return <span>{iqn}</span>;
      },
    },
    {
      title: t('iscsi:on_node'),
      key: 'node',
      render: (_, item) => {
        return <span>{item?.status?.primary}</span>;
      },
    },
    {
      title: t('iscsi:service_ips'),
      dataIndex: 'service_ips',
      key: 'service_ips',
      render: (_, item) => {
        return <pre>{item?.service_ips?.join(',')}</pre>;
      },
    },
    {
      title: t('iscsi:resource_group'),
      dataIndex: 'resource_group',
      key: 'resource_group',
    },
    {
      title: t('iscsi:service_state'),
      dataIndex: 'service_state',
      render: (_, item) => {
        const isStarted = item?.status?.service === 'Started';
        return <Tag color={isStarted ? SUCCESS_COLOR : ERROR_COLOR}>{item?.status?.service}</Tag>;
      },
    },
    {
      title: t('iscsi:lun'),
      dataIndex: 'lun',
      key: 'lun',
      render: (_, item) => {
        return <span>{item?.volumes?.[1]?.number}</span>;
      },
    },
    {
      title: t('iscsi:linstor_state'),
      dataIndex: 'linstor_state',
      render: (_, item) => {
        const isOk = item?.status?.state === 'OK';
        return <Tag color={isOk ? SUCCESS_COLOR : ERROR_COLOR}>{item?.status?.state}</Tag>;
      },
      align: 'center',
    },
    {
      title: t('common:action'),
      key: 'action',
      render: (text, record) => {
        const isChild = record?.isChild;
        const isStarted = record?.status?.service === 'Started';

        return (
          <Space size="middle">
            {!isChild ? (
              <>
                <Popconfirm
                  title={`Are you sure to ${isStarted ? 'stop' : 'start'} this target?`}
                  onConfirm={() => {
                    if (record.iqn) {
                      isStarted ? handleStop(record.iqn) : handleStart(record.iqn);
                    }
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger loading={record.starting || record.stopping}>
                    {record.starting && t('common:starting')}
                    {record.stopping && t('common:stopping')}
                    {!record.starting && !record.stopping && isStarted && t('common:stop')}
                    {!record.starting && !record.stopping && !isStarted && t('common:start')}
                  </Button>
                </Popconfirm>
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
                  <Button type="primary" danger loading={record.deleting}>
                    {record.deleting ? t('common:deleting') : t('common:delete')}
                  </Button>
                </Popconfirm>
                <Button
                  type="primary"
                  onClick={() => {
                    if (record?.volumes) {
                      setIQN(record.iqn);
                      setLUN((record?.volumes?.[record?.volumes?.length - 1]?.number ?? 1) + 1); // TODO: LUN number should be dynamic
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
                    if (record.iqn && record?.volumes?.[1]?.number) {
                      handleDeleteVolume(record.iqn, record?.volumes?.[1]?.number);
                    }
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="primary" danger loading={record.deleting}>
                    {record.deleting ? t('common:deleting') : t('iscsi:delete_volume')}
                  </Button>
                </Popconfirm>
              </>
            ) : (
              <Popconfirm
                title="Are you sure to delete this volume?"
                onConfirm={() => {
                  if (record.iqn && record?.volumes?.[1]?.number) {
                    handleDeleteVolume(record.iqn, record?.volumes?.[1]?.number);
                  }
                }}
                okText="Yes"
                cancelText="No"
              >
                <Button type="primary" danger>
                  Delete Volume
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const handleOk = () => {
    const size = form.getFieldValue('size');
    handleAddVolume(IQN, LUN, size);
    setLunModal(false);
    form.resetFields();
  };

  return (
    <div>
      <Table columns={columns as any} dataSource={dataWithChildren ?? []} rowKey="iqn" scroll={{ x: 960 }} />
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
