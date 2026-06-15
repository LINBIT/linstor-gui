// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getNodes } from '@app/features/node/api';

import { CLUSTER_SETUP_DISMISSED_KEY, getDismissed, setDismissed } from '../dismiss';

export type UseClusterEmptyResult = {
  empty: boolean;
  dismissed: boolean;
  isFetched: boolean;
  dismiss: () => void;
  refetch: () => void;
};

export const useClusterEmpty = (): UseClusterEmptyResult => {
  const [dismissed, setDismissedState] = useState<boolean>(() => getDismissed());

  const { data, isFetched, refetch } = useQuery({
    queryKey: ['cluster-setup-node-check'],
    queryFn: () => getNodes({}),
  });

  // Mirror cross-tab localStorage changes (Dismiss in one tab should hide the
  // card in another tab once we re-evaluate).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CLUSTER_SETUP_DISMISSED_KEY) {
        setDismissedState(getDismissed());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setDismissedState(true);
  }, []);

  const nodeCount = (data?.data ?? []).length;
  const empty = nodeCount === 0;

  return {
    empty,
    dismissed,
    isFetched,
    dismiss,
    refetch: () => {
      void refetch();
    },
  };
};
