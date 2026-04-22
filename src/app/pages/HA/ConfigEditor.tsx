// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Typography, Spin, Card, Modal } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { Button } from '@app/components/Button';
import { OcfAgentEditor, OcfAgentEditorRef } from '@app/components/OcfAgentEditor';
import { useFileContent, useHA, useCreateFile, useDeployFile } from '@app/features/ha/useHA';

const { Text } = Typography;

const ConfigEditor = () => {
  const { t } = useTranslation(['ha', 'common']);
  const { resourceName } = useParams<{ resourceName: string }>();
  const isCreate = !resourceName;
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const urlFilePath = searchParams.get('filePath');

  const editorRef = useRef<OcfAgentEditorRef>(null);

  const { data: haResources, isLoading: haLoading } = useHA();
  const [filePath, setFilePath] = useState<string | null>(urlFilePath);

  useEffect(() => {
    if (!isCreate && !filePath && haResources && resourceName) {
      const resource = haResources.find((r) => r.name === resourceName);
      if (resource?.props) {
        const configFiles = Object.keys(resource.props).filter((key) => key.startsWith('files/etc/drbd-reactor.d/'));
        if (configFiles.length > 0) {
          setFilePath(configFiles[0]);
        }
      }
    }
  }, [isCreate, filePath, haResources, resourceName]);

  const { data: fileContent, isLoading: contentLoading } = useFileContent(isCreate ? '' : filePath || '');
  const [tomlContent, setTomlContent] = useState<string>('');
  const [loaded, setLoaded] = useState(isCreate); // Loaded by default for create mode

  const { mutateAsync: createFileAsync, isLoading: isCreating } = useCreateFile();
  const { mutateAsync: deployFileAsync, isLoading: isDeploying } = useDeployFile();

  const [showDirtyModal, setShowDirtyModal] = useState(false);

  useEffect(() => {
    if (isCreate) return;

    if (fileContent?.data) {
      const fileData = fileContent.data as { path?: string; content?: string };
      const content = fileData?.content;
      if (content) {
        try {
          const decoded = atob(content);
          setTomlContent(decoded);
        } catch (e) {
          console.error('Failed to decode file content:', e);
          setTomlContent(content);
        }
      } else {
        setTomlContent('');
      }
      setLoaded(true);
    }
  }, [isCreate, fileContent]);

  const handleCancel = () => {
    navigate('/reactor');
  };

  const handleBack = () => {
    if (editorRef.current?.isDirty()) {
      setShowDirtyModal(true);
    } else {
      handleCancel();
    }
  };

  const handleSave = async (content: string, resourceName: string, newFilePath?: string) => {
    let targetPath = isCreate ? newFilePath : filePath;
    if (targetPath) {
      // Clean up path: strip 'files/' prefix and ensure single leading slash
      targetPath = targetPath.replace(/^files\//, '');
      if (!targetPath.startsWith('/')) {
        targetPath = '/' + targetPath;
      }

      try {
        await createFileAsync({ filePath: targetPath, content: btoa(content) });

        if (isCreate) {
          await deployFileAsync({ resourceName, filePath: targetPath });
        }

        handleCancel();
      } catch (e) {
        console.error('Failed to save/deploy:', e);
      }
    }
  };

  if (!isCreate && (!resourceName || (haResources && !haLoading && !filePath))) {
    return (
      <PageBasic title={t('ha:edit_config')} showBack>
        <Card>
          <Text type="danger">{t('common:invalid_request')}</Text>
        </Card>
      </PageBasic>
    );
  }

  const isLoading = (!isCreate && (haLoading || contentLoading || !loaded)) || isCreating || isDeploying;

  return (
    <PageBasic
      title={isCreate ? t('ha:create_resource') : `${t('ha:edit_config')}: ${resourceName}`}
      showBack
      onBack={handleBack}
    >
      <Card
        style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflow: 'hidden', padding: 0 }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin tip={t('common:loading')} />
          </div>
        ) : (
          <OcfAgentEditor
            ref={editorRef}
            mode={isCreate ? 'create' : 'edit'}
            profile={isCreate ? null : { name: resourceName!, id: resourceName! }}
            tomlContent={tomlContent}
            hideTitle
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Card>

      <Modal
        title={t('common:unsaved_changes')}
        open={showDirtyModal}
        onCancel={() => setShowDirtyModal(false)}
        footer={[
          <Button key="no" onClick={() => setShowDirtyModal(false)}>
            {t('common:no')}
          </Button>,
          <Button key="yes" type="primary" onClick={() => handleCancel()}>
            {t('common:yes')}
          </Button>,
        ]}
      >
        <p>{t('common:unsaved_changes_desc')}</p>
      </Modal>
    </PageBasic>
  );
};

export default ConfigEditor;
