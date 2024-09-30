// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import axios from 'axios';
import { i18n } from '../../index';

// create an axios instance
const service = axios.create({
  baseURL: '', // url = base url + request url
  timeout: 1000 * 60 * 10, // request timeout
});

const handleError = (statsCode, res) => {
  let errorMsg = 'Error';
  switch (statsCode) {
    case 400: {
      errorMsg = i18n.t(res.msg, res.res || {});
      break;
    }
    case 500: {
      if (Array.isArray(res)) {
        const errorObj = res[res.length - 1] || {};
        errorMsg = errorObj['message'];
        if (errorObj['details']) {
          errorMsg += '.' + errorObj['details'];
        }
      } else {
        errorMsg = i18n.t('systemError');
      }
      break;
    }
  }
  return errorMsg;
};

// handle gateway request host
service.interceptors.request.use((req) => {
  const GATEWAY_HOST = window.localStorage.getItem('GATEWAY_HOST');
  const VSAN_HOST = window.localStorage.getItem('VSAN_HOST');

  if (process.env.NODE_ENV !== 'development') {
    if (req.url?.startsWith('/api/v2/') && GATEWAY_HOST) {
      // For gateway mode, use gateway host
      req.baseURL = GATEWAY_HOST;
    } else if (req.url?.startsWith('/api/frontend/v1') && VSAN_HOST) {
      // FOR VSAN Mode, use https and hostname
      req.baseURL = VSAN_HOST;
    }
  }

  return req;
});

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  (response) => {
    const statsCode = response.status;
    const res = response.data;
    console.log('response', response);

    if (statsCode !== 200 && statsCode !== 201) {
      const errorMsg = handleError(statsCode, res);
      return Promise.reject(new Error(errorMsg));
    } else {
      // normal case
      return response;
    }
  },
  (error) => {
    return Promise.reject(error?.response?.data ?? error);
  },
);

export default service;
