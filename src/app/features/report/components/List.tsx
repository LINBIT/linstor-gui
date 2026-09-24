// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useMemo, useState } from 'react';
import { Form, Space, Table, Tag, DatePicker, Dropdown, Tooltip } from 'antd';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';
import { Link } from '@app/components/Link';
import type { TableProps } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import { useMutation, useQuery } from '@tanstack/react-query';
import { deleteReport, deleteReportBulk, getErrorReportPage, getErrorReports } from '../api';
import {
  ErrorReport,
  ErrorReportDeleteRangeRequest,
  ErrorReportPageQuery,
  ErrorReportSortField,
  GetErrorReportRequestQuery,
} from '../types';
import { formatTime } from '@app/utils/time';
import dayjs from 'dayjs';
import { useNodes } from '@app/features/node';
import { useLinstorVersion, MIN_API_VERSION } from '@app/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import styled from '@emotion/styled';
import { MoreOutlined } from '@ant-design/icons';
import { LiaToolsSolid } from 'react-icons/lia';
import DownloadSOS from './DownloadSOS';
import { useTranslation } from 'react-i18next';
import { UIMode } from '@app/models/setting';
import { Popconfirm } from '@app/components/Popconfirm';

const { RangePicker } = DatePicker;

const SearchItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 16px;
`;

const getId = (report: ErrorReport) => {
  return report?.filename?.replace('ErrorReport-', '').replace('.log', '') || '';
};

type Filters = { node?: string; since?: number; to?: number };
type Sort = { sort_by: ErrorReportSortField; sort_order: 'asc' | 'desc' };

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT: Sort = { sort_by: 'error_time', sort_order: 'desc' };

// Table column key -> the field the controller sorts by.
const SORT_FIELDS: Record<string, ErrorReportSortField> = {
  id: 'filename',
  time: 'error_time',
  node_name: 'node_name',
  module: 'module',
  exception_message: 'exception_message',
};

export const List = () => {
  const [form] = Form.useForm();
  const { t } = useTranslation(['error_report', 'common']);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const nodes = useNodes();

  const navigate = useNavigate();
  const location = useLocation();

  const { vsanModeFromSetting, hciModeFromSetting } = useSelector((state: RootState) => ({
    vsanModeFromSetting: state.setting.mode === UIMode.VSAN,
    hciModeFromSetting: state.setting.mode === UIMode.HCI,
  }));

  // From REST 1.30.0 the controller pages, sorts and filters the merged reports
  // of all nodes itself. Older controllers can only hand over every report, so
  // the browser does it — including the time range, because they compared
  // since/to against a local-time stamp that did not line up with error_time.
  const { isFetched: versionFetched, hasMinVersion } = useLinstorVersion();
  const serverPaging = versionFetched && hasMinVersion(MIN_API_VERSION.ERROR_REPORT_PAGING);

  const [filters, setFilters] = useState<Filters>(() => {
    const params = new URLSearchParams(location.search);
    const node = params.get('node') ?? undefined;
    const since = params.get('since');
    const to = params.get('to');
    const initial: Filters = {};

    if (node) {
      form.setFieldValue('node', node);
      initial.node = node;
    }
    if (since && to) {
      form.setFieldValue('range', [dayjs(Number(since)), dayjs(Number(to))]);
      initial.since = Number(since);
      initial.to = Number(to);
    }

    return initial;
  });

  const module = Form.useWatch('module', form) as ErrorReportPageQuery['module'] | undefined;

  const [page, setPage] = useState({ current: 1, pageSize: DEFAULT_PAGE_SIZE });
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);

  const firstPage = () => setPage((prev) => (prev.current === 1 ? prev : { ...prev, current: 1 }));

  // A new module narrows the result, so the current page may no longer exist.
  useEffect(() => {
    setPage((prev) => (prev.current === 1 ? prev : { ...prev, current: 1 }));
  }, [module]);

  const legacyQuery: GetErrorReportRequestQuery = filters.node ? { node: filters.node } : {};
  const legacy = useQuery(['getErrors', legacyQuery], () => getErrorReports(legacyQuery), {
    // Wait for the version, or every visit would first pull the full list.
    enabled: versionFetched && !serverPaging,
  });

  const pageQuery: ErrorReportPageQuery = {
    ...(filters.node && { node: [filters.node] }),
    ...(module && { module }),
    ...(filters.since != null && filters.to != null && { since: filters.since, to: filters.to }),
    limit: page.pageSize,
    offset: (page.current - 1) * page.pageSize,
    sort_by: sort.sort_by,
    sort_order: sort.sort_order,
  };
  const paged = useQuery(['viewErrorReports', pageQuery], () => getErrorReportPage(pageQuery), {
    enabled: serverPaging,
    keepPreviousData: true,
  });

  // The controller leaves `items` out of an empty page.
  const pageItems = paged.data?.data?.items ?? [];
  const pageTotal = paged.data?.data?.total ?? 0;

  // Deleting the last reports of the last page leaves it empty: go to the page
  // that is now last instead of showing nothing.
  useEffect(() => {
    if (!serverPaging || !paged.data?.data) return;
    if (pageItems.length === 0 && pageTotal > 0) {
      setPage((prev) => (prev.current > 1 ? { ...prev, current: Math.ceil(pageTotal / prev.pageSize) } : prev));
    }
  }, [serverPaging, paged.data, pageItems.length, pageTotal]);

  const legacyData = useMemo(() => {
    let rows = [...(legacy.data?.data ?? [])].reverse();

    if (module) {
      rows = rows.filter((e) => e.module === module);
    }

    const { since, to } = filters;
    if (since != null && to != null) {
      rows = rows.filter((e) => e.error_time >= since && e.error_time <= to);
    }

    return rows;
  }, [legacy.data?.data, module, filters]);

  const refetch = () => (serverPaging ? paged.refetch() : legacy.refetch());

  const deleteErrorMutation = useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: () => {
      refetch();
    },
  });

  const deleteErrorBulkMutation = useMutation({
    mutationFn: (query: ErrorReportDeleteRangeRequest) => deleteReportBulk(query),
    onSuccess: () => {
      // The deleted reports must not stay selected, or Delete stays enabled for
      // reports that no longer exist.
      setSelectedRowKeys([]);
      refetch();
    },
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
    // Keep the selection of other pages when paging on the controller.
    preserveSelectedRowKeys: true,
  };

  const hasSelected = selectedRowKeys.length > 0;

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const next: Filters = {};

    if (values.node) {
      next.node = values.node;
    }

    if (values.range) {
      // The picker is date-only, so cover the full span: start of the first day to
      // end of the last day. This makes selecting a single day match that whole day.
      next.since = dayjs(values.range[0]).startOf('day').valueOf();
      next.to = dayjs(values.range[1]).endOf('day').valueOf();
    }

    const params = new URLSearchParams();

    if (next.node) {
      params.set('node', next.node);
    }
    if (next.since) {
      params.set('since', next.since.toString());
    }
    if (next.to) {
      params.set('to', next.to.toString());
    }

    navigate(`${location.pathname}?${params.toString()}`);

    setFilters(next);
    firstPage();
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    firstPage();
    navigate(location.pathname);
  };

  const handleDelete = (id: string) => {
    deleteErrorMutation.mutate(id);
  };

  const handleView = (id: string) => {
    const url = vsanModeFromSetting
      ? `/vsan/error-reports/${id}`
      : hciModeFromSetting
        ? `/hci/error-reports/${id}`
        : `/error-reports/${id}`;
    navigate(url);
  };

  // Sorting on the controller: which column is sorted, and how, is state here.
  const serverSorter = (key: string): Partial<NonNullable<TableProps<ErrorReport>['columns']>[number]> => {
    if (!serverPaging) return {};
    const sorted = SORT_FIELDS[key] === sort.sort_by;
    const sortOrder: SortOrder = sorted ? (sort.sort_order === 'asc' ? 'ascend' : 'descend') : null;
    return { sorter: true, sortOrder, showSorterTooltip: false };
  };

  const handleTableChange: TableProps<ErrorReport>['onChange'] = (pagination, _filters, sorter) => {
    if (!serverPaging) return;

    const column = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = column?.order ? SORT_FIELDS[String(column.columnKey)] : undefined;
    // Clearing a column's sort falls back to newest first.
    const nextSort: Sort = field
      ? { sort_by: field, sort_order: column.order === 'ascend' ? 'asc' : 'desc' }
      : DEFAULT_SORT;
    const sortChanged = nextSort.sort_by !== sort.sort_by || nextSort.sort_order !== sort.sort_order;
    const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;

    setSort(nextSort);
    // A new order or page size makes the old page number meaningless.
    setPage({
      current: sortChanged || pageSize !== page.pageSize ? 1 : (pagination.current ?? 1),
      pageSize,
    });
  };

  const columns: TableProps<ErrorReport>['columns'] = [
    {
      title: t('error_report:id'),
      key: 'id',
      render: (_, record) => {
        const reportId = getId(record);
        const url = vsanModeFromSetting
          ? `/vsan/error-reports/${reportId}`
          : hciModeFromSetting
            ? `/hci/error-reports/${reportId}`
            : `/error-reports/${reportId}`;

        return <Link to={url}>{reportId}</Link>;
      },
      ...serverSorter('id'),
    },
    {
      title: t('error_report:time'),
      key: 'time',
      render: (_, record) => <span>{formatTime(record.error_time)}</span>,
      ...(serverPaging
        ? // Starts out newest first, so the first click goes to oldest first.
          { ...serverSorter('time'), sortDirections: ['descend', 'ascend'] as SortOrder[] }
        : {
            defaultSortOrder: 'descend' as const,
            sorter: (a: ErrorReport, b: ErrorReport) => a.error_time - b.error_time,
            showSorterTooltip: false,
          }),
    },
    {
      title: t('common:node'),
      key: 'node_name',
      dataIndex: 'node_name',
      render: (node_name) => {
        const baseUrl = vsanModeFromSetting ? '/vsan/nodes' : hciModeFromSetting ? '/hci/nodes' : '/inventory/nodes';

        const nodeUrl = `${baseUrl}/${node_name}`;

        return <Link to={nodeUrl}>{node_name}</Link>;
      },
      ...serverSorter('node_name'),
    },
    {
      title: t('error_report:module'),
      key: 'module',
      dataIndex: 'module',
      render: (_, { module }) => <Tag color={module === 'SATELLITE' ? 'cyan' : 'geekblue'}>{module}</Tag>,
      ...serverSorter('module'),
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
      ...serverSorter('exception_message'),
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
                      title={t('error_report:delete_error_report')}
                      description={t('error_report:are_you_sure_delete_error_report')}
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
            <MoreOutlined style={{ cursor: 'pointer', fontSize: 16 }} />
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

  const showTotal = (total: number) => t('common:total_items', { total });

  return (
    <>
      <SearchItem>
        <Form
          form={form}
          name="error_report"
          layout="inline"
          style={{
            gap: '8px 16px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Form.Item name="node" label={t('common:node')} style={{ marginBottom: '0' }}>
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder={t('error_report:please_select_node')}
              options={nodes?.data?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="module" label={t('error_report:module')} style={{ marginBottom: '0' }}>
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder={t('error_report:please_select_module')}
              options={modules.map((e) => ({
                label: e.text,
                value: e.value,
              }))}
            />
          </Form.Item>

          <Form.Item name="range" label={t('error_report:time_range')} style={{ marginBottom: '0' }}>
            <RangePicker />
          </Form.Item>

          <Form.Item style={{ marginBottom: '0' }}>
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

              <Popconfirm
                key="delete"
                title={t('error_report:delete_error_reports')}
                description={t('error_report:are_you_sure_delete_selected_error')}
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

        <DownloadSOS />
      </SearchItem>

      <br />

      <Table
        columns={columns}
        dataSource={serverPaging ? pageItems : legacyData}
        rowSelection={rowSelection}
        rowKey={(item) => item?.filename || ''}
        onChange={handleTableChange}
        pagination={
          serverPaging
            ? { current: page.current, pageSize: page.pageSize, total: pageTotal, showSizeChanger: true, showTotal }
            : { showSizeChanger: true, showTotal }
        }
        loading={!versionFetched || (serverPaging ? paged.isFetching : legacy.isLoading)}
        scroll={{ x: 'max-content' }}
      />
    </>
  );
};
