// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components, operations } from '@app/apis/schema';

export type ErrorReportDeleteRequest = components['schemas']['ErrorReportDelete'];
export type ErrorReportList = operations['errorReportList']['responses']['200']['content']['application/json'];

export type ReportType = ErrorReportList[0];
