// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  getScheduleList: vi.fn(),
  deleteSchedule: vi.fn(),
  createSchedule: vi.fn(),
  modifySchedule: vi.fn(),
}));

import { getScheduleList, deleteSchedule } from '../../api';
import { List } from '../List';

const schedules = [
  { schedule_name: 'nightly', full_cron: '0 2 * * *', inc_cron: '0 * * * *', keep_local: 3, keep_remote: 7, on_failure: 'SKIP' },
  { schedule_name: 'weekly', full_cron: '0 0 * * 0', on_failure: 'RETRY', max_retries: 2 },
];

const renderList = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  return render(
    <QueryClientProvider client={client}>
      <List />
    </QueryClientProvider>,
  );
};

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

const openRowMenu = async (name: string) => {
  fireEvent.mouseEnter(within(rowOf(name)).getByRole('img', { name: 'more' }));
  let menu: HTMLElement | undefined;
  await waitFor(() => {
    const open = screen
      .getAllByRole('menu')
      .filter((m) => !m.closest('.ant-dropdown')?.classList.contains('ant-dropdown-hidden'));
    expect(open).toHaveLength(1);
    menu = open[0];
  });
  return menu as HTMLElement;
};

describe('schedule List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The endpoint wraps the list one level deeper than the others.
    vi.mocked(getScheduleList).mockResolvedValue({ data: { data: schedules } } as never);
    vi.mocked(deleteSchedule).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('lists the schedules, showing "All" where no keep count is set', async () => {
    renderList();
    const nightly = (await screen.findByText('nightly')).closest('tr') as HTMLElement;
    expect(within(nightly).getByText('0 2 * * *')).toBeInTheDocument();
    expect(within(nightly).getByText('0 * * * *')).toBeInTheDocument();
    expect(within(nightly).getByText('3')).toBeInTheDocument();
    expect(within(nightly).getByText('7')).toBeInTheDocument();
    expect(within(nightly).getByText('SKIP')).toBeInTheDocument();

    const weekly = rowOf('weekly');
    expect(within(weekly).getAllByText('All')).toHaveLength(2);
    expect(within(weekly).getByText('RETRY')).toBeInTheDocument();
    expect(screen.getByText('Total 2 items')).toBeInTheDocument();
  });

  it('filters by name as you type, case-insensitively', async () => {
    renderList();
    await screen.findByText('nightly');
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'WEEK' } });
    expect(screen.queryByText('nightly')).not.toBeInTheDocument();
    expect(screen.getByText('weekly')).toBeInTheDocument();
    expect(screen.getByText('Total 1 items')).toBeInTheDocument();
  });

  it('deletes only after the confirm, then reports and refetches', async () => {
    renderList();
    await screen.findByText('nightly');
    const menu = await openRowMenu('nightly');
    fireEvent.click(within(menu).getByText('Delete'));
    expect(await screen.findByText('Delete this schedule?')).toBeInTheDocument();
    expect(deleteSchedule).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteSchedule).toHaveBeenCalledWith('nightly'));
    expect(await screen.findByText('Schedule deleted successfully')).toBeInTheDocument();
    await waitFor(() => expect(getScheduleList).toHaveBeenCalledTimes(2));
  });

  it('reports a failed delete', async () => {
    vi.mocked(deleteSchedule).mockRejectedValue(new Error('in use'));
    renderList();
    await screen.findByText('nightly');
    const menu = await openRowMenu('nightly');
    fireEvent.click(within(menu).getByText('Delete'));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    expect(await screen.findByText('Delete failed: Error: in use')).toBeInTheDocument();
    expect(getScheduleList).toHaveBeenCalledTimes(1);
  });

  it('opens the edit dialog for the row from its menu', async () => {
    renderList();
    await screen.findByText('weekly');
    const menu = await openRowMenu('weekly');
    fireEvent.click(within(menu).getByText('Edit'));
    expect(await screen.findByText('Edit Schedule')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter schedule name')).toHaveValue('weekly');
  });

  it('shows an empty table when there are no schedules', async () => {
    vi.mocked(getScheduleList).mockResolvedValue({ data: { data: [] } } as never);
    renderList();
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
  });
});
