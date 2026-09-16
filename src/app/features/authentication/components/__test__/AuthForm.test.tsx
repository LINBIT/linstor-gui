// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const login = vi.fn();
let uiMode = 'NORMAL';
vi.mock('react-redux', () => ({
  useDispatch: () => ({ auth: { login } }),
  useSelector: (selector: (s: unknown) => unknown) => selector({ setting: { mode: uiMode } }),
}));
vi.mock('@app/models/setting', () => ({
  UIMode: { NORMAL: 'NORMAL', VSAN: 'VSAN', HCI: 'HCI' },
}));
const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

import { AuthForm } from '../AuthForm/AuthForm';

const fill = (username: string, password: string) => {
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    login.mockResolvedValue(true);
  });

  it('requires both fields and a password of at least five characters', async () => {
    render(<AuthForm />);
    submit();
    expect(await screen.findByText('Please input your username!')).toBeInTheDocument();
    expect(screen.getByText('Please input your password!')).toBeInTheDocument();

    fill('admin', 'abc');
    submit();
    expect(await screen.findByText('Password must be at least 5 characters long!')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('logs in and lands on the dashboard of the current mode', async () => {
    const { unmount } = render(<AuthForm />);
    fill('admin', 'secret');
    submit();
    await waitFor(() => expect(login).toHaveBeenCalledWith({ username: 'admin', password: 'secret' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'));
    unmount();

    uiMode = 'HCI';
    render(<AuthForm />);
    fill('admin', 'secret');
    submit();
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('/hci/dashboard'));
  });

  it('prefers an explicit redirect over the mode default, except for the root', async () => {
    uiMode = 'VSAN';
    const { unmount } = render(<AuthForm redirectTo="/snapshot" />);
    fill('admin', 'secret');
    submit();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/snapshot'));
    unmount();

    render(<AuthForm redirectTo="/" />);
    fill('admin', 'secret');
    submit();
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('/vsan/dashboard'));
  });

  it('shows a dismissible error on a refused login', async () => {
    login.mockResolvedValue(false);
    render(<AuthForm />);
    fill('admin', 'wrong-pw');
    submit();
    expect(await screen.findByText('Please check your username and password and try again')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() =>
      expect(screen.queryByText('Please check your username and password and try again')).not.toBeInTheDocument(),
    );
  });
});
