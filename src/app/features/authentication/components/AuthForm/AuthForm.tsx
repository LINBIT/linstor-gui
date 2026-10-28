// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Form } from 'antd';
import { Input } from '@app/components/Input';
import { useNavigate } from 'react-router-dom';
import { UIMode } from '@app/features/settings/types';
import { useUIMode } from '@app/features/settings/useSettings';
import { useAuth } from '@app/features/authentication/useAuth';
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
  const { t } = useTranslation();
  const [isError, setIsError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const mode = useUIMode();
  const vsanModeFromSetting = mode === UIMode.VSAN;
  const hciModeFromSetting = mode === UIMode.HCI;

  const onFinish = async (values: FormType) => {
    const res = await login({ username: values.username, password: values.password });
    if (res) {
      // login() handles needsPasswordChange based on hideDefaultCredential

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
      className="w-[368px]"
      initialValues={{ login: true }}
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
      requiredMark={false}
    >
      {isError && (
        <Alert
          description={t('users:please_check_username_password_try')}
          type="error"
          closable
          onClose={() => setIsError(false)}
          className="mb-4 mt-4 w-full"
        />
      )}
      <Form.Item
        label={t('common:username')}
        name="username"
        rules={[{ required: true, message: t('common:username_required') }]}
        className="mb-[27px]"
      >
        <Input className="h-[40px]" />
      </Form.Item>

      <Form.Item
        label={t('common:password')}
        name="password"
        rules={[
          { required: true, message: t('common:password_required') },
          { min: 5, message: t('common:password_min_length') },
        ]}
        className="mb-[27px]"
      >
        <Input.Password className="h-[40px]" />
      </Form.Item>

      <Form.Item className="mb-0">
        <Button htmlType="submit" type="primary">
          {t('common:log_in')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { AuthForm };
