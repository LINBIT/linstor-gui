// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import AuthTokens from '..';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
const successMessage = vi.fn();
const errorMessage = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { total?: number }) => {
      if (key === 'authToken:total_items') {
        return `Total ${params?.total ?? 0} items`;
      }

      return key;
    },
  }),
}));

vi.mock('@app/requests', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
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

describe('AuthTokens page', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
    successMessage.mockReset();
    errorMessage.mockReset();
  });

  it('loads and displays auth token metadata', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        count: 2,
        list: [
          {
            id: 1,
            description: 'gui-ha-lab',
            created_at: '2026-04-13T00:50:23Z',
            is_active: true,
            is_user_token: true,
            ip_filter: null,
            expires_at: null,
          },
          {
            id: 11,
            description: 'reinti',
            created_at: '2026-04-14T07:35:44Z',
            is_active: true,
            is_user_token: true,
            ip_filter: null,
            expires_at: null,
          },
          {
            id: 12,
            description: 'satellite:gui01',
            created_at: '2026-04-14T07:35:44Z',
            is_active: true,
            is_user_token: false,
            ip_filter: '192.168.123.117',
            expires_at: null,
          },
        ],
      },
    });

    render(<AuthTokens />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/v1/controller/auth/token');
    });

    expect(screen.getByText('gui-ha-lab')).toBeInTheDocument();
    expect(screen.getByText('reinti')).toBeInTheDocument();
    expect(screen.queryByText('satellite:gui01')).not.toBeInTheDocument();
    expect(screen.getByText('2026-04-13 00:50:23')).toBeInTheDocument();
    expect(screen.getByText('2026-04-14 07:35:44')).toBeInTheDocument();
    expect(screen.getAllByText('Yes')).toHaveLength(4);
  });

  it('shows an error when loading auth tokens fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('boom'));

    render(<AuthTokens />);

    await waitFor(() => {
      expect(errorMessage).toHaveBeenCalledWith('boom');
    });
  });

  it('creates a token and displays the returned token once', async () => {
    mockGet.mockResolvedValue({
      data: {
        count: 0,
        list: [],
      },
    });
    mockPost.mockResolvedValueOnce({
      data: [{ obj_refs: { token: 'created-token' } }],
    });

    render(<AuthTokens />);

    fireEvent.click(screen.getByRole('button', { name: /authToken:create/ }));
    fireEvent.change(screen.getByLabelText('authToken:description'), { target: { value: 'new-token' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/v1/controller/auth/token', { description: 'new-token' });
    });

    expect(screen.getByDisplayValue('created-token')).toBeInTheDocument();
  });
});
