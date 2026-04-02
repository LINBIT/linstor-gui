// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useMemo } from 'react';
import { Button as AntButton, Space, Table, Tag, Popconfirm, Dropdown, Modal, Spin, Select, message } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';
import { Link } from '@app/components/Link';
import { useFiles, useDeleteFile, useDeployFile, useResourceDefinitions, ExternalFile } from '../';
import { getFile } from '../api';
import { uniqId } from '@app/utils/stringUtils';
import { BRAND_COLOR } from '@app/const/color';

export const List = () => {
  const { t } = useTranslation(['files', 'common']);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  const { data: files, refetch, isLoading } = useFiles(false);
  const { data: resourceDefinitions, isLoading: rdLoading } = useResourceDefinitions();

  // Get file with content for the modal
  const { data: fileContent, isLoading: contentLoading } = useQuery({
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

  // Check if this file is already deployed to any resource
  const deployedResource = useMemo(() => {
    if (!resourceDefinitions?.data || !selectedFilePath) return null;
    const fileKey = `files${selectedFilePath}`;
    const rd = resourceDefinitions.data.find((r: { props?: Record<string, string> }) => r.props?.[fileKey]);
    return rd?.name || null;
  }, [resourceDefinitions?.data, selectedFilePath]);

  const deleteMutation = useDeleteFile();
  const deployMutation = useDeployFile();

  const handleDelete = (extFileName: string) => {
    deleteMutation.mutate(extFileName, {
      onSuccess: () => {
        refetch();
      },
    });
  };

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
          onError: (error: { message?: string }) => {
            // Check if it's already deployed error
            const errorMsg = error?.message || '';
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
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: t('deployed_to'),
      key: 'deployed_to',
      render: (_, record) => {
        const deployedRd = getDeployedResource(record.path);
        return deployedRd ? <Tag color="#FFCC9C">{deployedRd}</Tag> : <Tag color="gray">{t('not_deployed')}</Tag>;
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
                  ...(deployedRd
                    ? []
                    : [
                        {
                          key: 'deploy',
                          label: t('deploy'),
                          onClick: () => handleDeploy(record),
                        },
                      ]),
                  {
                    key: 'view',
                    label: t('view_content'),
                    onClick: () => handleViewContent(record),
                  },
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm
                        key="delete"
                        title={t('delete_confirm')}
                        okText={t('common:yes')}
                        cancelText={t('common:no')}
                        onConfirm={() => {
                          if (record.path) {
                            handleDelete(record.path);
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
              <AntButton type="text" icon={<MoreOutlined />} />
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
      <div style={{ marginBottom: 16 }}>
        <Link type="primary" to="/files/create">
          + {t('add_file')}
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={files?.data ?? []}
        rowKey={(item) => item.path ?? uniqId()}
        loading={isLoading || deleteMutation.isPending}
        pagination={{
          total: files?.data?.length ?? 0,
          showTotal: (total) => t('common:total_items', { total }),
        }}
      />

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
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto', maxHeight: 400 }}>
              {decodeContent(fileContent.data.content)}
            </pre>
          ) : (
            <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>{t('no_content')}</div>
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
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{t('file')}:</strong> {selectedFilePath}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>{t('select_resource')}</label>
            <Select
              style={{ width: '100%' }}
              placeholder={
                availableResources.length === 0 && !rdLoading
                  ? t('already_deployed_to_all')
                  : t('select_resource_placeholder')
              }
              value={selectedResource}
              onChange={setSelectedResource}
              loading={rdLoading}
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
