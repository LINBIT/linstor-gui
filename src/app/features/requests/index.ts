// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import createClient from 'openapi-fetch';
import { paths } from '@app/apis/schema';
import i18n from 'i18next';
import { message } from 'antd';
import { handleAPICallRes, toastsAreQuiet } from '@app/utils/toast';
import { components } from '@app/apis/schema';
import {
  createControllerAuthRequiredError,
  emitControllerAuthRequired,
  getControllerAuthToken,
  isControllerAuthRequired,
  withControllerAuthHeaders,
} from '@app/utils/controllerAuth';

import { replyError } from './reply';

type APICALLRC = components['schemas']['ApiCallRc'];
type APICALLRCLIST = components['schemas']['ApiCallRcList'];

/** Controller endpoints the published REST spec does not describe yet. */
interface UnlistedPaths {
  '/v1/space-report': {
    get: {
      responses: { 200: { content: { 'application/json': { reportText?: string } } } };
    };
  };
}

// Replies under these paths carry tokens (initialize-token-auth, token
// creation); they never reach the log sidebar, which lives in sessionStorage,
// nor a toast.
const SECRET_REPLY_PATHS = ['/v1/controller/auth/'];

/**
 * Logs a reply to the sidebar and, unless the action asked for quiet, toasts
 * it once. 401 belongs to the auth gate; every other error status from the
 * controller carries an ApiCallRc list too (403 for a refused external file,
 * 409, 500...).
 */
const reportReply = (request: Request, res: Response, notify: boolean): void => {
  const url = request.url;
  if (res.status === 401) {
    return;
  }
  if (!res.headers.get('Content-Type')?.includes('json')) {
    // Not the controller answering: a proxy in front of it (502 Bad Gateway
    // while it fails over) or a server in its place. A failed write would
    // otherwise end in silence; a failed read only leaves its list empty, and
    // polls would repeat the toast every few seconds.
    if (!res.ok && notify && request.method !== 'GET') {
      message.error({
        content: i18n.t('common:action_failed', { message: `HTTP ${res.status} ${res.statusText}`.trim() }),
        duration: 10,
      });
    }
    // A download (SOS report tarball) is not a reply to report; cloning it
    // would only hold the whole file in memory twice.
    return;
  }
  if (SECRET_REPLY_PATHS.some((path) => new URL(url, window.location.href).pathname.includes(path))) {
    return;
  }
  res
    .clone()
    .json()
    .then((data) => {
      // The GUI's own key-value-store writes are not user actions.
      if (!(res.ok && url.includes('key-value-store'))) {
        handleAPICallRes(data, url, notify);
      }
    })
    // Not JSON (an empty 204, an HTML error page): nothing to report.
    .catch(() => undefined);
};

/**
 * The one fetch every controller request goes through: it adds the auth
 * token, hands a 401 to the auth gate and reports the reply. It belongs to
 * the client below; window.fetch stays untouched.
 */
const linstorFetch = async (request: Request): Promise<Response> => {
  const headers = withControllerAuthHeaders(request.headers);
  if (isControllerAuthRequired() && !getControllerAuthToken() && !headers.has('Authorization')) {
    emitControllerAuthRequired();
    throw createControllerAuthRequiredError();
  }
  // Decided when the request goes out: the reply is parsed asynchronously,
  // possibly after the action that asked for quiet has already finished.
  const notify = !toastsAreQuiet();
  const res = await fetch(new Request(request, { headers }));
  if (res.status === 401) {
    emitControllerAuthRequired();
  }
  reportReply(request, res, notify);
  return res;
};

const fullySuccess = (res?: APICALLRCLIST) => {
  if (!res) {
    return false;
  }
  return res.every((item) => item.ret_code > 0);
};

const partiallySuccess = (res?: APICALLRCLIST) => {
  if (!res) {
    return false;
  }
  return res.some((item) => item.ret_code < 0) && res.some((item) => item.ret_code > 0);
};

/**
 * The messages of an error response, joined; undefined when there is none.
 * openapi-fetch does not throw on an HTTP error, it puts the body in `error`.
 */
const apiErrorMessage = (res?: { error?: unknown }): string | undefined => {
  if (!Array.isArray(res?.error)) {
    return undefined;
  }
  return (res.error as { message?: string }[])
    .map((e) => e?.message)
    .filter(Boolean)
    .join(', ');
};

/** A controller reply that was an HTTP error. */
class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * The data of a reply, or an ApiError for an HTTP error. openapi-fetch resolves
 * either way (the failure sits in `error`), which is easy to forget and then a
 * refusal reads as success; code that wants throw-on-failure unwraps.
 */
const unwrap = async <T>(request: Promise<{ data?: T; error?: unknown; response?: Response }>): Promise<T> => {
  const res = await request;
  const failed = res.response ? !res.response.ok : Boolean(res.error);
  if (failed) {
    const status = res.response?.status ?? 0;
    throw new ApiError(replyError(res) || `HTTP ${status}`, status, res.error);
  }
  return res.data as T;
};

const linstorHost = typeof window !== 'undefined' ? window.localStorage.getItem('LINSTOR_HOST') : '';
const { GET, POST, DELETE, PUT, PATCH, HEAD, TRACE, OPTIONS } = createClient<paths & UnlistedPaths>({
  baseUrl: linstorHost || '/',
  fetch: linstorFetch,
  querySerializer: {
    array: {
      style: 'form',
      explode: true,
    },
  },
});

export {
  GET as get,
  POST as post,
  DELETE as del,
  PUT as put,
  PATCH as patch,
  HEAD as head,
  TRACE as trace,
  OPTIONS as options,
  fullySuccess,
  partiallySuccess,
  apiErrorMessage,
  unwrap,
  ApiError,
  replyError,
};

export type { APICALLRC, APICALLRCLIST };
