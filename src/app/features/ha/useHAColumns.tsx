// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useTranslation } from 'react-i18next';
import { Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, LoadingOutlined } from '@ant-design/icons';
import { ActionColumnTitle } from '@app/components/ActionColumnTitle';
import { useUnmanageHA } from './useHA';
import { type HARecord, reactorConfigFiles } from './haStatus';
import type { useReactorActions } from './useReactorActions';
import { HAStatusTag } from './HAStatusTag';
import { HARowActions } from './HARowActions';
import { ResourceNodes } from './ResourceNodes';

const { Text } = Typography;

type Options = {
  reactor: ReturnType<typeof useReactorActions>;
  onViewFile: (filePath: string) => void;
  onDelete: (record: HARecord) => void;
};

/** The HA table's columns: name, status, nodes, config files, actions. */
export const useHAColumns = ({ reactor, onViewFile, onDelete }: Options): ColumnsType<HARecord> => {
  const { t } = useTranslation(['ha', 'common']);
  const unmanageMutation = useUnmanageHA();
  const { reactorStatus, reactorStatusLoading } = reactor;

  return [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('common:status'),
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (reactorStatusLoading) {
          return <LoadingOutlined spin style={{ color: 'rgba(0, 0, 0, 0.45)' }} />;
        }
        return (
          <HAStatusTag
            resourceName={record.name}
            active={reactor.isResourceActive(record.name)}
            reactorStatus={reactorStatus}
          />
        );
      },
    },
    {
      title: t('common:nodes'),
      key: 'nodes',
      render: (_, record) => <ResourceNodes resourceName={record.name} reactorStatus={reactorStatus} />,
    },
    {
      title: t('ha:config_files'),
      key: 'config_files',
      render: (_, record) => {
        if (!record.props) return '-';
        const configFiles = reactorConfigFiles(record);
        return (
          <Space size={4} orientation="vertical">
            {configFiles.map((file) => (
              <Text key={file} code>
                {file.replace('files/', '/')}
                <EyeOutlined
                  style={{ marginLeft: 8, cursor: 'pointer', color: '#499BBB' }}
                  onClick={() => onViewFile(file)}
                />
              </Text>
            ))}
          </Space>
        );
      },
    },
    {
      title: () => <ActionColumnTitle />,
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <HARowActions
          record={record}
          getPrimaryNode={reactor.getPrimaryNode}
          isResourceActive={reactor.isResourceActive}
          onEvict={reactor.handleEvict}
          onStop={reactor.handleStop}
          onStart={reactor.handleStart}
          onDelete={onDelete}
          unmanageMutation={unmanageMutation}
        />
      ),
    },
  ];
};
