import React, { useState } from 'react';
import { Button, Form, Space, Table, Tag, DatePicker, Select, Popconfirm } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { deleteReport, deleteReportBulk, getErrorReports } from '../api';
import { ErrorReport, ErrorReportDeleteRangeRequest, GetErrorReportRequestQuery } from '../types';
import { formatTime, getTime } from '@app/utils/time';
import { useNodes } from '@app/features/node';
import { useHistory } from 'react-router-dom';

const { RangePicker } = DatePicker;

const getId = (report: ErrorReport) => {
  return report?.filename?.replace('ErrorReport-', '').replace('.log', '') || '';
};

export const List = () => {
  const [form] = Form.useForm();
  const [query, setQuery] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const nodes = useNodes();

  const history = useHistory();

  const { data, refetch } = useQuery(['getErrors', query], () => {
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

  const displayData = data?.data
    ?.map((item) => ({
      ...item,
      id: getId(item),
    }))
    .reverse();

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
    history.push(`/error-reports/${id}`);
  };

  const columns: TableProps<ErrorReport>['columns'] = [
    {
      title: 'ID',
      key: 'id',
      dataIndex: 'id',
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => <span>{formatTime(record.error_time)}</span>,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.error_time - b.error_time,
    },
    {
      title: 'Node',
      key: 'node_name',
      dataIndex: 'node_name',
    },
    {
      title: 'Module',
      key: 'module',
      dataIndex: 'module',
      filters: [
        {
          text: 'Satellite',
          value: 'SATELLITE',
        },
        {
          text: 'Controller',
          value: 'CONTROLLER',
        },
      ],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onFilter: (value: string, record) => record.module?.indexOf(value) === 0,
      render: (_, { module }) => <Tag color={module === 'SATELLITE' ? 'cyan' : 'geekblue'}>{module}</Tag>,
    },
    {
      title: 'Content',
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
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" onClick={() => handleView(getId(record))}>
            View
          </Button>
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
            <Button danger>Delete</Button>
          </Popconfirm>
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

  return (
    <>
      <Form form={form} name="error_report" layout="inline">
        <Form.Item name="node" label="Node">
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

        <Form.Item name="range" label="Time range">
          <RangePicker />
        </Form.Item>

        <Form.Item>
          <Space size="small">
            <Button type="default" onClick={handleReset}>
              Reset
            </Button>
            <Button
              type="primary"
              onClick={() => {
                handleSearch();
              }}
            >
              Search
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
                <Button danger>Delete</Button>
              </Popconfirm>
            )}
          </Space>
        </Form.Item>
      </Form>

      <br />

      <Table
        columns={columns}
        dataSource={displayData}
        rowSelection={rowSelection}
        rowKey={(item) => item?.filename || ''}
      />
    </>
  );
};
