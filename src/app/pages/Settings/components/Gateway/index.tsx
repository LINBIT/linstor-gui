// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { Input, Form, Card, Alert, Typography, Space, Spin } from 'antd';
import { Switch } from '@app/components/Switch';
import styled from '@emotion/styled';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, RootState } from '@app/store';
import { CheckCircleOutlined, StopOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Button from '@app/components/Button';

const { Title, Text } = Typography;

const Wrapper = styled.div`
  padding: 0;
  max-width: 800px;
`;

const HeaderSection = styled.div`
  margin-bottom: 2em;
`;

const StatusBadge = styled.span<{ isAvailable?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  padding: 0 0.75em;
  color: ${(props) => (props.isAvailable ? '#52c41a' : '#fa8c16')};
  font-weight: 500;
  white-space: nowrap;

  .anticon {
    font-size: 14px;
  }
`;

type FormType = {
  isChecked: boolean;
  customHost: boolean;
  host: string;
};

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
`;

// For setting Gateway related stuff
const Gateway: React.FC = () => {
  const OriginHost = window.location.protocol + '//' + window.location.hostname + ':8337/';

  const dispatch = useDispatch<Dispatch>();
  const [form] = Form.useForm<FormType>();

  const customHost = Form.useWatch('customHost', form);
  const isChecked = Form.useWatch('isChecked', form);

  const { t } = useTranslation(['common', 'settings']);

  const { gatewayEnabled, gatewayHost, customHostFromSetting, gatewayAvailable, checkingStatus } = useSelector(
    (state: RootState) => ({
      gatewayEnabled: state?.setting?.KVS?.gatewayEnabled,
      gatewayHost: state?.setting?.KVS?.gatewayHost,
      customHostFromSetting: state?.setting?.KVS?.gatewayCustomHost,
      gatewayAvailable: state.setting.gatewayAvailable,
      checkingStatus: state.loading.effects.setting.getGatewayStatus,
    }),
  );

  useEffect(() => {
    if (customHost) {
      dispatch.setting.getGatewayStatus(gatewayHost || OriginHost);
    }
  }, [OriginHost, customHost, dispatch.setting, gatewayHost]);

  const onFinish = (values: FormType) => {
    if (values?.host?.[values.host.length - 1] !== '/') {
      values.host += '/';
    }

    dispatch.setting.setGatewayMode({
      gatewayEnabled: values.isChecked,
      customHost: values.customHost,
      host: values.host,
      showToast: gatewayAvailable,
    });
  };

  useEffect(() => {
    dispatch.setting.getGatewayStatus(gatewayHost || OriginHost);
  }, [OriginHost, dispatch.setting, gatewayHost, isChecked]);

  return (
    <Wrapper>
      <HeaderSection>
        <Title level={3}>{t('settings:linstor_gateway')}</Title>
        <Text type="secondary">{t('settings:linstor_gateway_description')}</Text>
      </HeaderSection>

      <Card>
        <FormContainer>
          <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
            scrollToFirstError
            initialValues={{
              isChecked: gatewayEnabled,
              customHost: customHostFromSetting,
              host: gatewayHost || OriginHost,
            }}
          >
            <Form.Item
              label={t('settings:gateway_mode')}
              extra={t('settings:gateway_mode_description')}
              name="isChecked"
              valuePropName="checked"
            >
              <Switch aria-label="gateway-mode" checkedChildren={t('common:on')} unCheckedChildren={t('common:off')} />
            </Form.Item>

            {isChecked && (
              <>
                <Alert
                  message={t('settings:gateway_config_title')}
                  description={t('settings:gateway_config_description')}
                  type="info"
                  showIcon
                  style={{ marginBottom: '1.5em' }}
                />

                <Form.Item
                  label={t('settings:custom_host')}
                  extra={t('settings:custom_host_description')}
                  name="customHost"
                  valuePropName="checked"
                >
                  <Switch
                    aria-label="custom-host"
                    checkedChildren={t('settings:custom')}
                    unCheckedChildren={t('settings:default')}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <Space>
                      {t('settings:url')}
                      {customHost && (
                        <Spin spinning={checkingStatus} indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
                      )}
                    </Space>
                  }
                  name="host"
                  validateDebounce={1000}
                  rules={[
                    { required: customHost, message: t('settings:gateway_url_required') },
                    { type: 'url', warningOnly: true },
                    { type: 'string', min: 6 },
                    {
                      validator: async (_, value) => {
                        if (!customHost) return Promise.resolve();
                        const res = await dispatch.setting.getGatewayStatus(value);
                        if (res) {
                          return Promise.resolve();
                        } else {
                          return Promise.reject(new Error(t('settings:gateway_connect_error')));
                        }
                      },
                    },
                  ]}
                  help={
                    customHost ? (
                      <div style={{ marginTop: '1em', marginBottom: '1em' }}>
                        {t('settings:default')}: {OriginHost}
                      </div>
                    ) : undefined
                  }
                >
                  <Input
                    placeholder={t('settings:gateway_url_placeholder', { defaultValue: 'http://192.168.1.1:8337/' })}
                    disabled={!customHost}
                    size="large"
                    addonAfter={
                      customHost && !checkingStatus ? (
                        <StatusBadge isAvailable={gatewayAvailable}>
                          {gatewayAvailable ? (
                            <>
                              <CheckCircleOutlined />
                              {t('settings:connected')}
                            </>
                          ) : (
                            <>
                              <StopOutlined />
                              {t('settings:not_available')}
                            </>
                          )}
                        </StatusBadge>
                      ) : null
                    }
                  />
                </Form.Item>

                {isChecked && customHost && (
                  <Form.Item style={{ marginBottom: '2em', marginTop: '1em' }}>
                    <div style={{ width: '20%' }}>
                      <Button
                        onClick={() => dispatch.setting.getGatewayStatus(form.getFieldValue('host'))}
                        disabled={checkingStatus}
                        size="middle"
                        block
                      >
                        {t('settings:test_connection')}
                      </Button>
                    </div>
                  </Form.Item>
                )}
              </>
            )}

            <ButtonContainer>
              <Button type="primary" htmlType="submit" disabled={checkingStatus} size="large" loading={checkingStatus}>
                {t('common:save')}
              </Button>
            </ButtonContainer>
          </Form>
        </FormContainer>
      </Card>
    </Wrapper>
  );
};

export default Gateway;
