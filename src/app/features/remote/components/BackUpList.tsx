// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMemo, useState } from 'react';
import { Form, Space, Table, Dropdown } from 'antd';
import { Input } from '@app/components/Input';
import { Button } from '@app/components/Button';
import type { TableProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircleFilled, CloseCircleFilled, MoreOutlined } from '@ant-design/icons';

import { deleteBackup, getBackup } from '../api';
import { SearchForm } from './styled';
import { formatTime } from '@app/utils/time';
import { CreateBackupForm } from './CreateBackupForm';
import { Popconfirm } from '@app/components/Popconfirm';
import { deletingRowClass, useDeleteAction } from '@app/hooks/useDeleteAction';
import { ActionColumnTitle } from '@app/components/ActionColumnTitle';

type RemoteQuery = {
  origin_rsc?: string | null;
};

interface BackupItem {
  id: string;
  start_time?: string;
  start_timestamp?: number;
  finished_time: string;
  finished_timestamp: number;
  origin_rsc: string;
  origin_snap: string;
  success: boolean;
  shipping: boolean;
}

export const List = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const location = useLocation();

  const { remote_name } = useParams<{ remote_name: string }>();

  const { t } = useTranslation(['remote', 'common']);

  const [query, setQuery] = useState<RemoteQuery>(() => {
    const query = new URLSearchParams(location.search);
    const origin_rsc = query.get('origin_rsc');

    const queryO: RemoteQuery = {};

    if (origin_rsc) {
      form.setFieldValue('origin_rsc', origin_rsc);
      queryO['origin_rsc'] = origin_rsc;
    }

    return {
      origin_rsc,
    };
  });

  // One fetch per remote; the search filters the rows on screen.
  const {
    data: backups,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ['getBackup', remote_name],
    queryFn: async () => {
      const res = await getBackup(remote_name ?? '');
      return Object.values(res.data?.linstor || {}).filter((item) => item != null) as BackupItem[];
    },
  });

  const dataList = useMemo(
    () => backups?.filter((e) => !query.origin_rsc || e.origin_rsc === query.origin_rsc),
    [backups, query.origin_rsc],
  );

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const queryS = new URLSearchParams({});
    const newQuery: RemoteQuery = {};

    if (values.origin_rsc) {
      newQuery.origin_rsc = values.origin_rsc;
      queryS.set('origin_rsc', values.origin_rsc);
    }

    setQuery(newQuery);

    navigate(`${location.pathname}?${queryS.toString()}`);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});

    navigate(location.pathname);
  };

  const del = useDeleteAction<BackupItem>({
    remove: (backup) => deleteBackup(remote_name ?? '', { timestamp: backup.finished_time }),
    keyOf: (backup) => backup.id,
    nameOf: (backup) => backup.origin_snap,
    refresh: () => refetch(),
  });

  const columns: TableProps<BackupItem>['columns'] = [
    {
      title: <span>Resource</span>,
      key: 'resource',
      dataIndex: 'origin_rsc',
      sorter: (a, b) => {
        if (a.origin_rsc && b.origin_rsc) {
          return a.origin_rsc.localeCompare(b.origin_rsc);
        } else {
          return 0;
        }
      },
      showSorterTooltip: false,
    },
    {
      title: 'Snapshot',
      key: 'snapshot',
      dataIndex: 'origin_snap',
    },
    {
      title: 'Finished At',
      key: 'finished_at',
      dataIndex: 'finished_timestamp',
      render: (finished_timestamp) => {
        return <span>{formatTime(finished_timestamp)}</span>;
      },
      sorter: (a, b) => {
        if (a.finished_timestamp && b.finished_timestamp) {
          return a.finished_timestamp - b.finished_timestamp;
        } else {
          return 0;
        }
      },
      showSorterTooltip: false,
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'success',
      render: (success, record) => {
        if (record?.shipping) {
          return (
            <div>
              <span style={{ color: 'orange', fontWeight: 500 }}>{t('common:creating')}</span>
            </div>
          );
        }
        return (
          <div>
            {success ? (
              <CheckCircleFilled style={{ color: 'green', fontSize: '16px' }} />
            ) : (
              <CloseCircleFilled style={{ color: 'grey', fontSize: '16px' }} />
            )}{' '}
            <span>{success ? t('common:success') : t('common:failed')}</span>
          </div>
        );
      },
    },
    {
      title: () => <ActionColumnTitle />,
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (record) => {
        return (
          <Space size="small">
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm title={t('remote:delete_backup')} onConfirm={() => del.run([record])}>
                        {t('common:delete')}
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

  return (
    <>
      <SearchForm>
        <Form
          form={form}
          name="storage_pool_search"
          layout="inline"
          initialValues={{
            show_default: true,
          }}
        >
          <Form.Item name="origin_rsc" label={t('common:resource')}>
            <Input placeholder={t('common:resource')} />
          </Form.Item>

          <Form.Item>
            <Space size="small">
              <Button
                type="primary"
                onClick={() => {
                  handleSearch();
                }}
              >
                {t('common:search')}
              </Button>
              <Button type="secondary" onClick={handleReset}>
                {t('common:reset')}
              </Button>
            </Space>
          </Form.Item>

          <Form.Item style={{ marginLeft: 'auto', marginRight: 0 }}>
            <CreateBackupForm refetch={refetch} />
          </Form.Item>
        </Form>
      </SearchForm>

      <br />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={dataList ?? []}
        pagination={{
          total: dataList?.length ?? 0,
          showSizeChanger: true,
          showTotal: (total) => t('common:total_items', { total }),
        }}
        loading={isPending}
        rowClassName={(record) => (del.isDeleting(record.id) ? deletingRowClass : '')}
      />
    </>
  );
};
