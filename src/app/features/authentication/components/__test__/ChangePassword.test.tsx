// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { makeAuth, makeSettings } from '@app/__test__/helpers';
import type { AuthContextValue } from '@app/features/authentication/useAuth';
import type { SettingsContextValue } from '@app/features/settings/useSettings';

const ctx = vi.hoisted(() => ({
  auth: undefined as unknown as AuthContextValue,
  settings: undefined as unknown as SettingsContextValue,
}));
vi.mock('@app/features/authentication/useAuth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/authentication/useAuth')>()),
  useAuth: () => ctx.auth,
}));
vi.mock('@app/features/settings/useSettings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/settings/useSettings')>()),
  useSettings: () => ctx.settings,
}));

import { ChangePassword } from '../ChangePassword/ChangePassword';

const KEY = 'linstorname';

const typePasswords = (current: string | null, next: string, confirm = next) => {
  if (current !== null) {
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: current } });
  }
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: confirm } });
};

describe('ChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(KEY, 'admin');
    // The success path schedules a re-login plus window.location.reload one
    // second later; keep that off the real clock.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    ctx.auth = makeAuth();
    ctx.settings = makeSettings();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('a regular change verifies the current password and clears the first-login flag for admin', async () => {
    render(<ChangePassword />);
    fireEvent.click(screen.getByText('Change password'));
    await screen.findByLabelText('Current password');
    typePasswords('admin', 'newer-pw');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() =>
      expect(ctx.auth.changePassword).toHaveBeenCalledWith({
        user: 'admin',
        newPassword: 'newer-pw',
        oldPassword: 'admin',
      }),
    );
    expect(await screen.findByText('Password changed successfully')).toBeInTheDocument();
    // admin/admin is gone, so the login page stops advertising it.
    await waitFor(() =>
      expect(ctx.settings.saveKey).toHaveBeenCalledWith({ needsPasswordChange: false, hideDefaultCredential: true }),
    );
    expect(ctx.auth.setNeedsPasswordChange).toHaveBeenCalledWith(false);
  });

  it('an admin resetting the "admin" user also retires the default-credential hint', async () => {
    render(<ChangePassword admin user="admin" />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await screen.findByLabelText('New password');
    typePasswords(null, 'admin-new');
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset password' }).at(-1) as HTMLElement);
    await waitFor(() =>
      expect(ctx.settings.saveKey).toHaveBeenCalledWith({ needsPasswordChange: false, hideDefaultCredential: true }),
    );
  });

  it('rejects a mismatched confirmation and a short password before submitting', async () => {
    render(<ChangePassword />);
    fireEvent.click(screen.getByText('Change password'));
    await screen.findByLabelText('Current password');
    typePasswords('admin', 'abc');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('Password must be at least 5 characters long!')).toBeInTheDocument();

    typePasswords(null, 'abcdef', 'abcdeg');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('The two passwords that you entered do not match!')).toBeInTheDocument();
    expect(ctx.auth.changePassword).not.toHaveBeenCalled();
  });

  it('reports a refused change with a hint about the current password', async () => {
    vi.mocked(ctx.auth.changePassword).mockResolvedValue(false);
    render(<ChangePassword />);
    fireEvent.click(screen.getByText('Change password'));
    await screen.findByLabelText('Current password');
    typePasswords('wrong', 'newer-pw');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText(/Password change failed/)).toBeInTheDocument();
    expect(ctx.settings.saveKey).not.toHaveBeenCalled();
  });

  it('admin mode resets another user without asking for the current password', async () => {
    render(<ChangePassword admin user="bob" />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await screen.findByLabelText('New password');
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();
    typePasswords(null, 'bob-new');
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset password' }).at(-1) as HTMLElement);
    await waitFor(() => expect(ctx.auth.resetPassword).toHaveBeenCalledWith({ user: 'bob', newPassword: 'bob-new' }));
    // Resetting someone else never touches the first-login flag.
    expect(ctx.settings.saveKey).not.toHaveBeenCalled();
    expect(ctx.auth.login).not.toHaveBeenCalled();
  });

  it('the forced first-login change opens by itself and skips the old password', async () => {
    render(<ChangePassword defaultOpen />);
    await screen.findByLabelText('New password');
    // No manual trigger when the prompt is forced open.
    expect(screen.queryByAltText('changepassword')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();
    typePasswords(null, 'fresh-pw');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    await waitFor(() =>
      expect(ctx.auth.updatePassword).toHaveBeenCalledWith({ user: 'admin', newPassword: 'fresh-pw' }),
    );
  });

  it('closing the forced prompt hides it for the session, "don\'t show again" for good', async () => {
    const { unmount } = render(<ChangePassword defaultOpen />);
    await screen.findByLabelText('New password');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(ctx.settings.saveKey).toHaveBeenCalledWith({ hideDefaultCredential: true }));
    expect(ctx.auth.setNeedsPasswordChange).toHaveBeenCalledWith(false);
    unmount();
    vi.clearAllMocks();

    render(<ChangePassword defaultOpen />);
    await screen.findByLabelText('New password');
    fireEvent.click(screen.getByRole('button', { name: "Don't show this again" }));
    await waitFor(() =>
      expect(ctx.settings.saveKey).toHaveBeenCalledWith({
        needsPasswordChange: false,
        hideDefaultCredential: true,
      }),
    );
  });

  it('a non-admin closing the forced prompt changes no setting', async () => {
    localStorage.setItem(KEY, 'bob');
    render(<ChangePassword defaultOpen />);
    await screen.findByLabelText('New password');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await new Promise((r) => setTimeout(r, 20));
    expect(ctx.settings.saveKey).not.toHaveBeenCalled();
  });
});
