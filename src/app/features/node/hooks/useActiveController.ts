// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';

import { getExternalFilesWithContent, getResourceOnNodes } from '../api';
import { controllerHaPromoter } from '../controllerHa';

export interface ControllerHa {
  /** Whether the controller runs highly available: its resource is deployed. */
  enabled: boolean;
  /** The node the controller runs on: where its resource is Primary. */
  active?: string;
  /** The other nodes holding a copy, which the controller can move to. */
  standby: string[];
  /** The service IP the promoter brings up, when its config is kept in LINSTOR. */
  vip?: string;
  isPending: boolean;
}

/**
 * Controller HA as LINSTOR sees it: the resource whose drbd-reactor promoter
 * starts the controller, and where it is deployed and Primary. The placement
 * is polled, so a failover shows up without a reload; the configs change
 * rarely and are read once a minute.
 */
export const useControllerHa = (): ControllerHa => {
  const { data: promoter } = useQuery({
    queryKey: ['controllerHaPromoter'],
    queryFn: async () => controllerHaPromoter((await getExternalFilesWithContent()).data ?? []),
    staleTime: 60000,
  });

  const { data: copies, isPending } = useQuery({
    queryKey: ['controllerHaNodes', promoter?.resource],
    queryFn: async () =>
      (await getResourceOnNodes(promoter!.resource)).data?.filter((r) => r.name === promoter!.resource) ?? [],
    enabled: !!promoter,
    refetchInterval: 10000,
  });

  const diskful = (copies ?? []).filter((r) => !r.flags?.some((f) => f === 'DISKLESS' || f === 'DRBD_DISKLESS'));
  const active = copies?.find((r) => r.state?.in_use)?.node_name;

  return {
    enabled: (copies ?? []).length > 0,
    active,
    standby: diskful.map((r) => r.node_name ?? '').filter((n) => n && n !== active),
    vip: promoter?.vip,
    isPending: !promoter || isPending,
  };
};

/** The node running the active controller with controller HA, if any. */
export const useActiveController = (): string | undefined => useControllerHa().active;
