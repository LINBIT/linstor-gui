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
    // Modify Access Token only shows once token auth is initialized.
    expect(screen.queryByRole('button', { name: 'settings:controller_auth_enter_token' })).not.toBeInTheDocument();
    expect(screen.queryByText('settings:controller_auth_description')).not.toBeInTheDocument();
    expect(screen.getByText('settings:controller_auth_https_switch_title')).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/192.168.123.200:3371/)).toBeInTheDocument();
    expect(screen.queryByText('settings:controller_auth_save')).not.toBeInTheDocument();
    expect(screen.queryByText('settings:controller_auth_clear')).not.toBeInTheDocument();
  });

  it('initializes token auth and stores the returned token', async () => {
    // Mount probe: token auth not yet enabled.
    mockGet.mockResolvedValueOnce({ data: {} });
    mockPost.mockResolvedValueOnce({
      data: [{ obj_refs: { token: 'init-token' } }],
    });

    render(<ControllerAuth />);

    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_initialize' }));

    await waitFor(() => {
      expect(successMessage).toHaveBeenCalled();
    });

    expect(mockPost).toHaveBeenCalledWith('/v1/controller/auth/initialize-token-auth', {
      only_satellites: false,
      description: 'linstor-gui',
    });
    expect(mockGet).toHaveBeenCalledWith('/v1/controller/properties');
    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBe('init-token');
    expect(screen.getByText('settings:controller_auth_initialized_title')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('init-token');
    // After initialization the pre-init HTTPS banner is hidden, so the URL only
    // appears once (in the modal) instead of being duplicated.
    expect(screen.getAllByText(/https:\/\/192.168.123.200:3371/)).toHaveLength(1);
  });

  it('hides the initialize button when token auth is already enabled on mount', async () => {
    mockGet.mockResolvedValueOnce({ data: { 'Auth/TokenAuthenticationEnabled': 'true' } });

    render(<ControllerAuth />);

    await waitFor(() => {
      expect(screen.getByText('settings:controller_auth_already_initialized')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'settings:controller_auth_initialize' })).not.toBeInTheDocument();
    // Manual token entry remains available.
    expect(screen.getByRole('button', { name: 'settings:controller_auth_enter_token' })).toBeInTheDocument();
  });

  it('disables token auth via the controller property and clears local auth state', async () => {
    window.localStorage.setItem('LINSTOR_CONTROLLER_AUTH_TOKEN', 'existing-token');
    window.localStorage.setItem('LINSTOR_CONTROLLER_AUTH_REQUIRED', 'true');
    // Mount probe: token auth is enabled.
    mockGet.mockResolvedValueOnce({ data: { 'Auth/TokenAuthenticationEnabled': 'true' } });
    mockPost.mockResolvedValueOnce({ data: [] });

    render(<ControllerAuth />);

    // The disable action only appears once we know auth is enabled.
    const trigger = await screen.findByRole('button', { name: 'settings:controller_auth_disable' });
    fireEvent.click(trigger);

    // Popconfirm opens a second button with the same label; confirm on it.
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'settings:controller_auth_disable' }).length).toBeGreaterThan(1);
    });
    const buttons = screen.getAllByRole('button', { name: 'settings:controller_auth_disable' });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(successMessage).toHaveBeenCalledWith('settings:controller_auth_disabled');
    });

    expect(mockPost).toHaveBeenCalledWith('/v1/controller/properties', {
      delete_props: ['Auth/TokenAuthenticationEnabled'],
    });
    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBeNull();
    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_REQUIRED')).toBeNull();
    // Disabling flips the UI back to offering initialization.
    expect(screen.getByRole('button', { name: 'settings:controller_auth_initialize' })).toBeInTheDocument();
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
    // Modify Access Token only appears once token auth is enabled.
    mockGet.mockResolvedValueOnce({ data: { 'Auth/TokenAuthenticationEnabled': 'true' } });
    render(<ControllerAuth />);

    fireEvent.click(await screen.findByRole('button', { name: 'settings:controller_auth_enter_token' }));
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
    mockGet.mockResolvedValueOnce({ data: { 'Auth/TokenAuthenticationEnabled': 'true' } });
    render(<ControllerAuth />);

    fireEvent.click(await screen.findByRole('button', { name: 'settings:controller_auth_enter_token' }));
    fireEvent.click(screen.getByRole('button', { name: 'settings:controller_auth_save' }));

    await waitFor(() => {
      expect(errorMessage).toHaveBeenCalledWith('settings:controller_auth_token_required');
    });

    expect(window.localStorage.getItem('LINSTOR_CONTROLLER_AUTH_TOKEN')).toBeNull();
  });
});
