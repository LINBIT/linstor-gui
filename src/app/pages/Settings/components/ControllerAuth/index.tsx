// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Alert, Card, Input, Modal, Typography, message } from 'antd';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';
import service from '@app/requests';
import { setControllerAuthRequired, setControllerAuthToken } from '@app/utils/controllerAuth';

const { Title } = Typography;

const Wrapper = styled.div`
  padding: 0;
  max-width: 800px;
`;

const HeaderSection = styled.div`
  margin-bottom: 2em;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5em;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1em;
  flex-wrap: wrap;
`;

type ApiCallRcEntry = {
  message?: string;
  obj_refs?: {
    token?: string;
  };
};

type InitializedTokenAuth = {
  token?: string;
  url: string;
  alreadyEnabled: boolean;
};

const ControllerAuth: React.FC = () => {
  const [initializingTokenAuth, setInitializingTokenAuth] = useState(false);
  const [initializedTokenAuth, setInitializedTokenAuth] = useState<InitializedTokenAuth | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');

  const { t } = useTranslation(['common', 'settings']);

  const extractTokenFromInitResponse = (data?: ApiCallRcEntry[]) => {
    const objRefToken = data?.find((entry) => entry?.obj_refs?.token)?.obj_refs?.token?.trim();

    if (objRefToken) {
      return objRefToken;
    }

    return data
      ?.map((entry) => entry.message?.match(/Init token\s+(.+)$/)?.[1]?.trim())
      .find((token): token is string => Boolean(token));
  };

  const isAlreadyEnabledResponse = (data?: ApiCallRcEntry[]) => {
    return Boolean(
      data?.some((entry) => entry.message?.toLowerCase().includes('token authentication is already enabled')),
    );
  };

  const getHttpsControllerUrl = () => {
    const linstorHost = window.localStorage.getItem('LINSTOR_HOST');
    const host = linstorHost ? new URL(linstorHost, window.location.origin).hostname : window.location.hostname;

    return `https://${host}:3371`;
  };

  const handleInitializeTokenAuth = async () => {
    setInitializingTokenAuth(true);

    try {
      const response = await service.post('/v1/controller/auth/initialize-token-auth', {
        only_satellites: false,
        description: 'linstor-gui',
      });

      const token = extractTokenFromInitResponse(response.data);
      const alreadyEnabled = isAlreadyEnabledResponse(response.data);

      if (!token) {
        setControllerAuthRequired(true);
        setInitializedTokenAuth({ url: getHttpsControllerUrl(), alreadyEnabled });
        message.warning(
          alreadyEnabled
            ? t('settings:controller_auth_already_enabled')
            : t('settings:controller_auth_initialize_missing_token'),
        );
        return;
      }

      setControllerAuthRequired(true);
      setControllerAuthToken(token);
      setInitializedTokenAuth({ token, url: getHttpsControllerUrl(), alreadyEnabled: false });
      message.success(t('settings:controller_auth_initialized'));
    } catch (error) {
      message.error((error as Error)?.message || t('settings:controller_auth_initialize_failed'));
    } finally {
      setInitializingTokenAuth(false);
    }
  };

  const handleOpenHttpsController = () => {
    if (!initializedTokenAuth) {
      return;
    }

    window.location.assign(initializedTokenAuth.url);
  };

  const handleSaveManualToken = () => {
    const token = manualToken.trim();

    if (!token) {
      message.error(t('settings:controller_auth_token_required'));
      return;
    }

    setControllerAuthRequired(true);
    setControllerAuthToken(token);
    setManualToken('');
    setTokenModalOpen(false);
    message.success(t('settings:controller_auth_token_saved'));
  };

  return (
    <Wrapper>
      <HeaderSection>
        <Title level={3}>{t('settings:controller_auth')}</Title>
      </HeaderSection>

      <Card>
        <FormContainer>
          <Alert
            type="info"
            showIcon
            message={t('settings:controller_auth_storage_title')}
            description={t('settings:controller_auth_storage_description')}
          />

          <Alert
            type="warning"
            showIcon
            message={t('settings:controller_auth_https_switch_title')}
            description={t('settings:controller_auth_https_switch_description', { url: getHttpsControllerUrl() })}
          />

          <ButtonContainer>
            <Button type="primary" onClick={handleInitializeTokenAuth} loading={initializingTokenAuth} size="large">
              {t('settings:controller_auth_initialize')}
            </Button>

            <Button onClick={() => setTokenModalOpen(true)} size="large">
              {t('settings:controller_auth_enter_token')}
            </Button>
          </ButtonContainer>
        </FormContainer>
      </Card>

      <Modal
        title={t('settings:controller_auth_initialized_title')}
        open={Boolean(initializedTokenAuth)}
        onCancel={() => setInitializedTokenAuth(null)}
        onOk={handleOpenHttpsController}
        okText={t('settings:controller_auth_open_https')}
        cancelText={t('settings:controller_auth_stay_here')}
      >
        <Alert
          type="warning"
          showIcon
          message={t('settings:controller_auth_initialized_notice')}
          description={t('settings:controller_auth_initialized_notice_description', {
            url: initializedTokenAuth?.url ?? '',
          })}
        />

        {initializedTokenAuth?.token ? (
          <Input.TextArea value={initializedTokenAuth.token} readOnly autoSize style={{ marginTop: 16 }} />
        ) : (
          <Alert
            type={initializedTokenAuth?.alreadyEnabled ? 'info' : 'warning'}
            showIcon
            message={
              initializedTokenAuth?.alreadyEnabled
                ? t('settings:controller_auth_already_enabled_notice')
                : t('settings:controller_auth_no_token_notice')
            }
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>

      <Modal
        title={t('settings:controller_auth_enter_token')}
        open={tokenModalOpen}
        onCancel={() => {
          setTokenModalOpen(false);
          setManualToken('');
        }}
        onOk={handleSaveManualToken}
        okText={t('settings:controller_auth_save')}
        cancelText={t('common:cancel')}
      >
        <Input.Password
          value={manualToken}
          onChange={(event) => setManualToken(event.target.value)}
          placeholder={t('settings:controller_auth_token_placeholder')}
          autoFocus
        />
      </Modal>
    </Wrapper>
  );
};

export default ControllerAuth;
