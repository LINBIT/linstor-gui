// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { unwrap } from '@app/features/requests';
import { getSpaceReport as fetchSpaceReport } from '@app/features/node/api';

const SPACE_TRACKING_UNAVAILABLE_MSG = 'The SpaceTracking service is not installed.';

export const getSpaceReport = async (): Promise<string | null> => {
  try {
    const res = await unwrap(fetchSpaceReport());

    if (res?.reportText === SPACE_TRACKING_UNAVAILABLE_MSG) {
      return SPACE_TRACKING_UNAVAILABLE_MSG;
    }
    return res.reportText ?? null;
  } catch {
    return null;
  }
};

export { SPACE_TRACKING_UNAVAILABLE_MSG };
