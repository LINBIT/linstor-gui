// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { ErrorReportDeleteRequest, ReportType } from '@app/interfaces/report';
import { notify, notifyMessages } from '@app/utils/toast';
import { ApiCallRcList } from '@app/interfaces/common';

type ReportState = {
  list: ReportType[];
  pageInfo: PageInfo;
};

type PageInfo = {
  currentPage: number;
  pageSize: number;
  total: number;
};

export const report = createModel<RootModel>()({
  state: {
    list: [],
    pageInfo: {
      total: 0,
      pageSize: 10,
      currentPage: 1,
    },
  } as ReportState,
  reducers: {
    setReportState(state, payload: ReportState) {
      return {
        ...state,
        ...payload,
      };
    },
    setPageInfo(state, payload: PageInfo) {
      return {
        ...state,
        pageInfo: {
          ...state.pageInfo,
          ...payload,
        },
      };
    },
  },
  effects: (dispatch) => ({
    async getReportList(payload: { page: number; pageSize: number }, state) {
      const reportStats = await service.get('/v1/stats/error-reports');

      const res = await service.get('/v1/error-reports', {
        params: {
          limit: payload.page - 1 || 10,
          offset: payload.pageSize,
        },
      });

      dispatch.report.setReportState({
        list: res.data.sort((a, b) => b.error_time - a.error_time),
        pageInfo: {
          ...state.report.pageInfo,
          total: reportStats.data.count,
          currentPage: payload.page,
          pageSize: payload.pageSize,
        },
      });
    },
    async deleteReport(
      payload: {
        ids?: string[];
        deleteAll?: boolean;
      },
      state,
    ) {
      try {
        let req = {};
        const { ids, deleteAll } = payload;
        if (deleteAll) {
          req = {
            since: 1000000000000,
            to: new Date().getTime(),
          };
        } else {
          req = {
            ids,
          };
        }

        const result = await service.patch<ErrorReportDeleteRequest, { data: ApiCallRcList }>(`/v1/error-reports`, req);

        notifyMessages(result.data);

        dispatch.report.getReportList({
          page: state.report.pageInfo.currentPage,
          pageSize: state.report.pageInfo.pageSize,
        });
      } catch (error) {
        notify('Error', {
          type: 'error',
        });
      }
    },
  }),
});
