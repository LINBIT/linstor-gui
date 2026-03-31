// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import service from '@app/requests';

const SPACE_TRACKING_UNAVAILABLE_MSG = 'The SpaceTracking service is not installed.';

export const getSpaceReport = async (): Promise<string | null> => {
  try {
    const response = await service.get('/v1/space-report');
    const res = response.data;

    if (res?.reportText === SPACE_TRACKING_UNAVAILABLE_MSG) {
      return SPACE_TRACKING_UNAVAILABLE_MSG;
    }
    return res.reportText;
  } catch {
    return null;
  }
};

export { SPACE_TRACKING_UNAVAILABLE_MSG };
