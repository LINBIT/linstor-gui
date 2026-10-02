// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMemo } from 'react';
import { useAllResourceDefinitions } from '@app/features/ha/useHA';
import type { HAResourceDefinition } from '@app/features/ha/useHA';

/** The resource definitions a new reactor file can be for: those without one yet. */
export function useResourceOptions() {
  const { data: allRDData, isLoading: rdLoading } = useAllResourceDefinitions();

  const rdOptions = useMemo(() => {
    if (!allRDData?.data || !Array.isArray(allRDData.data)) return [];
    return (allRDData.data as HAResourceDefinition[])
      .filter((rd) => !Object.keys(rd.props || {}).some((key) => key.startsWith('files/etc/drbd-reactor.d/')))
      .map((rd) => ({
        label: rd.name,
        value: rd.name,
      }));
  }, [allRDData]);

  return { rdOptions, rdLoading };
}
