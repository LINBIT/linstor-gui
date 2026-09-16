// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  getScheduleByResource: vi.fn(),
  getScheduleByResourceName: vi.fn(),
  disableSchedule: vi.fn(),
  enableSchedule: vi.fn(),
  deleteBackupSchedule: vi.fn(),
}));

// The enable dialog has its own suite.
vi.mock('../EnableScheduleForm', () => ({
  default: () => <button>enable-form</button>,
}));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

let uiMode = 'NORMAL';
vi.mock('react-redux', () => ({
  useSelector: (selector: (s: unknown) => unknown) => selector({ setting: { mode: uiMode } }),
}));
vi.mock('@app/models/setting', () => ({
  UIMode: { NORMAL: 'NORMAL', VSAN: 'VSAN', HCI: 'HCI' },
}));

import {
  getScheduleByResource,
  getScheduleByResourceName,
  disableSchedule,
  enableSchedule,
  deleteBackupSchedule,
} from '../../api';
import { ScheduleByResourceList } from '../ScheduleByResourceList';

const rows = [
  {
    rsc_name: 'res-active',
    remote_name: 's3-a',
    schedule_name: 'nightly',
    last_snap_time: 1700000000000,
    next_exec_time: 1700086400000,
    next_planned_inc: 0,
    next_planned_full: 1700086400000,
    reason: '',
  },
  {
    rsc_name: 'res-off',
    remote_name: 's3-a',
    schedule_name: 'nightly',
    last_snap_time: 0,
    reason: 'disabled',
  },
  {
    rsc_name: 'res-none',
    remote_name: '',
    schedule_name: '',
    reason: 'none set',
  },
];

const renderList = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  return render(
    <QueryClientProvider client={client}>
      <ScheduleByResourceList />
    </QueryClientProvider>,
  );
};

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

const openRowMenu = async (name: string) => {
  fireEvent.mouseEnter(within(rowOf(name)).getByRole('button', { name: 'more' }));
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

const confirmYes = async () => fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

describe('ScheduleByResourceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMode = 'NORMAL';
    vi.mocked(getScheduleByResource).mockResolvedValue({ data: { data: rows } } as never);
    vi.mocked(getScheduleByResourceName).mockResolvedValue({
      data: { data: [{ remote_name: 's3-a', schedule_name: 'nightly', rsc_dfn: true, rsc_grp: false, ctrl: true }] },
    } as never);
    vi.mocked(disableSchedule).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(enableSchedule).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(deleteBackupSchedule).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
  });

  it('asks for active schedules only, and renders times in UTC, blank when zero', async () => {
    renderList();
    const active = (await screen.findByText('res-active')).closest('tr') as HTMLElement;
    expect(getScheduleByResource).toHaveBeenCalledWith({ 'active-only': true });
    expect(within(active).getByText('2023-11-14 22:13:20')).toBeInTheDocument();
    expect(within(active).getAllByText('2023-11-15 22:13:20')).toHaveLength(2);
    expect(within(active).getByText('s3-a')).toBeInTheDocument();
    expect(within(active).getByText('nightly')).toBeInTheDocument();

    const off = rowOf('res-off');
    expect(within(off).getByText('disabled')).toBeInTheDocument();
    expect(within(off).queryByText(/2023-/)).not.toBeInTheDocument();
    expect(screen.getByText('Total 3 items')).toBeInTheDocument();
  });

  it('"Show All" drops the active-only filter', async () => {
    renderList();
    await screen.findByText('res-active');
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(getScheduleByResource).toHaveBeenLastCalledWith({}));
  });

  it('filters rows by resource name as you type', async () => {
    renderList();
    await screen.findByText('res-active');
    fireEvent.change(screen.getByPlaceholderText('Resource'), { target: { value: 'OFF' } });
    expect(screen.queryByText('res-active')).not.toBeInTheDocument();
    expect(screen.getByText('res-off')).toBeInTheDocument();
  });

  it('offers no actions for a resource with nothing set', async () => {
    renderList();
    await screen.findByText('res-none');
    expect(within(rowOf('res-none')).queryByRole('button', { name: 'more' })).not.toBeInTheDocument();
    expect(within(rowOf('res-active')).getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('disables an active schedule after confirm and refetches', async () => {
    renderList();
    await screen.findByText('res-active');
    const menu = await openRowMenu('res-active');
    expect(within(menu).queryByText('Enable')).not.toBeInTheDocument();
    fireEvent.click(within(menu).getByText('Disable'));
    expect(await screen.findByText('Are you sure you want to disable this schedule?')).toBeInTheDocument();
    await confirmYes();

    await waitFor(() =>
      expect(disableSchedule).toHaveBeenCalledWith('s3-a', 'nightly', {
        rsc_name: 'res-active',
        force_mv_rsc_grp: false,
        force_restore: false,
      }),
    );
    expect(await screen.findByText('Schedule disabled successfully')).toBeInTheDocument();
    await waitFor(() => expect(getScheduleByResource).toHaveBeenCalledTimes(2));
  });

  it('enables a disabled schedule after confirm', async () => {
    renderList();
    await screen.findByText('res-off');
    const menu = await openRowMenu('res-off');
    expect(within(menu).queryByText('Disable')).not.toBeInTheDocument();
    fireEvent.click(within(menu).getByText('Enable'));
    await confirmYes();
    await waitFor(() =>
      expect(enableSchedule).toHaveBeenCalledWith('s3-a', 'nightly', {
        rsc_name: 'res-off',
        force_mv_rsc_grp: false,
        force_restore: false,
      }),
    );
    expect(await screen.findByText('Schedule enabled successfully')).toBeInTheDocument();
  });

  it('deletes the resource schedule after confirm, and reports a failure', async () => {
    renderList();
    await screen.findByText('res-active');
    let menu = await openRowMenu('res-active');
    fireEvent.click(within(menu).getByText('Delete'));
    expect(await screen.findByText('This action cannot be undone!')).toBeInTheDocument();
    await confirmYes();
    await waitFor(() =>
      expect(deleteBackupSchedule).toHaveBeenCalledWith('s3-a', 'nightly', { rsc_dfn_name: 'res-active' }),
    );
    expect(await screen.findByText('Schedule deleted successfully')).toBeInTheDocument();

    vi.mocked(deleteBackupSchedule).mockRejectedValue(new Error('busy'));
    fireEvent.mouseLeave(within(rowOf('res-active')).getByRole('button', { name: 'more' }));
    menu = await openRowMenu('res-off');
    fireEvent.click(within(menu).getByText('Delete'));
    await confirmYes();
    expect(await screen.findByText('Failed to delete schedule')).toBeInTheDocument();
  });

  it('expanding a row loads its details and marks what is enabled', async () => {
    renderList();
    await screen.findByText('res-active');
    fireEvent.click(within(rowOf('res-active')).getByRole('button', { name: /expand/i }));
    await waitFor(() => expect(getScheduleByResourceName).toHaveBeenCalledWith('res-active'));
    // rsc_dfn and ctrl are on, rsc_grp is off: two tags.
    expect(await screen.findAllByText('Enabled')).toHaveLength(2);
  });

  it('the Schedules button goes to the definitions list', async () => {
    renderList();
    await screen.findByText('res-active');
    fireEvent.click(screen.getByRole('button', { name: 'Schedules' }));
    expect(navigate).toHaveBeenCalledWith('/schedule/list');
  });

  it('the Schedules button goes to the HCI definitions list in HCI mode', async () => {
    uiMode = 'HCI';
    renderList();
    await screen.findByText('res-active');
    fireEvent.click(screen.getByRole('button', { name: 'Schedules' }));
    expect(navigate).toHaveBeenLastCalledWith('/hci/schedule/list');
  });
});
