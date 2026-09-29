// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import createClient from 'openapi-fetch';
import { paths } from '@app/apis/schema';
import { handleAPICallRes, toastsAreQuiet } from '@app/utils/toast';
import { components } from '@app/apis/schema';
import {
  createControllerAuthRequiredError,
  emitControllerAuthRequired,
  getControllerAuthToken,
  isControllerAuthRequired,
  isControllerRequestUrl,
  withControllerAuthHeaders,
} from '@app/utils/controllerAuth';

type APICALLRC = components['schemas']['ApiCallRc'];
type APICALLRCLIST = components['schemas']['ApiCallRcList'];

const mergeHeaders = (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);

  if (init?.headers) {
    const initHeaders = new Headers(init.headers);
    initHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
};

const attachControllerAuthToFetchArgs = (args: Parameters<typeof window.fetch>) => {
  const [input, init] = args;
  const requestUrl = input instanceof Request ? input.url : input.toString();

  if (!isControllerRequestUrl(requestUrl)) {
    return {
      requestUrl,
      nextArgs: args,
    };
  }

  const mergedHeaders = mergeHeaders(input, init);

  if (isControllerAuthRequired() && !getControllerAuthToken() && !mergedHeaders.has('Authorization')) {
    throw createControllerAuthRequiredError();
  }

  if (input instanceof Request) {
    return {
      requestUrl,
      nextArgs: [new Request(input, { ...init, headers: withControllerAuthHeaders(mergedHeaders) })] as Parameters<
        typeof window.fetch
      >,
    };
  }

  return {
    requestUrl,
    nextArgs: [input, { ...init, headers: withControllerAuthHeaders(init?.headers) }] as Parameters<
      typeof window.fetch
    >,
  };
};

window.fetch = new Proxy(window.fetch, {
  apply: function (target, that, args) {
    let requestUrl: string;
    let nextArgs: Parameters<typeof window.fetch>;

    try {
      ({ requestUrl, nextArgs } = attachControllerAuthToFetchArgs(args as Parameters<typeof window.fetch>));
    } catch (error) {
      const rawUrl = args?.[0] instanceof Request ? args[0].url : args?.[0]?.toString?.();

      if (isControllerRequestUrl(rawUrl)) {
        emitControllerAuthRequired();
      }

      return Promise.reject(error);
    }

    // Decided when the request goes out: the reply is parsed asynchronously,
    // possibly after the action that asked for quiet has already finished.
    const notify = !toastsAreQuiet();
    const temp = target.apply(that, nextArgs);
    temp.then((res) => {
      if (res.status === 401 && isControllerRequestUrl(requestUrl)) {
        emitControllerAuthRequired();
      }

      // 401 is the auth gate's; every other error status carries an ApiCallRc
      // list too (403 for a refused external file, 409, 500...), and a
      // status left out here fails without a word.
      if (res.status === 401) {
        return;
      }
      res
        .clone()
        .json()
        .then((data) => {
          // The GUI's own key-value-store writes are not user actions.
          if (!(res.ok && res.url?.includes('key-value-store'))) {
            handleAPICallRes(data, res.url, notify);
          }
        })
        // Not JSON (an empty 204, an HTML error page): nothing to report.
        .catch(() => undefined);
    });

    return temp;
  },
});

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

const linstorHost = typeof window !== 'undefined' ? window.localStorage.getItem('LINSTOR_HOST') : '';
const { GET, POST, DELETE, PUT, PATCH, HEAD, TRACE, OPTIONS } = createClient<paths>({
  baseUrl: linstorHost || '/',
  fetch: window.fetch,
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
};

export type { APICALLRC, APICALLRCLIST };
