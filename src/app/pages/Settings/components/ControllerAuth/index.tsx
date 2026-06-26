// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { Alert, Card, Modal, Tag, Typography, message } from 'antd';
import { Input } from '@app/components/Input';
import { CheckCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';
import { Popconfirm } from '@app/components/Popconfirm';
import service from '@app/requests';
import { clearControllerAuthToken, setControllerAuthRequired, setControllerAuthToken } from '@app/utils/controllerAuth';

const { Title } = Typography;

const TOKEN_AUTH_PROPERTY = 'Auth/TokenAuthenticationEnabled';

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
  const [disablingTokenAuth, setDisablingTokenAuth] = useState(false);
  const [initializedTokenAuth, setInitializedTokenAuth] = useState<InitializedTokenAuth | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  // null while we don't yet know — keeps the Initialize button visible so the
  // page works even if the property request fails or hasn't returned yet.
  const [tokenAuthEnabled, setTokenAuthEnabled] = useState<boolean | null>(null);

  const { t } = useTranslation(['common', 'settings']);

  useEffect(() => {
    let cancelled = false;

    const checkTokenAuthState = async () => {
      try {
        const response = await service.get<Record<string, string>>('/v1/controller/properties');
        if (cancelled) return;
        setTokenAuthEnabled(response.data?.[TOKEN_AUTH_PROPERTY] === 'true');
      } catch {
        if (cancelled) return;
        // Couldn't read properties (older controller, network error, etc.) —
        // fall back to showing the Initialize button.
        setTokenAuthEnabled(false);
      }
    };

    void checkTokenAuthState();

    return () => {
      cancelled = true;
    };
  }, []);

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
        setTokenAuthEnabled(true);
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
      setTokenAuthEnabled(true);
      setInitializedTokenAuth({ token, url: getHttpsControllerUrl(), alreadyEnabled: false });
      message.success(t('settings:controller_auth_initialized'));
    } catch (error) {
      message.error((error as Error)?.message || t('settings:controller_auth_initialize_failed'));
    } finally {
      setInitializingTokenAuth(false);
    }
  };

  const handleDisableTokenAuth = async () => {
    setDisablingTokenAuth(true);

    try {
      // Disabling token auth = DELETING the Auth/TokenAuthenticationEnabled
      // property. The controller only honors deletion live (matching linstor's
      // own disable-token-auth, which deletes the property); merely setting it to
      // "false" does NOT lift enforcement on the running controller.
      await service.post('/v1/controller/properties', {
        delete_props: [TOKEN_AUTH_PROPERTY],
      });

      setControllerAuthRequired(false);
      clearControllerAuthToken();
      setTokenAuthEnabled(false);
      message.success(t('settings:controller_auth_disabled'));
    } catch (error) {
      message.error((error as Error)?.message || t('settings:controller_auth_disable_failed'));
    } finally {
      setDisablingTokenAuth(false);
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

          {tokenAuthEnabled !== true && (
            <Alert
              type="warning"
              showIcon
              message={t('settings:controller_auth_https_switch_title')}
              description={t('settings:controller_auth_https_switch_description', { url: getHttpsControllerUrl() })}
            />
          )}

          {tokenAuthEnabled === true && (
            <Tag color="success" icon={<CheckCircleOutlined />} style={{ alignSelf: 'flex-start' }}>
              {t('settings:controller_auth_already_initialized')}
            </Tag>
          )}

          <ButtonContainer>
            {tokenAuthEnabled !== true && (
              <Button type="primary" onClick={handleInitializeTokenAuth} loading={initializingTokenAuth} size="large">
                {t('settings:controller_auth_initialize')}
              </Button>
            )}

            {tokenAuthEnabled === true && (
              <Button onClick={() => setTokenModalOpen(true)} size="large">
                {t('settings:controller_auth_enter_token')}
              </Button>
            )}

            {tokenAuthEnabled === true && (
              <Popconfirm
                title={t('settings:controller_auth_disable_confirm_title')}
                description={t('settings:controller_auth_disable_confirm_description')}
                okText={t('settings:controller_auth_disable')}
                cancelText={t('common:cancel')}
                onConfirm={handleDisableTokenAuth}
              >
                <Button danger size="large" loading={disablingTokenAuth}>
                  {t('settings:controller_auth_disable')}
                </Button>
              </Popconfirm>
            )}
          </ButtonContainer>
        </FormContainer>
      </Card>

      <Modal
        title={t('settings:controller_auth_initialized_title')}
        open={Boolean(initializedTokenAuth)}
        onCancel={() => setInitializedTokenAuth(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="secondary" onClick={() => setInitializedTokenAuth(null)}>
              {t('settings:controller_auth_stay_here')}
            </Button>
            <Button type="primary" onClick={handleOpenHttpsController}>
              {t('settings:controller_auth_open_https')}
            </Button>
          </div>
        }
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
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              type="secondary"
              onClick={() => {
                setTokenModalOpen(false);
                setManualToken('');
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button type="primary" onClick={handleSaveManualToken}>
              {t('settings:controller_auth_save')}
            </Button>
          </div>
        }
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
