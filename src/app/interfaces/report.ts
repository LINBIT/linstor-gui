import { components, operations } from '@app/apis/schema';

export type ErrorReportDeleteRequest = components['schemas']['ErrorReportDelete'];
export type ErrorReportList = operations['errorReportList']['responses']['200']['content']['application/json'];

export type ReportType = ErrorReportList[0];
