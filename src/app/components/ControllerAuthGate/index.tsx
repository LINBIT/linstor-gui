// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Card, Form, Input, Spin, Typography } from 'antd';

import { Button } from '@app/components/Button';
import service from '@app/requests';
import {
  CONTROLLER_AUTH_REQUIRED_EVENT,
  clearControllerAuthToken,
  getControllerAuthToken,
  isControllerAuthRequired,
  isControllerAuthRequiredError,
  setControllerAuthRequired,
  setControllerAuthToken,
} from '@app/utils/controllerAuth';

type AuthState = 'checking' | 'authorized' | 'requires_token';

interface ControllerAuthGateProps {
  children: React.ReactNode;
}

const ControllerAuthGate = ({ children }: ControllerAuthGateProps) => {
  const [form] = Form.useForm<{ token: string }>();
  const [state, setState] = useState<AuthState>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const verifyAccess = useCallback(
    async ({ fromSubmit = false }: { fromSubmit?: boolean } = {}) => {
      const hadToken = Boolean(getControllerAuthToken());

      if (!hadToken && isControllerAuthRequired()) {
        setState('requires_token');
        setErrorMessage(null);
        return;
      }

      setState('checking');
      if (!fromSubmit) {
        setErrorMessage(null);
      }

      try {
        await service.get('/v1/controller/version');
        if (!hadToken) {
          setControllerAuthRequired(false);
        }
        setState('authorized');
      } catch (error) {
        if (isControllerAuthRequiredError(error)) {
          setControllerAuthRequired(true);
          clearControllerAuthToken();
          setState('requires_token');
          setErrorMessage(
            fromSubmit || hadToken
              ? 'The controller token is invalid or expired. Enter a valid token to continue.'
              : null,
          );
          return;
        }

        // Preserve the current GUI behavior for non-auth failures.
        setState('authorized');
      }
    },
    [setState],
  );

  useEffect(() => {
    void verifyAccess();
  }, [verifyAccess]);

  useEffect(() => {
    const handleAuthRequired = () => {
      setControllerAuthRequired(true);
      clearControllerAuthToken();
      setState('requires_token');
      setErrorMessage('Your controller session expired. Enter a valid token to continue.');
    };

    window.addEventListener(CONTROLLER_AUTH_REQUIRED_EVENT, handleAuthRequired);

    return () => {
      window.removeEventListener(CONTROLLER_AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, []);

  const handleSubmit = async ({ token }: { token: string }) => {
    const trimmedToken = token.trim();

    if (!trimmedToken) {
      return;
    }

    setSubmitting(true);
    setControllerAuthToken(trimmedToken);

    try {
      await verifyAccess({ fromSubmit: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'authorized') {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-4">
      <Card className="w-full max-w-[520px] shadow-sm">
        {state === 'checking' ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <Spin size="large" />
            <Typography.Text type="secondary">Checking controller authentication…</Typography.Text>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <Typography.Title level={3} className="!mb-2">
                Controller Token Required
              </Typography.Title>
              <Typography.Paragraph type="secondary" className="!mb-0">
                LINSTOR controller token authentication is enabled. Enter a valid Bearer token to continue.
              </Typography.Paragraph>
            </div>

            {errorMessage ? <Alert type="error" message={errorMessage} showIcon /> : null}

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                label="Controller Token"
                name="token"
                rules={[{ required: true, message: 'Please enter the controller token.' }]}
              >
                <Input.Password placeholder="Paste Bearer token" autoFocus />
              </Form.Item>

              <div className="flex justify-end">
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Continue
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Card>
    </main>
  );
};

export default ControllerAuthGate;
