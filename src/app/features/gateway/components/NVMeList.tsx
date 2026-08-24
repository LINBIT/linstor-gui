// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useMemo } from 'react';
import { Dropdown, Form, Modal, Space, Table } from 'antd';
import { Popconfirm } from '@app/components/Popconfirm';
import type { TableProps } from 'antd';
import { DownOutlined, MoreOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from '@app/components/Button';
import { Input } from '@app/components/Input';
import { Link } from '@app/components/Link';
import { SearchForm } from '@app/components/SearchForm';
import { SupportStatus } from '@app/components/SupportStatus';
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
  onCreate?: () => void;
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
  onCreate,
  loading = false,
}: NVMeListProps) => {
  const [lunModal, setLunModal] = useState(false);
  const [NQN, setNQN] = useState('');
  const [LUN, setLUN] = useState(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const { t } = useTranslation(['common', 'nvme']);

  const { addingVolume } = useSelector((state: RootState) => ({
    addingVolume: state.loading.effects.nvme.addLUN,
  }));

  const [form] = Form.useForm<FormType>();
  const [searchForm] = Form.useForm<{ name: string }>();

  // The gateway list is small and already fully loaded, so filtering is
  // client-side, unlike the query-backed inventory lists.
  const filteredList = (list ?? []).filter(
    (item) => !nameFilter || (item.nqn ?? '').toLowerCase().includes(nameFilter.toLowerCase()),
  );

  const handleSearch = () => {
    setNameFilter(searchForm.getFieldValue('name') ?? '');
  };

  const handleReset = () => {
    searchForm.resetFields();
    setNameFilter('');
  };

  const hasSelected = selectedRowKeys.length > 0;

  const handleDeleteBulk = () => {
    selectedRowKeys.forEach((key) => {
      handleDelete(String(key));
    });
    setSelectedRowKeys([]);
  };

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
        return (
          <>
            <SupportStatus supported={isStarted} />
            <span style={{ marginLeft: 4 }}>{item?.status?.service}</span>
          </>
        );
      },
    },
    {
      title: t('common:action'),
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const isStarted = record?.status?.service === 'Started';

        return (
          <Space size="small">
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'startstop',
                    label: (
                      <Popconfirm
                        key="startstop"
                        title={`Are you sure to ${isStarted ? 'stop' : 'start'} this target?`}
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() => {
                          if (record.nqn) {
                            if (isStarted) {
                              handleStop(record.nqn);
                            } else {
                              handleStart(record.nqn);
                            }
                          }
                        }}
                      >
                        <div className="w-full">{isStarted ? t('common:stop') : t('common:start')}</div>
                      </Popconfirm>
                    ),
                  },
                  {
                    key: 'add_volume',
                    label: t('nvme:add_volume'),
                    onClick: () => {
                      if (record?.volumes && record.nqn) {
                        setNQN(record.nqn);
                        setLUN((record?.volumes?.[record?.volumes?.length - 1]?.number ?? 1) + 1);
                        setLunModal(true);
                      }
                    },
                  },
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm
                        key="delete"
                        title="Are you sure to delete this target?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() => {
                          if (record.nqn) {
                            handleDelete(record.nqn);
                          }
                        }}
                      >
                        <div className="w-full text-red-600">{t('common:delete')}</div>
                      </Popconfirm>
                    ),
                  },
                ],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
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
        return (
          <>
            <SupportStatus supported={isOk} />
            <span style={{ marginLeft: 4 }}>{state || 'Unknown'}</span>
          </>
        );
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
          background: 'var(--bg-surface)',
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
          style={{ background: 'var(--bg-page)' }}
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
      <SearchForm>
        <Form form={searchForm} name="nvme_list_form" layout="inline">
          <Form.Item name="name" label={t('common:name')}>
            <Input placeholder={t('nvme:nqn')} />
          </Form.Item>

          <Form.Item>
            <Space size="small">
              <Button type="primary" onClick={handleSearch}>
                {t('common:search')}
              </Button>

              <Button type="secondary" onClick={handleReset}>
                {t('common:reset')}
              </Button>

              <Popconfirm
                key="delete"
                title="Delete targets"
                description="Are you sure to delete the selected targets?"
                okText="Yes"
                cancelText="No"
                onConfirm={handleDeleteBulk}
                disabled={!hasSelected}
              >
                <Button danger disabled={!hasSelected}>
                  {t('common:delete')}
                </Button>
              </Popconfirm>
            </Space>
          </Form.Item>
        </Form>

        {onCreate && (
          <Button type="primary" onClick={onCreate}>
            + {t('common:add')}
          </Button>
        )}
      </SearchForm>

      <br />

      <Table<NVMEOFResource & NVMeOperationStatus>
        columns={columns}
        dataSource={filteredList}
        rowKey="nqn"
        scroll={{ x: 960 }}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        expandable={{
          expandedRowRender,
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
          expandIcon,
          rowExpandable: (record) =>
            !!(record.volumes && record.volumes.filter((v) => v?.number !== undefined && v.number > 0).length > 0),
        }}
      />
      <Modal title={t('nvme:add_volume')} open={lunModal} onCancel={() => setLunModal(false)} width={600} footer={null}>
        <Form<FormType> size="large" form={form}>
          <Form.Item label={t('common:size')} name="size" required>
            <SizeInput defaultUnit="GiB" />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setLunModal(false)}>{t('common:cancel')}</Button>
              <Button type="primary" onClick={handleOk} loading={addingVolume}>
                {t('common:confirm')}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
