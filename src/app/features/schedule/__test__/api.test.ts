// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../requests', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { get, post, put, del } from '../../requests';
import {
  getScheduleList,
  createSchedule,
  modifySchedule,
  deleteSchedule,
  enableSchedule,
  disableSchedule,
  deleteBackupSchedule,
  getScheduleByResource,
  getScheduleByResourceName,
} from '../api';

// Two families of endpoints share names here: /v1/schedules (the schedule
// definitions) and /v1/remotes/.../backups/schedule/... (a schedule applied
// to a remote). Each test pins the path and where each argument lands.

const ok = { data: [{ ret_code: 1 }] };

describe('schedule api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: {} } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(put).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
  });

  it('lists schedule definitions', async () => {
    await getScheduleList();
    expect(get).toHaveBeenCalledWith('/v1/schedules');
  });

  it('creates a definition with the body', async () => {
    const body = { schedule_name: 'daily', full_cron: '0 0 * * *', on_failure: 'SKIP' as const };
    await createSchedule(body);
    expect(post).toHaveBeenCalledWith('/v1/schedules', { body });
  });

  it('modifies a definition by name', async () => {
    await modifySchedule('daily', { keep_local: 3 });
    expect(put).toHaveBeenCalledWith('/v1/schedules/{scheduleName}', {
      params: { path: { scheduleName: 'daily' } },
      body: { keep_local: 3 },
    });
  });

  it('deletes a definition by name', async () => {
    await deleteSchedule('daily');
    expect(del).toHaveBeenCalledWith('/v1/schedules/{scheduleName}', {
      params: { path: { scheduleName: 'daily' } },
    });
  });

  it('enables a schedule on a remote with the target in the body', async () => {
    const body = { rsc_name: 'r1', force_mv_rsc_grp: false, force_restore: false };
    await enableSchedule('s3-a', 'daily', body);
    expect(put).toHaveBeenCalledWith('/v1/remotes/{remote_name}/backups/schedule/{schedule_name}/enable', {
      params: { path: { remote_name: 's3-a', schedule_name: 'daily' } },
      body,
    });
  });

  it('disables a schedule on a remote, body optional', async () => {
    await disableSchedule('s3-a', 'daily');
    expect(put).toHaveBeenCalledWith('/v1/remotes/{remote_name}/backups/schedule/{schedule_name}/disable', {
      params: { path: { remote_name: 's3-a', schedule_name: 'daily' } },
      body: undefined,
    });
  });

  it('deletes a remote schedule with the resource definition as a query param', async () => {
    await deleteBackupSchedule('s3-a', 'daily', { rsc_dfn_name: 'r1' });
    expect(del).toHaveBeenCalledWith('/v1/remotes/{remote_name}/backups/schedule/{schedule_name}/delete', {
      params: { path: { remote_name: 's3-a', schedule_name: 'daily' }, query: { rsc_dfn_name: 'r1' } },
    });
  });

  it('reads the schedules-by-resource view with the filter as query', async () => {
    await getScheduleByResource({ 'active-only': true });
    expect(get).toHaveBeenCalledWith('/v1/view/schedules-by-resource', {
      params: { query: { 'active-only': true } },
    });
  });

  it('reads one resource by path', async () => {
    await getScheduleByResourceName('r1');
    expect(get).toHaveBeenCalledWith('/v1/view/schedules-by-resource/{rscName}', {
      params: { path: { rscName: 'r1' } },
    });
  });

  it('passes the transport result and rejection through', async () => {
    await expect(createSchedule({ schedule_name: 'x', full_cron: '* * * * *' })).resolves.toBe(ok);
    const boom = new Error('network');
    vi.mocked(del).mockRejectedValue(boom);
    await expect(deleteSchedule('x')).rejects.toBe(boom);
  });
});
