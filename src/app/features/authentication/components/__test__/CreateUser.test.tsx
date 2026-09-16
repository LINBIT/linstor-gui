// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const register = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => ({ auth: { register } }),
}));

import { CreateUser } from '../CreateUser/CreateUser';

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add a user' }));
  await screen.findByLabelText('Username');
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Add' }));

describe('CreateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is disabled for non-admins', () => {
    render(<CreateUser disabled />);
    expect(screen.getByRole('button', { name: 'Add a user' })).toBeDisabled();
  });

  it('requires a username, a five-character password and a matching confirmation', async () => {
    render(<CreateUser />);
    await open();
    submit();
    expect(await screen.findByText('Please input your username!')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bob' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abcde' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'abcdf' } });
    submit();
    expect(await screen.findByText('The new password that you entered do not match!')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers the user and closes', async () => {
    render(<CreateUser />);
    await open();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bob' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abcde' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'abcde' } });
    submit();
    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({ username: 'bob', password: 'abcde', password_validate: 'abcde' }),
    );
    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
  });
});
