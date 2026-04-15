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
const warningMessage = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { url?: string }) => (params?.url ? `${key} ${params.url}` : key),
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
      warning: (...args: unknown[]) => warningMessage(...args),
    },
  };
});

describe('Settings ControllerAuth tab', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('LINSTOR_HOST', 'http://192.168.123.200:3370');
    mockGet.mockReset();
    mockPost.mockReset();
    successMessage.mockReset();
    errorMessage.mockReset();
    warningMessage.mockReset();
  });

  it('shows only the initialize action and HTTPS switch warning', () => {
    render(<ControllerAuth />);

    expect(screen.getByRole('button', { name: 'settings:controller_auth_initialize' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'settings:controller_auth_enter_token' })).toBeInTheDocument();
    expect(screen.queryByText('settings:controller_auth_description')).not.toBeInTheDocument();
    expect(screen.getByText('settings:controller_auth_https_switch_title')).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/192.168.123.200:3371/)).toBeInTheDocument();
    expect(screen.queryByText('settings:controller_auth_save')).not.toBeInTheDocument();
    expect(screen.queryByText('settings:controller_auth_clear')).not.toBeInTheDocument();
  });

  it('initializes token auth and stores the returned token', async () => {
    mockPost.mockResolvedValueOnce({
      data: [{ obj_refs: { token: 'init-token' } }],
    });
    mockGet.mockResolvedValueOnce({ data: { version: '1.31.0' } });

    render(<ControllerAuth />);

    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_initialize' }));

    await waitFor(() => {
      expect(successMessage).toHaveBeenCalled();
    });

    expect(mockPost).toHaveBeenCalledWith('/v1/controller/auth/initialize-token-auth', {
      only_satellites: false,
      description: 'linstor-gui',
    });
    expect(mockGet).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBe('init-token');
    expect(screen.getByText('settings:controller_auth_initialized_title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('init-token')).toBeInTheDocument();
    expect(screen.getAllByText(/https:\/\/192.168.123.200:3371/)).toHaveLength(2);
  });

  it('handles already enabled token auth without requiring a returned token', async () => {
    mockPost.mockResolvedValueOnce({
      data: [{ message: 'Token authentication is already enabled' }],
    });

    render(<ControllerAuth />);

    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_initialize' }));

    await waitFor(() => {
      expect(successMessage).not.toHaveBeenCalled();
      expect(warningMessage).toHaveBeenCalledWith('settings:controller_auth_already_enabled');
      expect(errorMessage).not.toHaveBeenCalled();
      expect(screen.getByText('settings:controller_auth_already_enabled_notice')).toBeInTheDocument();
    });

    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_REQUIRED')).toBe('true');
    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBeNull();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('stores a manually entered controller token', async () => {
    render(<ControllerAuth />);

    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_enter_token' }));
    fireEvent.change(screen.getByPlaceholderText('settings:controller_auth_token_placeholder'), {
      target: { value: 'manual-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_save' }));

    await waitFor(() => {
      expect(successMessage).toHaveBeenCalledWith('settings:controller_auth_token_saved');
    });

    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_REQUIRED')).toBe('true');
    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBe('manual-token');
  });

  it('rejects an empty manually entered controller token', async () => {
    render(<ControllerAuth />);

    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_enter_token' }));
    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_save' }));

    await waitFor(() => {
      expect(errorMessage).toHaveBeenCalledWith('settings:controller_auth_token_required');
    });

    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBeNull();
  });
});
