// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ControllerAuthGate from '..';
import {
  CONTROLLER_AUTH_REQUIRED_EVENT,
  createControllerAuthRequiredError,
  getControllerAuthToken,
  isControllerAuthRequired,
} from '@app/utils/controllerAuth';

const mockGet = vi.fn();

vi.mock('@app/requests', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('ControllerAuthGate', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGet.mockReset();
  });

  it('renders children when the controller probe succeeds', async () => {
    mockGet.mockResolvedValueOnce({ data: { version: '1.0.0' } });

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });
  });

  it('renders children without checking properties when the controller is older than 1.28.0', async () => {
    mockGet.mockResolvedValueOnce({ data: { rest_api_version: '1.27.0' } });

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/v1/controller/version');
  });

  it('renders children when token authentication is disabled on a 1.28.0+ controller', async () => {
    mockGet.mockResolvedValueOnce({ data: { rest_api_version: '1.28.0' } });
    mockGet.mockResolvedValueOnce({ data: { 'Auth/TokenAuthenticationEnabled': 'false' } });

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenNthCalledWith(2, '/v1/controller/properties');
  });

  it('shows the token prompt when version is recent and token authentication is enabled', async () => {
    mockGet.mockResolvedValueOnce({ data: { rest_api_version: '1.28.0' } });
    mockGet.mockResolvedValueOnce({ data: { 'Auth/TokenAuthenticationEnabled': 'true' } });

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('Controller Token Required')).toBeInTheDocument();
    });
  });

  it('shows the token prompt when the controller requires authentication', async () => {
    mockGet.mockRejectedValueOnce(createControllerAuthRequiredError());

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('Controller Token Required')).toBeInTheDocument();
    });

    expect(isControllerAuthRequired()).toBe(true);
  });

  it('stores the submitted token and retries the probe', async () => {
    mockGet.mockRejectedValueOnce(createControllerAuthRequiredError());
    mockGet.mockResolvedValueOnce({ data: { version: '1.0.0' } });

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('Controller Token Required')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Paste Bearer token'), {
      target: { value: 'new-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });

    expect(getControllerAuthToken()).toBe('new-token');
  });

  it('still re-checks the controller even when the browser remembers auth was required', async () => {
    // Persisted hint from a previous session should not skip the version /
    // property check — the controller may have changed.
    window.localStorage.setItem('LINSTOR_CONTROLLER_AUTH_REQUIRED', 'true');
    mockGet.mockResolvedValueOnce({ data: { rest_api_version: '1.27.0' } });

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });

    expect(mockGet).toHaveBeenCalledWith('/v1/controller/version');
    expect(isControllerAuthRequired()).toBe(false);
  });

  it('returns to the token prompt when a controller-auth-required event is emitted', async () => {
    // Initial probe: version + properties indicate token auth is enabled and
    // we have a valid token, so the user gets through to the protected content.
    mockGet.mockResolvedValueOnce({ data: { rest_api_version: '1.28.0' } });
    mockGet.mockResolvedValueOnce({ data: { 'Auth/TokenAuthenticationEnabled': 'true' } });
    window.localStorage.setItem('LINSTOR_CONTROLLER_AUTH_TOKEN', 'existing-token');

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });

    // After the session expires we re-verify; the property check still
    // reports token auth enabled, so the prompt comes back.
    mockGet.mockResolvedValueOnce({ data: { rest_api_version: '1.28.0' } });
    mockGet.mockResolvedValueOnce({ data: { 'Auth/TokenAuthenticationEnabled': 'true' } });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(CONTROLLER_AUTH_REQUIRED_EVENT));
    });

    await waitFor(() => {
      expect(screen.getByText('Controller Token Required')).toBeInTheDocument();
    });

    expect(screen.getByText('Your controller session expired. Enter a valid token to continue.')).toBeInTheDocument();
    expect(getControllerAuthToken()).toBeNull();
  });

  it('does not wipe a freshly submitted token if an auth-required event fires mid-probe', async () => {
    // Initial probe fails: GUI is in the requires_token state.
    mockGet.mockRejectedValueOnce(createControllerAuthRequiredError());

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('Controller Token Required')).toBeInTheDocument();
    });

    // User submits a token. The submit-triggered verifyAccess will probe
    // version + properties successfully — but BEFORE those promises resolve,
    // a stray auth-required event fires (the response interceptor would do
    // this on any concurrent 401). The handler should ignore it because the
    // gate is currently 'checking', not 'authorized'. Otherwise it would
    // clear the token mid-flight and produce an infinite loop.
    mockGet.mockResolvedValueOnce({ data: { rest_api_version: '1.28.0' } });
    mockGet.mockResolvedValueOnce({ data: { 'Auth/TokenAuthenticationEnabled': 'true' } });

    fireEvent.change(screen.getByPlaceholderText('Paste Bearer token'), {
      target: { value: 'good-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Fire the spurious event before the verify chain settles.
    await act(async () => {
      window.dispatchEvent(new CustomEvent(CONTROLLER_AUTH_REQUIRED_EVENT));
    });

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });

    expect(getControllerAuthToken()).toBe('good-token');
  });
});
