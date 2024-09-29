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

  const { gatewayEnabled, gatewayHost, customHostFromSetting, gatewayAvailable, checkingStatus } = useSelector(
    (state: RootState) => ({
      gatewayEnabled: state?.setting?.KVS?.gatewayEnabled,
      gatewayHost: state?.setting?.KVS?.gatewayHost,
      customHostFromSetting: state?.setting?.KVS?.gatewayCustomHost,
      gatewayAvailable: state.setting.gatewayAvailable,
      checkingStatus: state.loading.effects.setting.getGatewayStatus,
    }),
  );

  const onFinish = (values: FormType) => {
    dispatch.setting.setGatewayMode({
      gatewayEnabled: values.isChecked,
      customHost: values.customHost,
      host: values.host,
      showToast: gatewayAvailable,
    });
  };

  useEffect(() => {
    dispatch.setting.getGatewayStatus(gatewayHost);
  }, [dispatch.setting, gatewayHost, isChecked]);

  return (
    <>
      <Wrapper>
        <div>
          <h2>LINSTOR Gateway</h2>
          <p>
            Manages Highly-Available iSCSI targets and NFS exports via LINSTOR. Installing linstor-gateway is a
            prerequisite for enabling this feature.
          </p>
          <p>After enabling this feature, the Gateway entry will be displayed in the left-side menu.</p>
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
            label="Gateway mode"
            extra="Installing linstor-gateway is a prerequisite for enabling this feature. And ensure that the endpoint is correctly configured to allow communication between the LINSTOR Gateway and the LINSTOR Server."
            name="isChecked"
            valuePropName="checked"
          >
            <Switch aria-label="gateway-mode" />
          </Form.Item>

          {isChecked && (
            <>
              <Form.Item
                label="Custom host"
                extra="When the custom host is enabled, you need to enter the LINSTOR Gateway API endpoints in the 'Custom API' section below. The default value is the LINSTOR server IP + 8080, like http://192.168.1.1:8080/.  If a custom port or different IP is used, adjust the endpoint accordingly."
                name="customHost"
                valuePropName="checked"
              >
                <Switch aria-label="custom-host" />
              </Form.Item>

              <Form.Item
                label="Custom API"
                name="host"
                validateTrigger="onBlur"
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
                    Status:{' '}
                    {gatewayAvailable ? (
                      <CheckCircleOutlined style={{ color: 'green' }} />
                    ) : (
                      <StopOutlined style={{ color: 'red' }} />
                    )}
                    {gatewayAvailable ? ' Available' : ' Not available'}
                  </StatusInfo>
                }
              >
                <Input placeholder="http://192.168.1.1:8080/" disabled={!checkingStatus} />
              </Form.Item>
            </>
          )}

          <Form.Item
            wrapperCol={{
              offset: 6,
            }}
          >
            <Button type="primary" htmlType="submit" disabled={checkingStatus}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Wrapper>
    </>
  );
};

export default Gateway;
