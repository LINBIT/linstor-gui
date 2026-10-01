// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMemo, useState } from 'react';
import { Form, Space, Table, Dropdown } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';
import { Link } from '@app/components/Link';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MoreOutlined } from '@ant-design/icons';

import { deleteRemote, getRemoteList, getBackup } from '../api';
import type { RemoteListResponse } from '../types';
import { SearchForm } from './styled';
import { CreateRemoteForm } from './CreateRemoteForm';
import { UIMode } from '@app/features/settings/types';
import { useUIMode } from '@app/features/settings/useSettings';
import { Popconfirm } from '@app/components/Popconfirm';
import { deletingRowClass, useDeleteAction } from '@app/hooks/useDeleteAction';
import { ActionColumnTitle } from '@app/components/ActionColumnTitle';

type RemoteQuery = {
  name?: string | null;
  type?: string | null;
};

/**
 * A row of the table: a remote of any kind (so every kind's fields are
 * optional), tagged with its kind and, for S3, its backup count.
 */
type RemoteRow = Partial<
  NonNullable<RemoteListResponse['s3_remotes']>[number] &
    NonNullable<RemoteListResponse['linstor_remotes']>[number] &
    NonNullable<RemoteListResponse['ebs_remotes']>[number]
> & {
  type: string;
  backup_count: number;
};

export const List = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const location = useLocation();

  const { t } = useTranslation(['remote', 'common']);

  const mode = useUIMode();

  const [query, setQuery] = useState<RemoteQuery>(() => {
    const query = new URLSearchParams(location.search);
    const name = query.get('name');
    const type = query.get('type');

    const queryO: RemoteQuery = {};

    if (name) {
      form.setFieldValue('name', name);
      queryO['name'] = name;
    }

    if (type) {
      form.setFieldValue('type', type);
      queryO['type'] = type;
    }

    return {
      name,
      type,
    };
  });

  // One fetch for every remote (with its S3 backup count); the search filters
  // the rows on screen instead of refetching.
  const {
    data: remotes,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ['getRemotes'],
    queryFn: async (): Promise<RemoteRow[]> => {
      const res = await getRemoteList();
      // The OpenAPI schema types this as an array; the controller answers an object.
      const remotes = res?.data as unknown as RemoteListResponse | undefined;

      const list = Object.keys(remotes || {})
        .map((key: string) => {
          const item = remotes?.[key as keyof RemoteListResponse] || [];

          return item.map((e) => ({
            ...e,
            type: key,
          }));
        })
        .flat();

      // fetch backup count for each remote
      return Promise.all(
        list.map(async (e) => {
          let count = 0;
          if (e.type === 's3_remotes') {
            try {
              const resB = await getBackup(e.remote_name ?? '');
              const lin = resB.data?.linstor || {};
              count = Object.keys(lin).length;
            } catch {
              count = 0;
            }
          }
          return { ...e, backup_count: count };
        }),
      );
    },
  });

  // Filter on the query state, which follows the URL: the form's watched
  // values are still empty on the first render, so a ?type=... or ?name=...
  // in the URL would not apply.
  const dataList = useMemo(
    () =>
      remotes?.filter((e) => (!query.type || e.type === query.type) && (!query.name || e.remote_name === query.name)),
    [remotes, query.type, query.name],
  );

  // s3_remotes linstor_remotes ebs_remotes

  // const s3_remotes = data?.data?.s3_remotes?.map((e) => ({
  //   name: e.remote_name,
  //   type: 'S3',
  //   // eu-central.http://192.168.123.123:9000/linstor
  //   info: `${e.region}.${e.endpoint}/${e.bucket}`,
  // }));

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const queryS = new URLSearchParams({});
    const newQuery: RemoteQuery = {};

    if (values.name) {
      newQuery.name = values.name;
      queryS.set('name', values.name);
    }

    if (values.type) {
      newQuery.type = values.type;
      queryS.set('type', values.type);
    }

    setQuery(newQuery);

    navigate(`${location.pathname}?${queryS.toString()}`);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});

    navigate(location.pathname);
  };

  const del = useDeleteAction<RemoteRow>({
    remove: (remote) => deleteRemote(remote.remote_name ?? ''),
    keyOf: (remote) => remote.remote_name ?? '',
    nameOf: (remote) => remote.remote_name ?? '',
    refresh: () => refetch(),
  });

  const columns: ColumnsType<RemoteRow> = [
    {
      title: t('remote:name'),
      key: 'remote_name',
      dataIndex: 'remote_name',
      sorter: (a, b) => (a.remote_name ?? '').localeCompare(b.remote_name ?? ''),
      showSorterTooltip: false,
    },
    {
      title: t('remote:type'),
      key: 'type',
      dataIndex: 'type',
    },
    {
      title: t('remote:Info'),
      key: 'info',
      render: (_text, record) =>
        record.type === 'linstor_remotes' ? (
          <span>{record.url}</span>
        ) : (
          <span>{`${record.region}.${record.endpoint}/${record.bucket}`}</span>
        ),
    },
    {
      title: t('remote:backup_count') || 'Backup Count',
      key: 'backup_count',
      dataIndex: 'backup_count',
      render: (count: number, record) => {
        if (record.type === 's3_remotes') {
          const backupUrl =
            mode === UIMode.HCI ? `/hci/remote/${record.remote_name}/backups` : `/remote/${record.remote_name}/backups`;

          return <Link to={backupUrl}>{count}</Link>;
        }
        return 'N/A';
      },
    },
    {
      title: () => <ActionColumnTitle />,
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (record, info) => {
        return (
          <Space size="small">
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'backups',
                    label: t('remote:backups'),
                    onClick: () => {
                      if (record.type === 's3_remotes') {
                        const url =
                          mode === UIMode.HCI
                            ? `/hci/remote/${record.remote_name}/backups`
                            : `/remote/${record.remote_name}/backups`;
                        navigate(url);
                      } else {
                        window.open(`${info.url}/ui/#!/storage-configuration/resources `);
                      }
                    },
                  },
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm title={t('remote:delete_remote_object')} onConfirm={() => del.run([record])}>
                        {t('common:delete')}
                      </Popconfirm>
                    ),
                  },
                ],
              }}
            >
              <MoreOutlined style={{ cursor: 'pointer', fontSize: 16 }} />
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
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Form.Item name="name" label={t('common:name')}>
            <Input placeholder={t('common:name')} />
          </Form.Item>

          <Form.Item name="type" label={t('remote:type')}>
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder={t('remote:select_type')}
              options={[
                {
                  label: 'ebs',
                  value: 'ebs_remotes',
                },
                {
                  label: 'LINSTOR',
                  value: 'linstor_remotes',
                },
                {
                  label: 's3',
                  value: 's3_remotes',
                },
              ]}
            />
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
        </Form>

        <CreateRemoteForm refetch={refetch} />
      </SearchForm>

      <br />

      <Table
        rowKey="remote_name"
        columns={columns}
        dataSource={dataList ?? []}
        pagination={{
          total: dataList?.length ?? 0,
          showSizeChanger: true,
          showTotal: (total) => t('common:total_items', { total }),
        }}
        loading={isPending}
        rowClassName={(record) => (del.isDeleting(record.remote_name ?? '') ? deletingRowClass : '')}
      />
    </>
  );
};
