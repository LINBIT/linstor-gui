// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  createSchedule: vi.fn(),
  modifySchedule: vi.fn(),
}));

import { createSchedule, modifySchedule } from '../../api';
import ScheduleModal from '../ScheduleModal';

const ok = { data: [{ ret_code: 1 }] };

const renderModal = (props: Partial<React.ComponentProps<typeof ScheduleModal>> = {}) => {
  const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
  const refetch = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <ScheduleModal refetch={refetch} {...props} />
    </QueryClientProvider>,
  );
  return refetch;
};

// The two CronInputs (full, incremental) share a placeholder; full comes first.
const fullCron = () => screen.getAllByPlaceholderText('Cron Expression')[0];
const setCron = (el: HTMLElement, value: string) => {
  fireEvent.change(el, { target: { value } });
  fireEvent.blur(el);
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

const expectModalClosed = () =>
  waitFor(() => {
    const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
    expect(!wrap || wrap.style.display === 'none').toBe(true);
  });

describe('ScheduleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSchedule).mockResolvedValue(ok as never);
    vi.mocked(modifySchedule).mockResolvedValue(ok as never);
  });

  describe('create', () => {
    it('opens from the add button and requires a name and a full cron', async () => {
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
      expect(await screen.findByText('Create Schedule')).toBeInTheDocument();
      submit();
      expect(await screen.findByText('Schedule name is required')).toBeInTheDocument();
      expect(screen.getByText('Please enter a full cron expression')).toBeInTheDocument();
      expect(createSchedule).not.toHaveBeenCalled();
    });

    it('posts the filled fields with SKIP as the default failure action', async () => {
      const refetch = renderModal();
      fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
      await screen.findByText('Create Schedule');

      fireEvent.change(screen.getByPlaceholderText('Enter schedule name'), { target: { value: 'nightly' } });
      setCron(fullCron(), '0 2 * * *');
      fireEvent.change(screen.getByPlaceholderText('Enter number of local snapshots'), { target: { value: '3' } });
      fireEvent.change(screen.getByPlaceholderText('Enter number of remote backups'), { target: { value: '7' } });
      submit();

      await waitFor(() =>
        expect(createSchedule).toHaveBeenCalledWith({
          schedule_name: 'nightly',
          full_cron: '0 2 * * *',
          keep_local: 3,
          keep_remote: 7,
          on_failure: 'SKIP',
        }),
      );
      expect(await screen.findByText('Schedule created successfully!')).toBeInTheDocument();
      expect(refetch).toHaveBeenCalled();
      await expectModalClosed();
    });

    it('sends RETRY with max retries when chosen', async () => {
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
      await screen.findByText('Create Schedule');

      fireEvent.change(screen.getByPlaceholderText('Enter schedule name'), { target: { value: 'retrying' } });
      setCron(fullCron(), '0 3 * * *');
      fireEvent.mouseDown(screen.getByRole('combobox'));
      fireEvent.click(await screen.findByText('Retry', { selector: '.ant-select-item-option-content' }));
      fireEvent.change(screen.getByPlaceholderText('Enter max retries (optional)'), { target: { value: '2' } });
      submit();

      await waitFor(() =>
        expect(createSchedule).toHaveBeenCalledWith(
          expect.objectContaining({ on_failure: 'RETRY', max_retries: 2 }),
        ),
      );
    });

    it('rejects a negative keep count before sending', async () => {
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
      await screen.findByText('Create Schedule');
      fireEvent.change(screen.getByPlaceholderText('Enter schedule name'), { target: { value: 'neg' } });
      setCron(fullCron(), '0 3 * * *');
      fireEvent.change(screen.getByPlaceholderText('Enter number of local snapshots'), { target: { value: '-1' } });
      submit();
      expect(await screen.findByText('Must be a positive number')).toBeInTheDocument();
      expect(createSchedule).not.toHaveBeenCalled();
    });

    it('reports a failed create and stays open', async () => {
      vi.mocked(createSchedule).mockRejectedValue(new Error('exists'));
      const refetch = renderModal();
      fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
      await screen.findByText('Create Schedule');
      fireEvent.change(screen.getByPlaceholderText('Enter schedule name'), { target: { value: 'dup' } });
      setCron(fullCron(), '0 3 * * *');
      submit();
      expect(await screen.findByText('Failed to create schedule.')).toBeInTheDocument();
      expect(refetch).not.toHaveBeenCalled();
      expect(screen.getByText('Create Schedule')).toBeInTheDocument();
    });
  });

  describe('edit', () => {
    const schedule = {
      schedule_name: 'nightly',
      full_cron: '0 2 * * *',
      inc_cron: '0 * * * *',
      keep_local: 3,
      on_failure: 'RETRY' as const,
      max_retries: 1,
    };

    it('prefills the schedule and locks its name', async () => {
      renderModal({ schedule });
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
      expect(await screen.findByText('Edit Schedule')).toBeInTheDocument();
      const name = screen.getByPlaceholderText('Enter schedule name');
      expect(name).toHaveValue('nightly');
      expect(name).toBeDisabled();
      expect(screen.getByPlaceholderText('Enter number of local snapshots')).toHaveValue('3');
    });

    it('sends a modify request without the name and closes', async () => {
      const refetch = renderModal({ schedule });
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
      await screen.findByText('Edit Schedule');
      fireEvent.change(screen.getByPlaceholderText('Enter number of remote backups'), { target: { value: '9' } });
      submit();

      await waitFor(() => expect(modifySchedule).toHaveBeenCalled());
      const [name, body] = vi.mocked(modifySchedule).mock.calls[0];
      expect(name).toBe('nightly');
      expect(body).not.toHaveProperty('schedule_name');
      expect(body).toMatchObject({ keep_remote: 9, keep_local: 3, on_failure: 'RETRY' });
      expect(createSchedule).not.toHaveBeenCalled();
      await waitFor(() => expect(refetch).toHaveBeenCalled());
      await expectModalClosed();
    });

    it('renders as a text entry inside a dropdown', () => {
      renderModal({ schedule, isInDropdown: true });
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('reports a failed modify', async () => {
      vi.mocked(modifySchedule).mockRejectedValue(new Error('nope'));
      renderModal({ schedule });
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
      await screen.findByText('Edit Schedule');
      submit();
      expect(await screen.findByText('Failed to modify schedule.')).toBeInTheDocument();
    });
  });
});
