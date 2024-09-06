// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { get, del, patch } from '../requests';
import { ErrorReportDeleteRangeRequest, GetErrorReportRequestQuery } from './types';

const deleteReport = (reportid: string) => {
  return del('/v1/error-reports/{reportid}', {
    params: {
      path: {
        reportid,
      },
    },
  });
};

const deleteReportBulk = (body: ErrorReportDeleteRangeRequest) => {
  return patch('/v1/error-reports', {
    params: {},
    body,
  });
};

const getErrorReportById = (reportid: string) => {
  return get('/v1/error-reports/{reportid}', {
    params: {
      path: {
        reportid,
      },
    },
  });
};

const getErrorReports = (query: GetErrorReportRequestQuery) => {
  return get('/v1/error-reports', {
    params: {
      query,
    },
  });
};

export { getErrorReports, getErrorReportById, deleteReport, deleteReportBulk };
