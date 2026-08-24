// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { Alert, Dropdown, Form, Space, Table, Tag } from 'antd';
import { Popconfirm } from '@app/components/Popconfirm';
import type { TableProps } from 'antd';
import { DownOutlined, MoreOutlined, RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/Button';
import { Input } from '@app/components/Input';
import { Link } from '@app/components/Link';
import { SearchForm } from '@app/components/SearchForm';
import { SupportStatus } from '@app/components/SupportStatus';
import { formatBytes } from '@app/utils/size';

import { NFSResource } from '../types';
import { ExportBasePath } from '../const';

type NFSListProps = {
  list: NFSResource[];
  handleDelete: (name: string) => void;
  handleStart: (name: string) => void;
  handleStop: (name: string) => void;
  onCreate?: () => void;
  loading?: boolean;
};

type NFSOperationStatus = {
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};

type VolumeData = {
  key: string;
  number: number;
  size_kib?: number;
  file_system?: string;
  export_path?: string;
  full_export_path: string;
  state?: string;
};

export const NFSList = ({ list, handleDelete, handleStop, handleStart, onCreate, loading = false }: NFSListProps) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [form] = Form.useForm<{ name: string }>();
  const { t } = useTranslation(['common', 'nfs']);

  // Auto-expand first row when list is loaded (only once)
  useEffect(() => {
    if (!initialized && list && list.length > 0) {
      const firstName = list[0].name;
      if (firstName) {
        setExpandedRowKeys([firstName]);
      }
      setInitialized(true);
    }
  }, [list, initialized]);

  // The gateway list is small and already fully loaded, so filtering is
  // client-side, unlike the query-backed inventory lists.
  const filteredList = (list ?? []).filter(
    (item) => !nameFilter || (item.name ?? '').toLowerCase().includes(nameFilter.toLowerCase()),
  );

  const handleSearch = () => {
    setNameFilter(form.getFieldValue('name') ?? '');
  };

  const handleReset = () => {
    form.resetFields();
    setNameFilter('');
  };

  const hasSelected = selectedRowKeys.length > 0;

  const handleDeleteBulk = () => {
    selectedRowKeys.forEach((key) => {
      handleDelete(String(key));
    });
    setSelectedRowKeys([]);
  };

  const columns: TableProps<NFSResource & NFSOperationStatus>['columns'] = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('common:node'),
      key: 'node',
      render: (_, item) => {
        const nodeName = item?.status?.primary;
        if (!nodeName) return <span>-</span>;
        return <Link to={`/inventory/nodes/${nodeName}`}>{nodeName}</Link>;
      },
    },
    {
      title: t('nfs:service_ip'),
      dataIndex: 'service_ip',
      key: 'service_ip',
      render: (_, item) => {
        const ip = item?.service_ip;
        if (Array.isArray(ip)) {
          return <pre style={{ margin: 0 }}>{ip.join(', ')}</pre>;
        }
        return <span>{ip || '-'}</span>;
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
      title: t('nfs:implementation'),
      dataIndex: 'implementation',
      key: 'implementation',
      align: 'center',
      render: (_, item) => {
        const isGanesha = item.implementation === 'ganesha';
        return <Tag>{isGanesha ? t('nfs:implementation_ganesha') : t('nfs:implementation_kernel')}</Tag>;
      },
    },
    {
      title: t('nfs:volumes'),
      dataIndex: 'volumes',
      key: 'volumes',
      render: (_, item) => {
        const count = item.volumes?.filter((v) => v?.number !== undefined && v.number > 0).length || 0;
        return <span>{count}</span>;
      },
    },
    {
      title: t('nfs:service_state'),
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
      title: t('nfs:linstor_state'),
      dataIndex: 'linstor_state',
      render: (_, item) => {
        const isOk = item?.status?.state === 'OK';
        return (
          <>
            <SupportStatus supported={isOk} />
            <span style={{ marginLeft: 4 }}>{item?.status?.state}</span>
          </>
        );
      },
      align: 'center',
    },
    {
      title: t('common:action'),
      key: 'action',
      width: 80,
      align: 'center',
      render: (_text, record) => {
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
                        title={`Are you sure to ${isStarted ? 'stop' : 'start'} this export?`}
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() => {
                          if (record.name) {
                            if (isStarted) {
                              handleStop(record.name);
                            } else {
                              handleStart(record.name);
                            }
                          }
                        }}
                      >
                        <div className="w-full">{isStarted ? t('common:stop') : t('common:start')}</div>
                      </Popconfirm>
                    ),
                  },
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm
                        key="delete"
                        title="Are you sure to delete this export?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() => {
                          if (record.name) {
                            handleDelete(record.name);
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
      title: t('nfs:volume_number'),
      dataIndex: 'number',
      key: 'number',
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
      title: t('nfs:file_system'),
      dataIndex: 'file_system',
      key: 'file_system',
      width: 120,
      render: (file_system) => file_system || '-',
    },
    {
      title: t('nfs:export_path'),
      dataIndex: 'full_export_path',
      key: 'full_export_path',
      width: 300,
      render: (full_export_path) => <code>{full_export_path}</code>,
    },
    {
      title: t('nfs:linstor_state'),
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
  ];

  // Get volumes for an NFS resource (excluding volume 0 which is metadata)
  const getVolumesForResource = (item: NFSResource): VolumeData[] => {
    return (
      item.volumes
        ?.filter((v) => v?.number !== undefined && v.number > 0)
        ?.map((volume) => {
          const exportPathSuffix = (volume as any)?.export_path || '';
          return {
            key: `${item.name}-${volume.number}`,
            number: volume.number!,
            size_kib: volume.size_kib,
            file_system: (volume as any)?.file_system,
            export_path: exportPathSuffix,
            full_export_path: `${ExportBasePath}/${item.name}${exportPathSuffix}`,
            state: item.status?.volumes?.find((v) => v.number === volume.number)?.state,
          };
        }) || []
    );
  };

  // Expanded row render function
  const expandedRowRender = (record: NFSResource) => {
    const volumes = getVolumesForResource(record);

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

  return (
    <div>
      <SearchForm>
        <Form form={form} name="nfs_list_form" layout="inline">
          <Form.Item name="name" label={t('common:name')}>
            <Input placeholder={t('common:name')} />
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
                title="Delete exports"
                description="Are you sure to delete the selected exports?"
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

      <Alert message={t('nfs:only_one_resource_note')} type="warning" showIcon style={{ marginBottom: 24 }} />
      <Table<NFSResource & NFSOperationStatus>
        bordered={false}
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        scroll={{ x: 960 }}
        rowKey="name"
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
    </div>
  );
};
