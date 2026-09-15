// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import CronInput from '../CronInput';

const input = () => screen.getByPlaceholderText('Cron Expression') as HTMLInputElement;

describe('CronInput', () => {
  it('starts from the given value, or midnight daily by default', () => {
    const { unmount } = render(<CronInput />);
    expect(input()).toHaveValue('0 0 * * *');
    unmount();
    render(<CronInput value="*/5 * * * *" />);
    expect(input()).toHaveValue('*/5 * * * *');
  });

  it('commits a valid expression on blur', () => {
    const onChange = vi.fn();
    render(<CronInput onChange={onChange} />);
    fireEvent.change(input(), { target: { value: '30 2 * * 1' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(input());
    expect(onChange).toHaveBeenCalledWith('30 2 * * 1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects an invalid expression on blur and keeps the last good value', () => {
    const onChange = vi.fn();
    render(<CronInput onChange={onChange} />);
    fireEvent.change(input(), { target: { value: '99 99 * *' } });
    fireEvent.blur(input());
    expect(screen.getByText('Invalid cron expression. Please check the format.')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    // Typing again clears the error until the next blur.
    fireEvent.change(input(), { target: { value: '99 99 * * *' } });
    expect(screen.queryByText('Invalid cron expression. Please check the format.')).not.toBeInTheDocument();
  });

  it('flags an empty expression', () => {
    render(<CronInput />);
    fireEvent.change(input(), { target: { value: '   ' } });
    fireEvent.blur(input());
    expect(screen.getByText('Cron expression cannot be empty')).toBeInTheDocument();
  });

  it('flags an invalid initial value straight away', () => {
    render(<CronInput value="not a cron" />);
    expect(screen.getByText('Invalid cron expression. Please check the format.')).toBeInTheDocument();
  });

  it('opens the editor with the next five run times and applies on OK', async () => {
    const onChange = vi.fn();
    render(<CronInput value="0 0 * * *" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Cron Editor' }));

    expect(await screen.findByText('Cron Editor')).toBeInTheDocument();
    expect(screen.getByText('Next 5 Execution Times:')).toBeInTheDocument();
    await waitFor(() => expect(document.querySelectorAll('.ant-modal pre')).toHaveLength(5));
    // Every preview is a midnight.
    for (const pre of Array.from(document.querySelectorAll('.ant-modal pre'))) {
      expect(pre.textContent).toMatch(/00:00:00/);
    }

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onChange).toHaveBeenCalledWith('0 0 * * *');
    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
  });

  it('cancel in the editor changes nothing', async () => {
    const onChange = vi.fn();
    render(<CronInput onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Cron Editor' }));
    await screen.findByText('Cron Editor');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(input()).toHaveValue('0 0 * * *');
  });
});
