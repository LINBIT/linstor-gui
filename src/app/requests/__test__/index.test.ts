// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2026 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import service from '../index';

const reply = (status: number, body: string) => new Response(status === 204 ? null : body, { status });

describe('service', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  const calledUrl = () => fetchMock.mock.calls[0][0];
  const calledInit = () => fetchMock.mock.calls[0][1] as RequestInit;

  it('resolves a JSON reply with its data and status', async () => {
    fetchMock.mockResolvedValue(reply(200, '[{"name":"a"}]'));

    await expect(service.get('/api/v2/nfs')).resolves.toEqual({ data: [{ name: 'a' }], status: 200 });
    expect(calledUrl()).toBe('/api/v2/nfs');
    expect(calledInit().method).toBe('GET');
  });

  it('gives a reply that is not JSON as text', async () => {
    fetchMock.mockResolvedValue(reply(201, 'created'));

    await expect(service.post('/api/v2/nfs')).resolves.toEqual({ data: 'created', status: 201 });
  });

  it('sends a body as JSON', async () => {
    fetchMock.mockResolvedValue(reply(200, '{}'));

    await service.put('/api/v2/iscsi/t/1', { size_kib: 4, number: 1 });

    expect(calledInit().method).toBe('PUT');
    expect(calledInit().body).toBe('{"size_kib":4,"number":1}');
    expect((calledInit().headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('rejects a failed status with the reply body', async () => {
    fetchMock.mockResolvedValue(reply(500, '{"message":"target busy"}'));

    await expect(service.delete('/api/v2/nfs/x')).rejects.toEqual({ message: 'target busy' });
  });

  it('rejects a success status other than 200 and 201', async () => {
    fetchMock.mockResolvedValue(reply(204, ''));

    await expect(service.delete('/api/v2/nfs/x')).rejects.toThrow('Error');
  });

  it('rejects with the fetch error when there is no reply', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(service.get('/api/v2/status')).rejects.toThrow('Failed to fetch');
  });

  it('sends gateway, VSAN and other calls to their own hosts', async () => {
    localStorage.setItem('GATEWAY_HOST', 'http://gw:8080/');
    localStorage.setItem('HCI_VSAN_HOST', 'https://vsan');
    localStorage.setItem('LINSTOR_HOST', 'http://ctrl:3370');
    fetchMock.mockImplementation(async () => reply(200, '{}'));

    await service.get('/api/v2/status');
    await service.get('/api/frontend/v1/nodes');
    await service.get('/other');

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://gw:8080/api/v2/status',
      'https://vsan/api/frontend/v1/nodes',
      'http://ctrl:3370/other',
    ]);
  });
});
