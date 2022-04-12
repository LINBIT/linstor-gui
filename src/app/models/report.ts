import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { ReportType } from '@app/interfaces/report';
import { AlertType } from '@app/interfaces/alert';
import { notify } from '@app/utils/toast';

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
          limit: payload.page - 1,
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
    async deleteReport(payload: string[], state) {
      try {
        for (const report of payload) {
          const res = await service.delete(`/v1/error-reports/${report}`);
          dispatch.notification.setNotificationList(res.data);
        }

        dispatch.report.getReportList({
          page: state.report.pageInfo.currentPage,
          pageSize: state.report.pageInfo.pageSize,
        });

        // TODO: i18n
        notify('Deleted', { type: 'success' });
      } catch (error) {
        dispatch.notification.setNotificationList(error as AlertType[]);
      }
    },
  }),
});
