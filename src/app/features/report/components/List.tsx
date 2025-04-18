// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { Button, Form, Space, Table, Tag, DatePicker, Select, Popconfirm, Dropdown, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { deleteReport, deleteReportBulk, getErrorReports } from '../api';
import { ErrorReport, ErrorReportDeleteRangeRequest, GetErrorReportRequestQuery } from '../types';
import { formatTime, getTime } from '@app/utils/time';
import { useNodes } from '@app/features/node';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import styled from '@emotion/styled';
import { MoreOutlined } from '@ant-design/icons';
import { LiaToolsSolid } from 'react-icons/lia';
import DownloadSOS from './DownloadSOS';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;

const SearchItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const getId = (report: ErrorReport) => {
  return report?.filename?.replace('ErrorReport-', '').replace('.log', '') || '';
};

export const List = () => {
  const [form] = Form.useForm();
  const { t } = useTranslation(['error_report', 'common']);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [displayData, setDisplayData] = useState<ErrorReport[]>([]);
  const nodes = useNodes();

  const navigate = useNavigate();
  const location = useLocation();

  const { vsanModeFromSetting } = useSelector((state: RootState) => ({
    vsanModeFromSetting: state.setting.vsanMode,
  }));

  const [query, setQuery] = useState({});

  const module = Form.useWatch('module', form);

  const { data, refetch, isLoading } = useQuery(['getErrors', query], () => {
    return getErrorReports(query);
  });

  const deleteErrorMutation = useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: () => {
      refetch();
    },
  });

  const deleteErrorBulkMutation = useMutation({
    mutationFn: (query: ErrorReportDeleteRangeRequest) => deleteReportBulk(query),
    onSuccess: () => {
      refetch();
    },
  });

  useEffect(() => {
    let displayData = data?.data
      ?.map((item) => ({
        ...item,
        id: getId(item),
      }))
      .reverse();

    if (module) {
      displayData = data?.data
        ?.map((item) => ({
          ...item,
          id: getId(item),
        }))
        .reverse()
        .filter((e) => e.module === module);
    }

    setDisplayData(displayData as any);
  }, [module, data?.data]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const newQuery: GetErrorReportRequestQuery = {};

    if (values.node) {
      newQuery.node = values.node;
    }

    if (values.range) {
      newQuery.since = getTime(values.range[0]);
      newQuery.to = getTime(values.range[1]);
    }

    const query = new URLSearchParams(newQuery);

    const new_url = `${location.pathname}?${query.toString()}`;

    navigate(new_url);

    setQuery(newQuery);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
  };

  const handleDelete = (id: string) => {
    deleteErrorMutation.mutate(id);
  };

  // handle click on view button
  const handleView = (id: string) => {
    navigate(`/error-reports/${id}`);
  };

  const columns: TableProps<ErrorReport>['columns'] = [
    {
      title: t('error_report:id'),
      key: 'id',
      dataIndex: 'id',
      render: (id, record) => {
        return (
          <Button
            type="link"
            onClick={() => {
              handleView(getId(record));
            }}
          >
            {id}
          </Button>
        );
      },
    },
    {
      title: t('error_report:time'),
      key: 'time',
      render: (_, record) => <span>{formatTime(record.error_time)}</span>,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.error_time - b.error_time,
      showSorterTooltip: false,
    },
    {
      title: t('common:node'),
      key: 'node_name',
      dataIndex: 'node_name',
      render: (node_name) => {
        return (
          <Button
            type="link"
            onClick={() => {
              const url = vsanModeFromSetting ? '/vsan/nodes' : '/inventory/nodes';
              navigate(`${url}/${node_name}`);
            }}
          >
            {node_name}
          </Button>
        );
      },
    },
    {
      title: t('error_report:module'),
      key: 'module',
      dataIndex: 'module',
      render: (_, { module }) => <Tag color={module === 'SATELLITE' ? 'cyan' : 'geekblue'}>{module}</Tag>,
    },
    {
      title: t('error_report:content'),
      dataIndex: 'exception_message',
      key: 'exception_message',
      render: (_, { exception, exception_message }) => (
        <div>
          <p>{exception_message}</p>
          <Tag color="red">{exception}</Tag>
        </div>
      ),
    },
    {
      title: () => (
        <Tooltip title={t('common:action')}>
          <span className="flex justify-center">
            <LiaToolsSolid className="w-4 h-4" />
          </span>
        </Tooltip>
      ),
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: t('common:view'),
                  onClick: () => handleView(getId(record)),
                },
                {
                  key: 'delete',
                  label: (
                    <Popconfirm
                      key="delete"
                      title="Delete the error report"
                      description="Are you sure to delete this error report?"
                      okText="Yes"
                      cancelText="No"
                      onConfirm={() => {
                        handleDelete(getId(record));
                      }}
                    >
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
      ),
    },
  ];

  const handleDeleteBulk = () => {
    const ids = selectedRowKeys.map((item) => (item as string).replace('ErrorReport-', '').replace('.log', ''));

    deleteErrorBulkMutation.mutate({
      ids,
    });
  };

  const modules = [
    {
      text: 'Satellite',
      value: 'SATELLITE',
    },
    {
      text: 'Controller',
      value: 'CONTROLLER',
    },
  ];

  return (
    <>
      <SearchItem>
        <Form form={form} name="error_report" layout="inline">
          <Form.Item name="node" label={t('common:node')}>
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder="Please select node"
              options={nodes?.data?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="module" label={t('error_report:module')}>
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder="Please select module"
              options={modules.map((e) => ({
                label: e.text,
                value: e.value,
              }))}
            />
          </Form.Item>

          <Form.Item name="range" label={t('error_report:time_range')}>
            <RangePicker />
          </Form.Item>

          <Form.Item>
            <Space size="small">
              <Button type="default" onClick={handleReset}>
                {t('common:reset')}
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  handleSearch();
                }}
              >
                {t('common:search')}
              </Button>
              {hasSelected && (
                <Popconfirm
                  key="delete"
                  title="Delete the error reports"
                  description="Are you sure to delete selected error reports?"
                  okText="Yes"
                  cancelText="No"
                  onConfirm={handleDeleteBulk}
                >
                  <Button danger>{t('common:delete')}</Button>
                </Popconfirm>
              )}
            </Space>
          </Form.Item>
        </Form>

        <DownloadSOS />
      </SearchItem>

      <br />

      <Table
        columns={columns}
        dataSource={displayData}
        rowSelection={rowSelection}
        rowKey={(item) => item?.filename || ''}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        loading={isLoading}
        scroll={{ x: 'max-content' }}
      />
    </>
  );
};
