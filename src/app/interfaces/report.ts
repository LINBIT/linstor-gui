import { operations } from '@app/apis/schema';

export type ErrorReportDeleteRequest = operations['errorReportDelete']['requestBody']['content']['application/json'];
export type ErrorReportList = operations['errorReportList']['responses']['200']['content']['application/json'];

export type ReportType = ErrorReportList[0];
