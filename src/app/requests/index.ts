// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// The HTTP client for the services next to the controller: LINSTOR Gateway
// (/api/v2) and the VSAN/HCI frontend (/api/frontend/v1). The LINSTOR
// controller itself is only reached through the typed client in
// @app/features/requests, which carries its auth and reply handling.
export interface ServiceResponse<T = unknown> {
  data: T;
  status: number;
}

const TIMEOUT_MS = 1000 * 60 * 10;

// The host at load time, used when no host below applies.
const defaultBase = (typeof window !== 'undefined' && window.localStorage.getItem('LINSTOR_HOST')) || '/';

/** Gateway, VSAN and LINSTOR may each live on their own host; the dev server proxies all of them. */
const baseFor = (url: string): string => {
  if (process.env.NODE_ENV === 'development') return defaultBase;
  const gatewayHost = window.localStorage.getItem('GATEWAY_HOST');
  const vsanHost = window.localStorage.getItem('HCI_VSAN_HOST');
  const linstorHost = window.localStorage.getItem('LINSTOR_HOST');
  if (url.startsWith('/api/v2/') && gatewayHost) return gatewayHost;
  if (url.startsWith('/api/frontend/v1') && vsanHost) return vsanHost;
  return linstorHost || defaultBase;
};

const join = (base: string, url: string) => `${base.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;

/** A JSON body as an object, anything else as its text ('' when empty). */
const readBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * A failed status rejects with the reply body, which callers read for
 * { message } or an ApiCallRc list; a request that got no reply rejects with
 * the fetch error. Of the successful statuses only 200 and 201 resolve, as
 * they did with axios.
 */
const request = async <T>(method: string, url: string, body?: unknown): Promise<ServiceResponse<T>> => {
  const response = await fetch(join(baseFor(url), url), {
    method,
    headers: {
      Accept: 'application/json, text/plain, */*',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await readBody(response);
  if (!response.ok) throw data;
  if (response.status !== 200 && response.status !== 201) throw new Error('Error');
  return { data: data as T, status: response.status };
};

const service = {
  get: <T = unknown>(url: string) => request<T>('GET', url),
  delete: <T = unknown>(url: string) => request<T>('DELETE', url),
  post: <T = unknown>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T = unknown>(url: string, body?: unknown) => request<T>('PUT', url, body),
};

export default service;
