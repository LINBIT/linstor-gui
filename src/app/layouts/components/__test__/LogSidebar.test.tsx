// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { message } from 'antd';

import LogSidebar from '../LogSidebar';
import { logManager } from '@app/utils/toast';

const seedLogs = () => {
  logManager.addLog({ ret_code: 1, message: 'Node created' }, '/v1/nodes');
  logManager.addLog({ ret_code: -1, message: 'Boom', cause: 'bad input', details: 'more info' }, '/v1/resources');
};

const badgeCount = (container: HTMLElement) =>
  container.querySelector('.ant-scroll-number')?.getAttribute('title') ?? null;

const openDrawer = async (container: HTMLElement) => {
  const icon = await waitFor(() => {
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    return svg as SVGElement;
  });
  fireEvent.click(icon);
  await screen.findByText('Logs');
};

describe('LogSidebar', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    message.destroy();
  });

  it('shows the unread count on the badge', () => {
    seedLogs();
    const { container } = render(<LogSidebar />);
    expect(badgeCount(container)).toBe('2');
  });

  it('opens the drawer with the log list and the detail of a clicked entry', async () => {
    seedLogs();
    const { container } = render(<LogSidebar />);
    await openDrawer(container);

    expect(screen.getByText('/v1/nodes')).toBeInTheDocument();
    fireEvent.click(screen.getByText('/v1/resources'));

    expect(screen.getByText('Log Detail')).toBeInTheDocument();
    expect(screen.getByText('URL:').parentElement).toHaveTextContent('/v1/resources');
    expect(screen.getByText('Message:').parentElement).toHaveTextContent('Boom');
    expect(screen.getByText('Cause:').parentElement).toHaveTextContent('bad input');
    expect(screen.getByText('Details:').parentElement).toHaveTextContent('more info');

    fireEvent.click(screen.getByRole('button', { name: 'Back to Logs' }));
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('/v1/nodes')).toBeInTheDocument();
  });

  it('marks a single log as read', async () => {
    seedLogs();
    const { container } = render(<LogSidebar />);
    await openDrawer(container);

    fireEvent.click(screen.getByText('/v1/resources'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Read' }));

    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(badgeCount(container)).toBe('1');
    expect(logManager.getLogs('/v1/resources')[0].read).toBe(true);
    expect(logManager.getLogs('/v1/nodes')[0].read).toBe(false);
  });

  it('marks every log as read', async () => {
    seedLogs();
    const { container } = render(<LogSidebar />);
    await openDrawer(container);

    fireEvent.click(screen.getByRole('button', { name: 'Mark All as Read' }));

    expect(badgeCount(container)).toBeNull();
    expect(logManager.getLogs().every((log) => log.read)).toBe(true);
  });

  it('clears every log after confirmation', async () => {
    seedLogs();
    const { container } = render(<LogSidebar />);
    await openDrawer(container);

    fireEvent.click(screen.getByRole('button', { name: 'Clear All Logs' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(screen.queryByText('/v1/nodes')).toBeNull());
    expect(logManager.getLogs()).toEqual([]);
    expect(badgeCount(container)).toBeNull();
  });

  it('picks up logs written after mount through the storage event', () => {
    const { container } = render(<LogSidebar />);
    expect(badgeCount(container)).toBeNull();

    act(() => {
      logManager.addLog({ ret_code: 1, message: 'later' }, '/v1/later');
    });

    expect(badgeCount(container)).toBe('1');
  });
});
