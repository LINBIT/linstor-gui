// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';
import { getSpaceReport, SPACE_TRACKING_UNAVAILABLE_MSG } from '@app/utils/spaceReport';

export const useSpaceReportStatus = () => {
  const { isFetched, isSuccess, data } = useQuery<string | null, Error>({
    queryKey: ['getSpaceReportStatus'],
    queryFn: getSpaceReport,
  });

  const isSpaceTrackingUnavailable = isSuccess && data === SPACE_TRACKING_UNAVAILABLE_MSG;
  const isCheckingStatus = !isFetched;

  return {
    isSpaceTrackingUnavailable,
    isCheckingStatus,
    data,
    isSuccess,
    isFetched,
  };
};
