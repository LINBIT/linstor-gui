import { get, del, patch } from '../requests';
import { ErrorReportDeleteRangeRequest, GetErrorReportRequestQuery } from './types';

const deleteReport = async (reportid: string) => {
  return del('/v1/error-reports/{reportid}', {
    params: {
      path: {
        reportid,
      },
    },
  });
};

const deleteReportBulk = async (body: ErrorReportDeleteRangeRequest) => {
  return patch('/v1/error-reports', {
    params: {},
    body,
  });
};

const getErrorReportById = async (reportid: string) => {
  return get('/v1/error-reports/{reportid}', {
    params: {
      path: {
        reportid,
      },
    },
  });
};

const getErrorReports = async (query: GetErrorReportRequestQuery) => {
  return get('/v1/error-reports', {
    params: {
      query,
    },
  });
};

export { getErrorReports, getErrorReportById, deleteReport, deleteReportBulk };
