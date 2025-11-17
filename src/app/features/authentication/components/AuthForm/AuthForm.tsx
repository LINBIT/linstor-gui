// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Alert, Form, Input } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Dispatch, RootState } from '@app/store';
import { UIMode } from '@app/models/setting';
import { Button } from '@app/components/Button';

type FormType = {
  username: string;
  password: string;
  password_validate: string;
};

interface AuthFormProps {
  redirectTo?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ redirectTo }) => {
  const [isError, setIsError] = useState(false);
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();
  const { hciModeFromSetting, vsanModeFromSetting } = useSelector((state: RootState) => ({
    vsanModeFromSetting: state.setting.mode === UIMode.VSAN,
    hciModeFromSetting: state.setting.mode === UIMode.HCI,
  }));

  const onFinish = async (values: FormType) => {
    const res = await dispatch.auth.login({ username: values.username, password: values.password });
    if (res) {
      // The login effect in auth model will handle needsPasswordChange based on hideDefaultCredential

      // Use redirectTo if provided, otherwise use mode-based default routing
      if (redirectTo && redirectTo !== '/') {
        navigate(redirectTo);
      } else if (vsanModeFromSetting) {
        navigate('/vsan/dashboard');
      } else if (hciModeFromSetting) {
        navigate('/hci/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setIsError(true);
    }
  };

  return (
    <Form
      name="basic"
      style={{ width: '368px' }}
      initialValues={{ login: true }}
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
      requiredMark={false}
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
            width: '100%',
          }}
        />
      )}
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: 'Please input your username!' }]}
        className="mb-[27px]"
      >
        <Input style={{ height: 40 }} />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: 'Please input your password!' },
          { min: 5, message: 'Password must be at least 5 characters long!' },
        ]}
        className="mb-[27px]"
      >
        <Input.Password style={{ height: 40 }} />
      </Form.Item>

      <Form.Item className="mb-0">
        <Button htmlType="submit" type="primary">
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
};

export { AuthForm };
