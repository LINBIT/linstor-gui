// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, RootState } from '@app/store';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type FormType = {
  username: string;
  password: string;
  password_validate: string;
};

const isDefaultCredentials = (values: FormType) => {
  return values.username === 'admin' && values.password === 'admin';
};

const AuthForm: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [isError, setIsError] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch<Dispatch>();
  const { KVS, vsanModeFromSetting } = useSelector((state: RootState) => ({
    KVS: state.setting.KVS,
    vsanModeFromSetting: state.setting.vsanMode,
  }));

  const onFinish = async (values: FormType) => {
    const res = await dispatch.auth.login({ username: values.username, password: values.password });
    if (res) {
      if (isDefaultCredentials(values)) {
        dispatch.auth.setNeedsPasswordChange(true);
      }

      if (vsanModeFromSetting && KVS?.vsanMode) {
        history.push('/vsan/dashboard');
      } else {
        history.push('/');
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
