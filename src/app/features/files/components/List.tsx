// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState, useMemo, useRef } from 'react';
import { Space, Table, Dropdown, Modal, Spin, message } from 'antd';
import { Tag } from '@app/components/Tag';
import { Select } from '@app/components/Select';
import { Input } from '@app/components/Input';
import type { TableProps } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeOutlined, MoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';
import { Link } from '@app/components/Link';
import {
  useFiles,
  useDeployFile,
  useUndeployFile,
  useCreateOrUpdateFile,
  useResourceDefinitions,
  ExternalFile,
} from '../';
import { deleteFile, getFile } from '../api';
import { uniqId } from '@app/utils/stringUtils';
import { Popconfirm } from '@app/components/Popconfirm';
import { Switch } from '@app/components/Switch';
import { deletingRowClass, useDeleteAction } from '@app/hooks/useDeleteAction';
import { UIMode } from '@app/features/settings/types';
import { useUIMode } from '@app/features/settings/useSettings';

const DRBD_REACTOR_CONFIG_PREFIX = '/etc/drbd-reactor.d/';

export const List = () => {
  const { t } = useTranslation(['files', 'common']);
  const mode = useUIMode();
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [showReactorFiles, setShowReactorFiles] = useState(false);
  const [modifyFilePath, setModifyFilePath] = useState<string | null>(null);
  const [modifyContent, setModifyContent] = useState('');
  const [modifyLoading, setModifyLoading] = useState(false);
  // Counts the openings of the modify dialog: a read that comes back after its
  // dialog was closed, or another file was opened, is dropped, or it would put
  // that file's content under the open one's path.
  const modifyRequest = useRef(0);

  const { data: files, refetch, isPending } = useFiles(false);
  const { data: resourceDefinitions, isPending: rdLoading } = useResourceDefinitions();

  // Get file with content for the modal
  const { data: fileContent, isPending: contentLoading } = useQuery({
    queryKey: ['fileContent', selectedFilePath],
    queryFn: () => getFile(selectedFilePath || ''),
    enabled: !!selectedFilePath,
  });

  // Filter resource definitions that already have this file deployed
  // A file is deployed to a resource if props["files/{filePath}"] exists
  // One file can only belong to one RD, so we show only RDs that don't have this file yet
  const availableResources = useMemo(() => {
    if (!resourceDefinitions?.data || !selectedFilePath) return [];
    const fileKey = `files${selectedFilePath}`;
    return resourceDefinitions.data.filter((rd: { props?: Record<string, string> }) => !rd.props?.[fileKey]);
  }, [resourceDefinitions?.data, selectedFilePath]);

  const queryClient = useQueryClient();

  const deployMutation = useDeployFile();
  const undeployMutation = useUndeployFile();
  const createOrUpdateMutation = useCreateOrUpdateFile();

  const filteredFiles = useMemo(() => {
    const list = files?.data ?? [];

    if (showReactorFiles) {
      return list;
    }

    return list.filter((file) => !file.path?.startsWith(DRBD_REACTOR_CONFIG_PREFIX));
  }, [files?.data, showReactorFiles]);

  const del = useDeleteAction<ExternalFile>({
    remove: (file) => deleteFile(file.path ?? ''),
    keyOf: (file) => file.path ?? '',
    nameOf: (file) => file.path ?? '',
    refresh: () => refetch(),
  });

  const handleViewContent = (record: ExternalFile) => {
    if (record.path) {
      setSelectedFilePath(record.path);
      setShowContentModal(true);
    }
  };

  const handleDeploy = (record: ExternalFile) => {
    if (record.path) {
      setSelectedFilePath(record.path);
      setShowDeployModal(true);
    }
  };

  const handleDeployConfirm = () => {
    if (selectedFilePath && selectedResource) {
      deployMutation.mutate(
        { resource: selectedResource, extFileName: selectedFilePath },
        {
          onSuccess: () => {
            message.success(t('deploy_success'));
            setShowDeployModal(false);
            setSelectedFilePath(null);
            setSelectedResource(null);
            queryClient.invalidateQueries({ queryKey: ['resourceDefinitions'] });
          },
          onError: (error: unknown) => {
            // Check if it's already deployed error
            const errorMsg = (error as { message?: string } | undefined)?.message || '';
            if (errorMsg.includes('already') || errorMsg.includes('exists')) {
              message.error(t('already_deployed'));
            } else {
              message.error(t('deploy_failed'));
            }
          },
        },
      );
    }
  };

  const handleUndeploy = (record: ExternalFile) => {
    const deployedRd = getDeployedResource(record.path);

    if (!record.path || !deployedRd) {
      return;
    }

    undeployMutation.mutate(
      { resource: deployedRd, extFileName: record.path },
      {
        onSuccess: () => {
          message.success(t('undeploy_success'));
          queryClient.invalidateQueries({ queryKey: ['resourceDefinitions'] });
        },
        onError: () => {
          message.error(t('undeploy_failed'));
        },
      },
    );
  };

  const handleModify = async (record: ExternalFile) => {
    if (!record.path) {
      return;
    }

    const request = ++modifyRequest.current;
    setModifyLoading(true);
    setModifyFilePath(record.path);
    setModifyContent('');
    setShowModifyModal(true);

    try {
      const response = await getFile(record.path);
      if (request !== modifyRequest.current) return;
      setModifyContent(decodeContent(response?.data?.content));
    } catch {
      if (request !== modifyRequest.current) return;
      message.error(t('load_content_failed'));
      setShowModifyModal(false);
      setModifyFilePath(null);
    } finally {
      if (request === modifyRequest.current) setModifyLoading(false);
    }
  };

  const handleModifyConfirm = () => {
    if (!modifyFilePath) {
      return;
    }

    createOrUpdateMutation.mutate(
      {
        extFileName: modifyFilePath,
        body: {
          path: modifyFilePath,
          content: btoa(modifyContent),
        },
      },
      {
        onSuccess: () => {
          message.success(t('modify_success'));
          setShowModifyModal(false);
          setModifyFilePath(null);
          setModifyContent('');
          refetch();
        },
        onError: () => {
          message.error(t('modify_failed'));
        },
      },
    );
  };

  // Check which resource this file is already deployed to
  const getDeployedResource = (filePath: string | undefined): string | null => {
    if (!filePath || !resourceDefinitions?.data) return null;
    const fileKey = `files${filePath}`;
    const rd = resourceDefinitions.data.find((r: { props?: Record<string, string> }) => r.props?.[fileKey]);
    return rd?.name || null;
  };

  const columns: TableProps<ExternalFile>['columns'] = [
    {
      title: t('path'),
      key: 'path',
      dataIndex: 'path',
      render: (text, record) => (
        <Tag>
          {text}
          <EyeOutlined className="ml-2 cursor-pointer text-(--text-link)" onClick={() => handleViewContent(record)} />
        </Tag>
      ),
    },
    {
      title: t('deployed_to'),
      key: 'deployed_to',
      render: (_, record) => {
        const deployedRd = getDeployedResource(record.path);
        return deployedRd ? <Tag tone="highlight">{deployedRd}</Tag> : <Tag tone="neutral">{t('not_deployed')}</Tag>;
      },
    },
    {
      title: t('common:action'),
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record) => {
        const deployedRd = getDeployedResource(record.path);
        return (
          <Space size="small">
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'view',
                    label: t('view_content'),
                    onClick: () => handleViewContent(record),
                  },
                  ...(deployedRd
                    ? [
                        {
                          key: 'undeploy',
                          label: (
                            <Popconfirm
                              key="undeploy"
                              title={t('undeploy_confirm', { name: record.path, resource: deployedRd })}
                              okText={t('common:yes')}
                              cancelText={t('common:no')}
                              onConfirm={() => handleUndeploy(record)}
                            >
                              <div className="w-full">{t('undeploy')}</div>
                            </Popconfirm>
                          ),
                        },
                      ]
                    : [
                        {
                          key: 'deploy',
                          label: t('deploy'),
                          onClick: () => handleDeploy(record),
                        },
                      ]),
                  {
                    key: 'modify',
                    label: t('modify'),
                    onClick: () => handleModify(record),
                  },
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm
                        key="delete"
                        title={t('delete_confirm', { name: record.path })}
                        okText={t('common:yes')}
                        cancelText={t('common:no')}
                        onConfirm={() => (record.path ? del.run([record]) : undefined)}
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

  const decodeContent = (content: string | undefined) => {
    if (!content) return '';
    try {
      return atob(content);
    } catch {
      return content;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link type="primary" to={mode === UIMode.HCI ? '/hci/files/create' : '/files/create'}>
          + {t('add_file')}
        </Link>

        <Space>
          <span>{t('show_reactor_files')}</span>
          <Switch aria-label={t('show_reactor_files')} checked={showReactorFiles} onChange={setShowReactorFiles} />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredFiles}
        rowKey={(item) => item.path ?? uniqId()}
        loading={isPending}
        rowClassName={(record) => (record.path && del.isDeleting(record.path) ? deletingRowClass : '')}
        pagination={{
          total: filteredFiles.length,
          showTotal: (total) => t('common:total_items', { total }),
        }}
      />

      <Modal
        title={t('modify_file')}
        open={showModifyModal}
        onCancel={() => {
          modifyRequest.current++;
          setShowModifyModal(false);
          setModifyFilePath(null);
          setModifyContent('');
          setModifyLoading(false);
        }}
        onOk={handleModifyConfirm}
        okButtonProps={{ disabled: modifyLoading }}
        okText={t('common:save')}
        cancelText={t('common:cancel')}
        confirmLoading={createOrUpdateMutation.isPending}
        width={700}
      >
        <Spin spinning={modifyLoading}>
          <div className="mb-2">
            <strong>{t('file')}:</strong> {modifyFilePath}
          </div>
          <Input.TextArea
            rows={12}
            value={modifyContent}
            onChange={(event) => setModifyContent(event.target.value)}
            placeholder={t('content_placeholder')}
          />
        </Spin>
      </Modal>

      <Modal
        title={t('file_content')}
        open={showContentModal}
        onCancel={() => {
          setShowContentModal(false);
          setSelectedFilePath(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setShowContentModal(false);
              setSelectedFilePath(null);
            }}
          >
            {t('common:close')}
          </Button>,
        ]}
        width={700}
      >
        <Spin spinning={contentLoading}>
          {fileContent?.data?.content ? (
            <pre className="bg-(--bg-surface) p-4 rounded overflow-auto max-h-[400px]">
              {decodeContent(fileContent.data.content)}
            </pre>
          ) : (
            <div className="p-4 text-center text-(--text-muted)">{t('no_content')}</div>
          )}
        </Spin>
      </Modal>

      <Modal
        title={t('deploy_to_resource')}
        open={showDeployModal}
        onCancel={() => {
          setShowDeployModal(false);
          setSelectedFilePath(null);
          setSelectedResource(null);
        }}
        onOk={handleDeployConfirm}
        confirmLoading={deployMutation.isPending}
        okText={t('common:confirm')}
        cancelText={t('common:cancel')}
      >
        <div className="py-4 px-0">
          <div className="mb-2">
            <strong>{t('file')}:</strong> {selectedFilePath}
          </div>
          <div>
            <label className="block mb-2">{t('select_resource')}</label>
            <Select
              aria-label={t('select_resource')}
              className="w-full"
              placeholder={
                availableResources.length === 0 && !rdLoading
                  ? t('already_deployed_to_all')
                  : t('select_resource_placeholder')
              }
              value={selectedResource}
              onChange={setSelectedResource}
              loading={rdLoading}
              // Clusters can hold hundreds of resource definitions; scrolling to
              // one is unusable. optionFilterProp is explicit because antd
              // filters on `value` by default, not on what the user reads.
              showSearch
              optionFilterProp="label"
              options={availableResources.map((rd: { name: string }) => ({
                label: rd.name,
                value: rd.name,
              }))}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};
