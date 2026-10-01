// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { Form, Card, Alert, Typography, Space, Spin } from 'antd';
import { Input } from '@app/components/Input';
import { Switch } from '@app/components/Switch';

import { useSettings } from '@app/features/settings/useSettings';
import { CheckCircleOutlined, StopOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Button from '@app/components/Button';

const { Title, Text } = Typography;

type FormType = {
  isChecked: boolean;
  customHost: boolean;
  host: string;
};

// For setting Gateway related stuff
const Gateway: React.FC = () => {
  const OriginHost = window.location.protocol + '//' + window.location.hostname + ':8337/';

  const [form] = Form.useForm<FormType>();

  const customHost = Form.useWatch('customHost', form);
  const isChecked = Form.useWatch('isChecked', form);

  const { t } = useTranslation(['common', 'settings']);

  const { KVS, gatewayAvailable, checkingGateway: checkingStatus, getGatewayStatus, setGatewayMode } = useSettings();
  const { gatewayEnabled, gatewayHost, gatewayCustomHost: customHostFromSetting } = KVS;

  useEffect(() => {
    if (customHost) {
      getGatewayStatus(gatewayHost || OriginHost);
    }
  }, [OriginHost, customHost, getGatewayStatus, gatewayHost]);

  const onFinish = (values: FormType) => {
    if (values?.host?.[values.host.length - 1] !== '/') {
      values.host += '/';
    }

    setGatewayMode({
      gatewayEnabled: values.isChecked,
      customHost: values.customHost,
      host: values.host,
      showToast: gatewayAvailable,
    });
  };

  useEffect(() => {
    getGatewayStatus(gatewayHost || OriginHost);
  }, [OriginHost, getGatewayStatus, gatewayHost, isChecked]);

  return (
    <div className="max-w-[800px] p-0">
      <div className="mb-[2em]">
        <Title level={3}>{t('settings:linstor_gateway')}</Title>
        <Text type="secondary">{t('settings:linstor_gateway_description')}</Text>
      </div>

      <Card>
        <div className="[&_.ant-form-item]:mb-[1.5em] [&_.ant-form-item-label]:font-medium [&_.ant-form-item-extra]:mt-[0.5em] [&_.ant-form-item-extra]:text-(--text-muted)">
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
                  title={t('settings:gateway_config_title')}
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
                      <Spin spinning={checkingStatus} indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
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
                        const res = await getGatewayStatus(value);
                        if (res) {
                          return Promise.resolve();
                        } else {
                          return Promise.reject(new Error(t('settings:gateway_connect_error')));
                        }
                      },
                    },
                  ]}
                  // `help` would replace the validator's message, so the hint
                  // about the default host goes in `extra`, which renders
                  // alongside it.
                  extra={
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
                      !checkingStatus ? (
                        <span
                          className={`inline-flex items-center justify-center gap-[0.5em] px-[0.75em] font-medium whitespace-nowrap [&_.anticon]:text-[14px] ${
                            gatewayAvailable ? 'text-[#52c41a]' : 'text-[#fa8c16]'
                          }`}
                        >
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
                        </span>
                      ) : null
                    }
                  />
                </Form.Item>

                {isChecked && (
                  <Form.Item style={{ marginBottom: '2em', marginTop: '1em' }}>
                    <div style={{ width: '20%' }}>
                      <Button
                        onClick={() => getGatewayStatus(form.getFieldValue('host'))}
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

            <div className="mt-[2em] flex gap-[1em]">
              <Button type="primary" htmlType="submit" disabled={checkingStatus} size="large" loading={checkingStatus}>
                {t('common:save')}
              </Button>
            </div>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default Gateway;
