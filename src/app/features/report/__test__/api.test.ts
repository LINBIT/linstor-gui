// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../requests', () => ({
  get: vi.fn(),
  del: vi.fn(),
  patch: vi.fn(),
}));

import { get, del, patch } from '../../requests';
import { getErrorReports, getErrorReportById, deleteReport, deleteReportBulk } from '../api';

const ok = { data: [{ ret_code: 1 }] };

describe('report api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(del).mockResolvedValue(ok as never);
    vi.mocked(patch).mockResolvedValue(ok as never);
  });

  it('lists error reports with the query', async () => {
    await getErrorReports({ node: 'node-1' });
    expect(get).toHaveBeenCalledWith('/v1/error-reports', { params: { query: { node: 'node-1' } } });
  });

  it('reads one report by id', async () => {
    await getErrorReportById('5F1A-000001');
    expect(get).toHaveBeenCalledWith('/v1/error-reports/{reportid}', {
      params: { path: { reportid: '5F1A-000001' } },
    });
  });

  it('deletes one report by id', async () => {
    await deleteReport('5F1A-000001');
    expect(del).toHaveBeenCalledWith('/v1/error-reports/{reportid}', {
      params: { path: { reportid: '5F1A-000001' } },
    });
  });

  it('bulk-deletes with PATCH and the ids in the body', async () => {
    await deleteReportBulk({ ids: ['a', 'b'] });
    expect(patch).toHaveBeenCalledWith('/v1/error-reports', { params: {}, body: { ids: ['a', 'b'] } });
  });

  it('passes the transport result and rejection through', async () => {
    await expect(deleteReport('x')).resolves.toBe(ok);
    const boom = new Error('network');
    vi.mocked(get).mockRejectedValue(boom);
    await expect(getErrorReports({})).rejects.toBe(boom);
  });
});
