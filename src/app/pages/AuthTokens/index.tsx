// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button as AntButton,
  Card,
  DatePicker,
  Dropdown,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

import Button from '@app/components/Button';
import service from '@app/requests';

dayjs.extend(utc);

const { Title } = Typography;

type AuthToken = {
  id: number;
  description: string;
  created_at: string;
  is_active: boolean;
  is_user_token: boolean;
  ip_filter?: string | null;
  expires_at?: string | null;
};

type AuthTokenListResponse = {
  count: number;
  list: AuthToken[];
};

type ApiCallRcEntry = {
  obj_refs?: {
    token?: string;
  };
};

type CreateTokenForm = {
  description: string;
  ip_filter?: string;
  expires_at?: Dayjs;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const parsed = dayjs.utc(value);

  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value;
};

const booleanText = (value: boolean) => (value ? 'Yes' : 'No');

const AuthTokens = () => {
  const { t } = useTranslation(['authToken', 'common']);
  const [form] = Form.useForm<CreateTokenForm>();
  const [allTokens, setAllTokens] = useState<AuthToken[]>([]);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [updatingTokenId, setUpdatingTokenId] = useState<number | null>(null);
  const [deletingTokenId, setDeletingTokenId] = useState<number | null>(null);

  const fetchTokens = async () => {
    setLoading(true);

    try {
      const response = await service.get<AuthTokenListResponse>('/v1/controller/auth/token');
      setAllTokens(response.data?.list ?? []);
    } catch (error) {
      message.error((error as Error)?.message || t('authToken:load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTokens();
    // Fetch once when opening the page. Refetches after mutations call fetchTokens directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tokens = showAllTokens ? allTokens : allTokens.filter((token) => token.is_user_token);

  const extractToken = (data?: ApiCallRcEntry[]) => {
    return data?.find((entry) => entry?.obj_refs?.token)?.obj_refs?.token?.trim() ?? null;
  };

  const handleCreateToken = async (values: CreateTokenForm) => {
    setCreating(true);

    try {
      const response = await service.post<ApiCallRcEntry[]>('/v1/controller/auth/token', {
        description: values.description.trim(),
        ...(values.ip_filter?.trim() ? { ip_filter: values.ip_filter.trim() } : {}),
        ...(values.expires_at ? { expires_at: values.expires_at.utc().toISOString() } : {}),
      });

      const token = extractToken(response.data);

      if (!token) {
        throw new Error(t('authToken:create_missing_token'));
      }

      setCreatedToken(token);
      setCreateOpen(false);
      form.resetFields();
      message.success(t('authToken:create_success'));
      await fetchTokens();
    } catch (error) {
      message.error((error as Error)?.message || t('authToken:create_failed'));
    } finally {
      setCreating(false);
    }
  };

  const handleSetActive = async (token: AuthToken, isActive: boolean) => {
    setUpdatingTokenId(token.id);

    try {
      await service.put(`/v1/controller/auth/token/${token.id}`, { is_active: isActive });
      message.success(isActive ? t('authToken:enable_success') : t('authToken:disable_success'));
      await fetchTokens();
    } catch (error) {
      message.error((error as Error)?.message || t('authToken:update_failed'));
    } finally {
      setUpdatingTokenId(null);
    }
  };

  const handleDelete = async (token: AuthToken) => {
    setDeletingTokenId(token.id);

    try {
      await service.delete(`/v1/controller/auth/token/${token.id}`);
      message.success(t('authToken:delete_success'));
      await fetchTokens();
    } catch (error) {
      message.error((error as Error)?.message || t('authToken:delete_failed'));
    } finally {
      setDeletingTokenId(null);
    }
  };

  const columns: ColumnsType<AuthToken> = [
    {
      title: t('authToken:id'),
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t('authToken:description'),
      dataIndex: 'description',
      render: (value: string) => value || '-',
    },
    {
      title: t('authToken:created'),
      dataIndex: 'created_at',
      render: formatDate,
    },
    {
      title: t('authToken:active'),
      dataIndex: 'is_active',
      render: (value: boolean) => <Tag color={value ? 'green' : 'red'}>{booleanText(value)}</Tag>,
      filters: [
        { text: 'Yes', value: true },
        { text: 'No', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: t('authToken:user_token'),
      dataIndex: 'is_user_token',
      render: (value: boolean) => booleanText(value),
    },
    {
      title: t('authToken:ip_filter'),
      dataIndex: 'ip_filter',
      render: (value?: string | null) => value || '-',
    },
    {
      title: t('authToken:expires'),
      dataIndex: 'expires_at',
      render: formatDate,
    },
    {
      title: t('common:action'),
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, token) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'toggle-active',
                label: token.is_active ? t('authToken:disable') : t('authToken:enable'),
                disabled: updatingTokenId === token.id || deletingTokenId === token.id,
                onClick: () => handleSetActive(token, !token.is_active),
              },
              {
                key: 'delete',
                disabled: updatingTokenId === token.id || deletingTokenId === token.id,
                label: (
                  <Popconfirm
                    title={t('authToken:delete_confirm')}
                    okText={t('authToken:delete')}
                    cancelText={t('authToken:cancel')}
                    onConfirm={() => handleDelete(token)}
                  >
                    <div className="w-full text-red-600">{t('authToken:delete')}</div>
                  </Popconfirm>
                ),
              },
            ],
          }}
        >
          <AntButton
            type="text"
            icon={<MoreOutlined />}
            loading={updatingTokenId === token.id || deletingTokenId === token.id}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            {t('authToken:title')}
          </Title>
        </div>

        <Space>
          <Space>
            <Switch checked={showAllTokens} onChange={setShowAllTokens} />
            <span>{t('authToken:show_all')}</span>
          </Space>

          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('authToken:create')}
          </Button>

          <Button onClick={fetchTokens} icon={<ReloadOutlined />} loading={loading}>
            {t('authToken:refresh')}
          </Button>
        </Space>
      </div>

      <Alert type="info" showIcon message={t('authToken:token_visibility_notice')} />

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tokens}
          loading={loading}
          pagination={{ showSizeChanger: true, showTotal: (total) => t('authToken:total_items', { total }) }}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title={t('authToken:create')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={creating}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateToken}>
          <Form.Item
            label={t('authToken:description')}
            name="description"
            rules={[{ required: true, message: t('authToken:description_required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label={t('authToken:ip_filter')} name="ip_filter" extra={t('authToken:ip_filter_help')}>
            <Input placeholder="192.168.123.10" />
          </Form.Item>

          <Form.Item label={t('authToken:expires')} name="expires_at" extra={t('authToken:expires_help')}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('authToken:created_token_title')}
        open={Boolean(createdToken)}
        onCancel={() => setCreatedToken(null)}
        onOk={() => setCreatedToken(null)}
        okText={t('authToken:close')}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Alert type="warning" showIcon message={t('authToken:created_token_notice')} />
        <Input.TextArea value={createdToken ?? ''} readOnly autoSize style={{ marginTop: 16 }} />
      </Modal>
    </Space>
  );
};

export default AuthTokens;
