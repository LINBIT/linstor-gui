// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, RootState } from '@app/store';
import { useTranslation } from 'react-i18next';
import { UIMode } from '@app/models/setting';

type FormType = {
  username: string;
  password: string;
  password_validate: string;
};

const AuthForm: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [isError, setIsError] = useState(false);
  const dispatch = useDispatch<Dispatch>();
  const { hciModeFromSetting, vsanModeFromSetting } = useSelector((state: RootState) => ({
    vsanModeFromSetting: state.setting.mode === UIMode.VSAN,
    hciModeFromSetting: state.setting.mode === UIMode.HCI,
  }));

  const onFinish = async (values: FormType) => {
    const res = await dispatch.auth.login({ username: values.username, password: values.password });
    if (res) {
      // The login effect in auth model will handle needsPasswordChange based on hideDefaultCredential

      if (vsanModeFromSetting) {
        window.location.href = '/vsan/dashboard';
      } else if (hciModeFromSetting) {
        window.location.href = '/hci/dashboard';
      } else {
        window.location.href = '/';
      }
    } else {
      setIsError(true);
    }
  };

  return (
    <Form
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={{ login: true }}
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
    >
      {isError && (
        <Alert
          description="Please check your username and password and try again"
          type="error"
          closable
          onClose={() => setIsError(false)}
          style={{
            marginBottom: 16,
            marginTop: 16,
            width: '80%',
          }}
        />
      )}
      <Form.Item
        label={t('common:username')}
        name="username"
        rules={[{ required: true, message: 'Please input your username!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={t('common:password')}
        name="password"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item wrapperCol={{ span: 16 }}>
        <Button type="primary" htmlType="submit">
          {t('common:login')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { AuthForm };
