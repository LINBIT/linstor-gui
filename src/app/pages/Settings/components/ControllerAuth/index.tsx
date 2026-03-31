// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Alert, Card, Form, Input, Space, Typography, message } from 'antd';
import styled from '@emotion/styled';
import { CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';
import service from '@app/requests';
import { clearControllerAuthToken, getControllerAuthToken, setControllerAuthToken } from '@app/utils/controllerAuth';

const { Title, Text } = Typography;

const Wrapper = styled.div`
  padding: 0;
  max-width: 800px;
`;

const HeaderSection = styled.div`
  margin-bottom: 2em;
`;

const FormContainer = styled.div`
  .ant-form-item {
    margin-bottom: 1.5em;
  }

  .ant-form-item-label {
    font-weight: 500;
  }

  .ant-form-item-extra {
    margin-top: 0.5em;
    color: rgba(0, 0, 0, 0.45);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1em;
  margin-top: 2em;
  flex-wrap: wrap;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 1.5em;
`;

type FormType = {
  token: string;
};

const ControllerAuth: React.FC = () => {
  const [form] = Form.useForm<FormType>();
  const [hasStoredToken, setHasStoredToken] = useState(Boolean(getControllerAuthToken()));
  const [verifyingStoredToken, setVerifyingStoredToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [clearingToken, setClearingToken] = useState(false);
  const [lastVerifiedVersion, setLastVerifiedVersion] = useState<string | null>(null);

  const { t } = useTranslation(['common', 'settings']);

  const verifyToken = async (token?: string) => {
    const response = await service.get('/v1/controller/version', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    return response.data?.version ?? response.data?.rest_api_version ?? null;
  };

  const handleVerifyStoredToken = async () => {
    setVerifyingStoredToken(true);

    try {
      const version = await verifyToken();
      setLastVerifiedVersion(version);
      message.success(t('settings:controller_auth_token_valid'));
    } catch (error) {
      message.error((error as Error)?.message || t('settings:controller_auth_token_invalid'));
    } finally {
      setVerifyingStoredToken(false);
    }
  };

  const handleSaveToken = async ({ token }: FormType) => {
    const trimmedToken = token.trim();

    setSavingToken(true);

    try {
      const version = await verifyToken(trimmedToken);
      setControllerAuthToken(trimmedToken);
      setHasStoredToken(true);
      setLastVerifiedVersion(version);
      form.resetFields();
      message.success(t('settings:controller_auth_token_saved'));
    } catch (error) {
      message.error((error as Error)?.message || t('settings:controller_auth_token_invalid'));
    } finally {
      setSavingToken(false);
    }
  };

  const handleClearToken = async () => {
    setClearingToken(true);

    try {
      clearControllerAuthToken();
      setHasStoredToken(false);
      setLastVerifiedVersion(null);
      form.resetFields();
      message.success(t('settings:controller_auth_token_cleared'));
    } finally {
      setClearingToken(false);
    }
  };

  return (
    <Wrapper>
      <HeaderSection>
        <Title level={3}>{t('settings:controller_auth')}</Title>
        <Text type="secondary">{t('settings:controller_auth_description')}</Text>
      </HeaderSection>

      <Card>
        <FormContainer>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: '1.5em' }}
            message={t('settings:controller_auth_storage_title')}
            description={t('settings:controller_auth_storage_description')}
          />

          <StatusRow>
            <LockOutlined />
            <Text strong>{t('settings:controller_auth_status')}</Text>
            <Text type={hasStoredToken ? 'success' : 'secondary'}>
              {hasStoredToken
                ? t('settings:controller_auth_token_present')
                : t('settings:controller_auth_token_missing')}
            </Text>
          </StatusRow>

          {lastVerifiedVersion ? (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: '1.5em' }}
              icon={<CheckCircleOutlined />}
              message={t('settings:controller_auth_last_verified')}
              description={t('settings:controller_auth_last_verified_version', { version: lastVerifiedVersion })}
            />
          ) : null}

          <Form form={form} layout="vertical" onFinish={handleSaveToken}>
            <Form.Item
              label={t('settings:controller_auth_token')}
              name="token"
              extra={t('settings:controller_auth_token_help')}
              rules={[{ required: true, message: t('settings:controller_auth_token_required') }]}
            >
              <Input.Password placeholder={t('settings:controller_auth_token_placeholder')} size="large" />
            </Form.Item>

            <ButtonContainer>
              <Button type="primary" htmlType="submit" loading={savingToken} size="large">
                {t('settings:controller_auth_save')}
              </Button>

              <Button
                onClick={handleVerifyStoredToken}
                loading={verifyingStoredToken}
                disabled={!hasStoredToken}
                size="large"
              >
                {t('settings:controller_auth_verify_saved')}
              </Button>

              <Button onClick={handleClearToken} loading={clearingToken} disabled={!hasStoredToken} size="large">
                {t('settings:controller_auth_clear')}
              </Button>
            </ButtonContainer>

            <Space direction="vertical" style={{ marginTop: '1.5em' }}>
              <Text type="secondary">{t('settings:controller_auth_note')}</Text>
            </Space>
          </Form>
        </FormContainer>
      </Card>
    </Wrapper>
  );
};

export default ControllerAuth;
