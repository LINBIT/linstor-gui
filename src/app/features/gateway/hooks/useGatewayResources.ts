// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import service from '@app/requests';
import { logger } from '@app/utils/logger';
import { notify } from '@app/utils/toast';

/** The linstor-gateway resource kinds, as they appear in its /api/v2 paths. */
export type GatewayKind = 'nfs' | 'iscsi' | 'nvme-of';

type Busy = 'starting' | 'stopping';

export const gatewayQueryKey = (kind: GatewayKind) => ['gateway', kind];

const errorText = (error: unknown) => String((error as { message?: string })?.message || 'An error occurred');

/**
 * One gateway resource list (NFS exports, iSCSI or NVMe-oF targets) with its
 * actions. `idOf` is the resource's id in the gateway API: name, iqn or nqn.
 * Start/stop/LUN changes toast their outcome and always reload the list, like
 * the former rematch models; `remove` only issues the request and lets a
 * failure reach the caller, whose shared delete flow reports and reloads.
 */
export function useGatewayResources<T extends object>(kind: GatewayKind, idOf: (resource: T) => string | undefined) {
  const query = useQuery({
    queryKey: gatewayQueryKey(kind),
    queryFn: async () => ((await service.get(`/api/v2/${kind}`)).data ?? []) as T[],
  });
  const { refetch } = query;
  const [busy, setBusy] = useState<Record<string, Busy>>({});
  const [addingVolume, setAddingVolume] = useState(false);

  const reload = useCallback(() => refetch().then(() => undefined), [refetch]);

  const withToast = useCallback(
    async (call: () => Promise<{ status: number }>, success: string) => {
      try {
        const res = await call();
        if (res.status === 200) {
          notify(success, { type: 'success' });
        }
      } catch (error) {
        logger.debug(error, 'error');
        notify(errorText(error), { type: 'error' });
      } finally {
        // Reload even on failure: the gateway may have changed state partway.
        await reload();
      }
    },
    [reload],
  );

  const toggle = useCallback(
    async (id: string, action: 'start' | 'stop') => {
      setBusy((prev) => ({ ...prev, [id]: action === 'start' ? 'starting' : 'stopping' }));
      try {
        await withToast(
          () => service.post(`/api/v2/${kind}/${id}/${action}`),
          action === 'start' ? 'Started Successfully' : 'Stopped Successfully',
        );
      } finally {
        setBusy(({ [id]: _done, ...rest }) => rest);
      }
    },
    [kind, withToast],
  );

  const addLUN = useCallback(
    async ({ id, lun, sizeKib }: { id: string; lun: number; sizeKib: number }) => {
      setAddingVolume(true);
      try {
        await withToast(
          () => service.put(`/api/v2/${kind}/${id}/${lun}`, { size_kib: sizeKib, number: lun }),
          'Added Successfully',
        );
      } finally {
        setAddingVolume(false);
      }
    },
    [kind, withToast],
  );

  const deleteLUN = useCallback(
    (id: string, lun: number) =>
      withToast(() => service.delete(`/api/v2/${kind}/${id}/${lun}`), 'Deleted Successfully'),
    [kind, withToast],
  );

  const remove = useCallback((id: string) => service.delete(`/api/v2/${kind}/${id}`), [kind]);

  // Rows carry the in-flight start/stop flags the lists render.
  const list = useMemo(
    () =>
      (query.data ?? []).map((resource) => {
        const state = busy[idOf(resource) ?? ''];
        return { ...resource, starting: state === 'starting', stopping: state === 'stopping' };
      }),
    [query.data, busy, idOf],
  );

  return {
    list,
    total: list.length,
    loading: query.isFetching,
    reload,
    start: (id: string) => toggle(id, 'start'),
    stop: (id: string) => toggle(id, 'stop'),
    remove,
    addLUN,
    addingVolume,
    deleteLUN,
  };
}
