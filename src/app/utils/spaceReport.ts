// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const SPACE_TRACKING_UNAVAILABLE_MSG = 'The SpaceTracking service is not installed.';

export const getSpaceReport = async (): Promise<string | null> => {
  const linstorHost = localStorage.getItem('LINSTOR_HOST') || '';
  try {
    const response = await fetch(`${linstorHost}/v1/space-report`);

    if (!response.ok) {
      return null;
    }
    const res = await response.json();

    if (res?.reportText === SPACE_TRACKING_UNAVAILABLE_MSG) {
      return SPACE_TRACKING_UNAVAILABLE_MSG;
    }
    return res.reportText;
  } catch {
    return null;
  }
};

export { SPACE_TRACKING_UNAVAILABLE_MSG };
