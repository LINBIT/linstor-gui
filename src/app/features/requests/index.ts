// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import createClient from 'openapi-fetch';
import { paths } from '@app/apis/schema';
import { handleAPICallRes } from '@app/utils/toast';
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

    const temp = target.apply(that, nextArgs);
    temp.then((res) => {
      if (res.status === 401 && isControllerRequestUrl(requestUrl)) {
        emitControllerAuthRequired();
      }

      if (res.ok) {
        try {
          res
            .clone()
            .json()
            .then((data) => {
              // add a rule for not calling handleAPICallRes when url includes some strings
              const excludeList = ['key-value-store', 'snapshots'];

              if (!excludeList.some((item) => res.url?.includes(item))) {
                handleAPICallRes(data, res.url);
              }
            });
        } catch {
          return res;
        }

        return res;
      }
      // After completion of request
      if (res.status === 400 || res.status === 500 || res.status === 404) {
        try {
          res
            .clone()
            .json()
            .then((err) => {
              // handle error, notice that res.json() returns a promise
              handleAPICallRes(err, res.url);
            });
        } catch {
          return res;
        }

        return res;
      }
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
};

export type { APICALLRC, APICALLRCLIST };
