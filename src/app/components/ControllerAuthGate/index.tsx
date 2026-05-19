// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Card, Form, Input, Spin, Typography } from 'antd';

import { Button } from '@app/components/Button';
import service from '@app/requests';
import {
  CONTROLLER_AUTH_REQUIRED_EVENT,
  clearControllerAuthToken,
  getControllerAuthToken,
  isControllerAuthRequiredError,
  setControllerAuthRequired,
  setControllerAuthToken,
} from '@app/utils/controllerAuth';
import { compareVersions } from '@app/utils/version';
import { MIN_API_VERSION } from '@app/hooks';

const TOKEN_AUTH_PROPERTY = 'Auth/TokenAuthenticationEnabled';

type AuthState = 'checking' | 'authorized' | 'requires_token';

interface ControllerAuthGateProps {
  children: React.ReactNode;
}

const ControllerAuthGate = ({ children }: ControllerAuthGateProps) => {
  const [form] = Form.useForm<{ token: string }>();
  const [state, setState] = useState<AuthState>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mirror the latest state into a ref so event handlers can branch on it
  // synchronously (event listeners close over the state value at registration
  // time, but we need the current value to break the auth-required loop).
  const stateRef = useRef<AuthState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Guard against re-entrant verifyAccess calls. Without this, the response
  // interceptor's `emitControllerAuthRequired()` on a 401 triggers
  // handleAuthRequired → verifyAccess → another 401 → another emit → infinite
  // loop, clearing any freshly-submitted token along the way.
  const verifyingRef = useRef(false);

  const verifyAccess = useCallback(
    async ({
      fromSubmit = false,
      promptMessageOverride,
    }: { fromSubmit?: boolean; promptMessageOverride?: string } = {}) => {
      // Don't pile up concurrent verifies: a 401 triggers the response
      // interceptor which dispatches CONTROLLER_AUTH_REQUIRED_EVENT; that
      // listener would otherwise call verifyAccess again mid-flight.
      if (verifyingRef.current) return;
      verifyingRef.current = true;

      try {
        const hadToken = Boolean(getControllerAuthToken());

        setState('checking');
        if (!fromSubmit) {
          setErrorMessage(null);
        }

        // Allow the version probe through even if a previous session left the
        // "auth required" flag set — we want the version + property checks to
        // decide whether the prompt is actually needed.
        setControllerAuthRequired(false);

        const promptForToken = (defaultMessage: string | null) => {
          setControllerAuthRequired(true);
          clearControllerAuthToken();
          setState('requires_token');
          setErrorMessage(promptMessageOverride ?? defaultMessage);
        };

        const invalidTokenMessage =
          fromSubmit || hadToken
            ? 'The controller token is invalid or expired. Enter a valid token to continue.'
            : null;

        // Step 1: probe the controller version. The version endpoint normally
        // does not require auth — a 401 here means the controller demands a
        // token for everything.
        let restApiVersion: string | undefined;
        try {
          const versionRes = await service.get('/v1/controller/version');
          restApiVersion = versionRes.data?.rest_api_version;
        } catch (error) {
          if (isControllerAuthRequiredError(error)) {
            promptForToken(invalidTokenMessage);
            return;
          }
          // Preserve the existing fallback for non-auth failures.
          setState('authorized');
          return;
        }

        // Step 2: token authentication is only meaningful on REST API >= 1.28.0.
        if (!compareVersions(restApiVersion, MIN_API_VERSION.AUTH_TOKENS)) {
          setState('authorized');
          return;
        }

        // Step 3: only require a token when the controller has actually opted
        // into it via Auth/TokenAuthenticationEnabled.
        try {
          const propsRes = await service.get('/v1/controller/properties');
          const tokenAuthEnabled = propsRes.data?.[TOKEN_AUTH_PROPERTY] === 'true';

          if (!tokenAuthEnabled) {
            setState('authorized');
            return;
          }

          if (!hadToken) {
            promptForToken(null);
            return;
          }

          setControllerAuthRequired(true);
          setState('authorized');
        } catch (error) {
          if (isControllerAuthRequiredError(error)) {
            promptForToken(invalidTokenMessage);
            return;
          }
          // Couldn't read properties for non-auth reasons (older controller,
          // network glitch, etc.). Fall back to the existing behavior.
          setState('authorized');
        }
      } finally {
        verifyingRef.current = false;
      }
    },
    [setState],
  );

  useEffect(() => {
    void verifyAccess();
  }, [verifyAccess]);

  useEffect(() => {
    const handleAuthRequired = () => {
      // Only react to mid-session 401s — i.e. when we were already in
      // `authorized`. Otherwise the response interceptor's 401 from the
      // initial version probe would loop back into another verifyAccess,
      // clearing any token the user just submitted along the way.
      if (stateRef.current !== 'authorized') return;
      clearControllerAuthToken();
      void verifyAccess({
        promptMessageOverride: 'Your controller session expired. Enter a valid token to continue.',
      });
    };

    window.addEventListener(CONTROLLER_AUTH_REQUIRED_EVENT, handleAuthRequired);

    return () => {
      window.removeEventListener(CONTROLLER_AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, [verifyAccess]);

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
