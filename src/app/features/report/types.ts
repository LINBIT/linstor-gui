import { components, operations } from '@app/apis/schema';

export type GetErrorReportRequestQuery = operations['errorReportList']['parameters']['query'];
export type ErrorReport = components['schemas']['ErrorReport'];

export type ErrorReportDeleteRequest = components['schemas']['ErrorReportDelete'];
export type ErrorReportDeleteRangeRequest = components['schemas']['ErrorReportDelete'];
