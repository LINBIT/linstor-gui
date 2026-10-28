// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Typography } from 'antd';
import { Button } from '@app/components/Button';
import { useFileContent } from './useHA';

const { Text } = Typography;

interface FileContentModalProps {
  filePath: string;
  visible: boolean;
  onClose: () => void;
}

export const FileContentModal: React.FC<FileContentModalProps> = ({ filePath, visible, onClose }) => {
  const { t } = useTranslation(['ha', 'common']);
  const { data: fileContent, isLoading: contentLoading } = useFileContent(filePath);

  const content = (fileContent?.data as unknown as { path?: string; content?: string })?.content;

  let decodedContent = '';
  if (content) {
    try {
      decodedContent = atob(content);
    } catch {
      decodedContent = content;
    }
  }

  return (
    <Modal
      title={filePath.replace('files/', '/')}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common:close')}
        </Button>,
      ]}
      width={800}
      styles={{ body: { maxHeight: '70vh', overflow: 'auto', padding: '16px' } }}
    >
      {contentLoading ? (
        <Text type="secondary">{t('common:loading')}</Text>
      ) : decodedContent ? (
        <pre className="bg-(--bg-surface) p-3 rounded m-0 whitespace-pre-wrap break-all">{decodedContent}</pre>
      ) : (
        <Text type="secondary">-</Text>
      )}
    </Modal>
  );
};
