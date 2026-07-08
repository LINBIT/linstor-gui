// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';

import { compareVersions } from '@app/utils/version';
import { getGatewayStatus } from '../api';

// Minimum linstor-gateway versions that gate optional GUI features.
export const MIN_GATEWAY_VERSION = {
  NFS_GANESHA: '2.3.0',
} as const;

/**
 * Detect the running linstor-gateway version. Since gateway 2.3.0 the
 * `/api/v2/status` response carries a `version` field; older gateways answer
 * the status check but omit it (so `version` is undefined and `hasMinVersion`
 * is false — features gate off conservatively until a version is confirmed).
 */
export const useGatewayVersion = () => {
  const query = useQuery({
    queryKey: ['getGatewayStatus'],
    queryFn: () => getGatewayStatus(),
    staleTime: 60_000,
    retry: false,
  });

  const version = query.data?.data?.version;

  return {
    version,
    isLoading: query.isLoading,
    // Reachable = the status endpoint answered (even if it predates the version field).
    isReachable: query.isSuccess,
    isError: query.isError,
    hasMinVersion: (min: string) => compareVersions(version, min),
  };
};

export default useGatewayVersion;
