// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { Input, Button, Switch, Form } from 'antd';
import styled from '@emotion/styled';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, RootState } from '@app/store';
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  padding: 0;
`;

const StatusInfo = styled.div`
  margin-top: 1em;
`;

type FormType = {
  isChecked: boolean;
  customHost: boolean;
  host: string;
};

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
    lg: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
    lg: { span: 18 },
  },
};

// For setting Gateway related stuff
const Gateway: React.FC = () => {
  const OriginHost = window.location.protocol + '//' + window.location.hostname + ':8080/';

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
    <>
      <Wrapper>
        <div>
          <h2>{t('settings:linstor_gateway')}</h2>
          <p>{t('settings:linstor_gateway_description')}</p>
        </div>

        <Form
          form={form}
          onFinish={onFinish}
          style={{ maxWidth: 600 }}
          scrollToFirstError
          initialValues={{
            isChecked: gatewayEnabled,
            customHost: customHostFromSetting,
            host: gatewayHost || OriginHost,
          }}
          {...formItemLayout}
        >
          <Form.Item
            label={t('settings:gateway_mode')}
            extra={t('settings:gateway_mode_description')}
            name="isChecked"
            valuePropName="checked"
          >
            <Switch aria-label="gateway-mode" />
          </Form.Item>

          {isChecked && (
            <>
              <Form.Item
                label={t('settings:custom_host')}
                extra={t('settings:custom_host_description')}
                name="customHost"
                valuePropName="checked"
              >
                <Switch aria-label="custom-host" />
              </Form.Item>

              <Form.Item
                label={t('settings:url')}
                name="host"
                validateDebounce={1000}
                rules={[
                  { required: customHost, message: '' },
                  { type: 'url', warningOnly: true },
                  { type: 'string', min: 6 },
                  {
                    validator: async (_, value) => {
                      const res = await dispatch.setting.getGatewayStatus(value);
                      if (res) {
                        return Promise.resolve();
                      } else {
                        return Promise.reject(new Error('Cannot connect to LINSTOR-Gateway'));
                      }
                    },
                  },
                ]}
                extra={
                  <StatusInfo>
                    {checkingStatus ? (
                      'Checking status...'
                    ) : (
                      <>
                        {t('common:status')}:{' '}
                        {gatewayAvailable ? (
                          <CheckCircleOutlined style={{ color: 'green' }} />
                        ) : (
                          <StopOutlined style={{ color: 'red' }} />
                        )}
                        {gatewayAvailable ? t('settings:available') : t('settings:not_available')}
                      </>
                    )}
                  </StatusInfo>
                }
              >
                <Input placeholder="http://192.168.1.1:8080/" disabled={!customHost} />
              </Form.Item>
            </>
          )}

          <Form.Item
            wrapperCol={{
              offset: 6,
            }}
          >
            <Button type="primary" htmlType="submit" disabled={checkingStatus}>
              {t('common:save')}
            </Button>
          </Form.Item>
        </Form>
      </Wrapper>
    </>
  );
};

export default Gateway;
