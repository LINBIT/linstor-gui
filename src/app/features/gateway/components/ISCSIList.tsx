import React, { useState } from 'react';
import { Button, Form, Modal, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';

import { ISCSIResource } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { SizeInput } from '@app/components/SizeInput';

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

  const { addingVolume } = useSelector((state: RootState) => ({
    addingVolume: state.loading.effects.iscsi.addLUN,
  }));

  const [form] = Form.useForm<FormType>();

  const dataWithChildren = list.map((item) => {
    return {
      ...item,
      children: item.volumes
        .filter((v) => v?.number && v?.number > 1)
        .map((volume) => {
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

  console.log(dataWithChildren, 'dataWithChildren');

  const columns: TableProps<
    ISCSIResource &
      ISCSIOperationStatus & {
        isChild?: boolean;
      }
  >['columns'] = [
    {
      title: 'IQN',
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
      title: 'On Node',
      key: 'node',
      render: (_, item) => {
        return <span>{item?.status?.primary}</span>;
      },
    },
    {
      title: 'Service IP',
      dataIndex: 'service_ips',
      key: 'service_ips',
      render: (_, item) => {
        return <span>{item?.service_ips?.join(',')}</span>;
      },
    },
    {
      title: 'Resource Group',
      dataIndex: 'resource_group',
      key: 'resource_group',
    },
    {
      title: 'Service State',
      dataIndex: 'service_state',
      render: (_, item) => {
        const isStarted = item?.status?.service === 'Started';
        return <Tag color={isStarted ? SUCCESS_COLOR : ERROR_COLOR}>{item?.status?.service}</Tag>;
      },
    },
    {
      title: 'LUN',
      dataIndex: 'lun',
      key: 'lun',
      render: (_, item) => {
        return <span>{item?.volumes?.[1]?.number}</span>;
      },
    },
    {
      title: 'LINSTOR State',
      dataIndex: 'linstor_state',
      render: (_, item) => {
        const isOk = item?.status?.state === 'OK';
        return <Tag color={isOk ? SUCCESS_COLOR : ERROR_COLOR}>{item?.status?.state}</Tag>;
      },
      align: 'center',
    },
    {
      title: 'Action',
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
                    {record.starting && 'Starting...'}
                    {record.stopping && 'Stopping...'}
                    {!record.starting && !record.stopping && isStarted && 'Stop'}
                    {!record.starting && !record.stopping && !isStarted && 'Start'}
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
                    {record.deleting ? 'Deleting...' : 'Delete'}
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
                  {addingVolume ? 'Adding Volume' : 'Add Volume'}
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
                    Delete Volume
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
      <Table columns={columns as any} dataSource={dataWithChildren ?? []} rowKey="iqn" />
      <Modal
        title="Add volume"
        open={lunModal}
        onOk={handleOk}
        onCancel={() => setLunModal(false)}
        okText="Confirm"
        width={600}
        okButtonProps={{
          loading: addingVolume,
        }}
      >
        <Form<FormType> size="large" form={form}>
          <Form.Item label="Size" name="size" required>
            <SizeInput defaultUnit="GiB" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
