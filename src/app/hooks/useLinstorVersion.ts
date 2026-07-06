// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';

import { getControllerVersion } from '@app/features/node/api';
import { compareVersions } from '@app/utils/version';

// Minimum LINSTOR REST API versions that gate optional GUI features.
// Auth tokens and regex list filtering both landed in linstor-server 1.34.0,
// which reports rest_api_version 1.28.0.
export const MIN_API_VERSION = {
  AUTH_TOKENS: '1.28.0',
  HA: '1.28.0',
  PLATFORM_INFO: '1.28.0',
  REGEX_FILTER: '1.28.0',
} as const;

export const useLinstorVersion = () => {
  const query = useQuery({
    queryKey: ['linstorVersion'],
    queryFn: () => getControllerVersion(),
    staleTime: Infinity,
  });

  const restApiVersion = query.data?.data?.rest_api_version;

  return {
    restApiVersion,
    isFetched: query.isFetched,
    isLoading: query.isLoading,
    hasMinVersion: (min: string) => compareVersions(restApiVersion, min),
  };
};

export default useLinstorVersion;
