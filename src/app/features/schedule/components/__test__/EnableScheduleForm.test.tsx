// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The form imports its own api through the feature barrel; mocking the api
// module covers both paths because vitest mocks by resolved file.
vi.mock('../../api', () => ({
  enableSchedule: vi.fn(),
  getScheduleList: vi.fn(),
}));
vi.mock('@app/features/remote', () => ({
  getRemoteList: vi.fn(),
}));
vi.mock('@app/features/resource', () => ({
  getResources: vi.fn(),
}));
vi.mock('@app/features/resourceGroup', () => ({
  getResourceGroups: vi.fn(),
}));
vi.mock('@app/features/node', () => ({
  useNodes: () => ({ data: [{ name: 'node-1' }, { name: 'node-2' }], isLoading: false }),
}));

import { enableSchedule, getScheduleList } from '../../api';
import { getRemoteList } from '@app/features/remote';
import { getResources } from '@app/features/resource';
import { getResourceGroups } from '@app/features/resourceGroup';
import EnableScheduleForm from '../EnableScheduleForm';

const renderForm = (props: React.ComponentProps<typeof EnableScheduleForm> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
  render(
    <QueryClientProvider client={client}>
      <EnableScheduleForm {...props} />
    </QueryClientProvider>,
  );
};

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: '+ Enable' }));
  await screen.findByText('Enable Schedule');
};

const pick = async (combobox: HTMLElement, label: string | RegExp) => {
  fireEvent.mouseDown(combobox);
  fireEvent.click(await screen.findByText(label, { selector: '.ant-select-item-option-content' }));
};

// The footer Enable button is the last one named Enable.
const submit = () => fireEvent.click(screen.getAllByRole('button', { name: 'Enable' }).at(-1) as HTMLElement);

describe('EnableScheduleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enableSchedule).mockResolvedValue({ data: [{ ret_code: 1 }] } as never);
    vi.mocked(getScheduleList).mockResolvedValue({
      data: { data: [{ schedule_name: 'nightly', full_cron: '0 2 * * *' }] },
    } as never);
    vi.mocked(getRemoteList).mockResolvedValue({
      data: { s3_remotes: [{ remote_name: 's3-a' }], linstor_remotes: [{ remote_name: 'lin-b' }] },
    } as never);
    vi.mocked(getResources).mockResolvedValue({
      data: [{ name: 'res-a' }, { name: 'res-a' }, { name: 'res-b' }],
    } as never);
    vi.mocked(getResourceGroups).mockResolvedValue({ data: [{ name: 'rg-a' }] } as never);
  });

  it('requires a remote and a schedule', async () => {
    renderForm();
    await open();
    submit();
    expect(await screen.findByText('Please select the remote name!')).toBeInTheDocument();
    expect(screen.getByText('Please select the schedule name!')).toBeInTheDocument();
    expect(enableSchedule).not.toHaveBeenCalled();
  });

  it('offers both remote kinds, schedules with their cron, and each resource once', async () => {
    renderForm();
    await open();
    const [remote, schedule, resource] = screen.getAllByRole('combobox');

    fireEvent.mouseDown(remote);
    const remotes = await screen.findAllByText(/^(s3-a|lin-b)$/, { selector: '.ant-select-item-option-content' });
    expect(remotes.map((r) => r.textContent)).toEqual(['s3-a', 'lin-b']);

    fireEvent.mouseDown(schedule);
    expect(
      await screen.findByText('nightly (0 2 * * *)', { selector: '.ant-select-item-option-content' }),
    ).toBeInTheDocument();

    fireEvent.mouseDown(resource);
    const resources = await screen.findAllByText(/^res-/, { selector: '.ant-select-item-option-content' });
    expect(resources.map((r) => r.textContent)).toEqual(['res-a', 'res-b']);
  });

  it('enables the schedule on the chosen remote for the chosen resource', async () => {
    const onSuccess = vi.fn();
    renderForm({ onSuccess });
    await open();
    const [remote, schedule, resource] = screen.getAllByRole('combobox');
    await pick(remote, 'lin-b');
    await pick(schedule, 'nightly (0 2 * * *)');
    await pick(resource, 'res-b');
    submit();

    await waitFor(() => expect(enableSchedule).toHaveBeenCalledWith('lin-b', 'nightly', { rsc_name: 'res-b' }));
    expect(await screen.findByText('Schedule enabled successfully!')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalled();
    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
  });

  it('uses a fixed remote and schedule from props and hides the remote picker', async () => {
    renderForm({ remote_name: 's3-a', schedule_name: 'nightly' });
    await open();
    expect(screen.queryByText('Remote Name')).not.toBeInTheDocument();
    // schedule, resource, group, node
    const [, , group] = screen.getAllByRole('combobox');
    await pick(group, 'rg-a');
    submit();
    await waitFor(() => expect(enableSchedule).toHaveBeenCalledWith('s3-a', 'nightly', { grp_name: 'rg-a' }));
  });

  it('reports a failed enable and stays open', async () => {
    vi.mocked(enableSchedule).mockRejectedValue(new Error('no such remote'));
    const onSuccess = vi.fn();
    renderForm({ remote_name: 's3-a', schedule_name: 'nightly', onSuccess });
    await open();
    submit();
    expect(await screen.findByText('Failed to enable schedule: no such remote')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByText('Enable Schedule')).toBeInTheDocument();
  });

  it('reports a failed option fetch', async () => {
    vi.mocked(getRemoteList).mockRejectedValue(new Error('offline'));
    renderForm();
    await open();
    expect(await screen.findByText('Failed to fetch remote list: offline')).toBeInTheDocument();
  });
});
