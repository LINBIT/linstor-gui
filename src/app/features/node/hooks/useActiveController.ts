// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';

import { getExternalFilesWithContent, getResourceOnNodes } from '../api';
import { controllerHaResource } from '../controllerHa';

/**
 * The node running the active controller with controller HA: where the
 * resource whose drbd-reactor promoter starts the controller is Primary.
 * Undefined without controller HA (no such resource) or while no node is
 * Primary. The Primary is polled, so a failover shows up without a reload;
 * the configs change rarely and are read once a minute.
 */
export const useActiveController = (): string | undefined => {
  const { data: resource } = useQuery({
    queryKey: ['controllerHaResource'],
    queryFn: async () => controllerHaResource((await getExternalFilesWithContent()).data ?? []),
    staleTime: 60000,
  });

  const { data } = useQuery({
    queryKey: ['activeController', resource],
    queryFn: async () =>
      (await getResourceOnNodes(resource!)).data?.find((r) => r.name === resource && r.state?.in_use)?.node_name ??
      null,
    enabled: !!resource,
    refetchInterval: 10000,
  });

  return data ?? undefined;
};
