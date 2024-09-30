// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import createClient from 'openapi-fetch';
import { paths } from '@app/apis/schema';
import { handleAPICallRes } from '@app/utils/toast';
import { components } from '@app/apis/schema';

type APICALLRC = components['schemas']['ApiCallRc'];
type APICALLRCLIST = components['schemas']['ApiCallRcList'];

window.fetch = new Proxy(window.fetch, {
  apply: function (target, that, args) {
    // args holds argument of fetch function
    const temp = target.apply(that, args);
    temp.then((res) => {
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
        } catch (error) {
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
        } catch (error) {
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

const { GET, POST, DELETE, PUT, PATCH, HEAD, TRACE, OPTIONS } = createClient<paths>({
  baseUrl: '',
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
