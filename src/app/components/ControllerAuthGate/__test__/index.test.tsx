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

  it('returns to the token prompt when a controller-auth-required event is emitted', async () => {
    mockGet.mockResolvedValueOnce({ data: { version: '1.0.0' } });
    window.localStorage.setItem('LINSTOR_CONTROLLER_AUTH_TOKEN', 'existing-token');

    render(
      <ControllerAuthGate>
        <div>protected content</div>
      </ControllerAuthGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(CONTROLLER_AUTH_REQUIRED_EVENT));
    });

    await waitFor(() => {
      expect(screen.getByText('Controller Token Required')).toBeInTheDocument();
    });

    expect(screen.getByText('Your controller session expired. Enter a valid token to continue.')).toBeInTheDocument();
    expect(getControllerAuthToken()).toBeNull();
  });
});
