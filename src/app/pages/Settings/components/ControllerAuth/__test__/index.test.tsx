// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ControllerAuth from '..';

const mockGet = vi.fn();
const mockPost = vi.fn();
const successMessage = vi.fn();
const errorMessage = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@app/requests', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  return {
    ...actual,
    message: {
      success: (...args: unknown[]) => successMessage(...args),
      error: (...args: unknown[]) => errorMessage(...args),
    },
  };
});

describe('Settings ControllerAuth tab', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGet.mockReset();
    mockPost.mockReset();
    successMessage.mockReset();
    errorMessage.mockReset();
  });

  it('shows missing-token status when no token is stored', () => {
    render(<ControllerAuth />);

    expect(screen.getByText('settings:controller_auth_token_missing')).toBeInTheDocument();
  });

  it('verifies and saves a newly entered token', async () => {
    mockGet.mockResolvedValueOnce({ data: { version: '1.31.0' } });

    render(<ControllerAuth />);

    fireEvent.change(screen.getByPlaceholderText('settings:controller_auth_token_placeholder'), {
      target: { value: 'fresh-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_save' }));

    await waitFor(() => {
      expect(successMessage).toHaveBeenCalled();
    });

    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBe('fresh-token');
  });

  it('clears the stored token', async () => {
    window.localStorage.setItem('LINSTOR_CONTROLLER_AUTH_TOKEN', 'stored-token');

    render(<ControllerAuth />);

    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_clear' }));

    await waitFor(() => {
      expect(successMessage).toHaveBeenCalled();
    });

    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBeNull();
    expect(screen.getByText('settings:controller_auth_token_missing')).toBeInTheDocument();
  });

  it('initializes token auth and stores the returned token', async () => {
    mockPost.mockResolvedValueOnce({
      data: [{ obj_refs: { token: 'init-token' } }],
    });
    mockGet.mockResolvedValueOnce({ data: { version: '1.31.0' } });

    render(<ControllerAuth />);

    fireEvent.click(screen.getAllByRole('button', { name: 'settings:controller_auth_initialize' })[0]);

    await waitFor(() => {
      expect(successMessage).toHaveBeenCalled();
    });

    expect(mockPost).toHaveBeenCalledWith('/v1/controller/auth/initialize-token-auth', {
      only_satellites: false,
      description: 'linstor-gui',
      no_https: true,
    });
    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBe('init-token');
  });
});
