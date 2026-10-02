// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMemo } from 'react';
import { useLinstorFiles } from './useHA';
import type { HARecord } from './haStatus';

/** DRBD Reactor files in LINSTOR's file registry that no HA resource deploys. */
export const useUnmanagedFiles = (data: HARecord[] | undefined) => {
  const { data: filesData } = useLinstorFiles();

  // Compute unmanaged DRBD Reactor files (in LINSTOR file registry but not deployed to any HA resource)
  const managedFilePaths = useMemo(() => {
    const paths = new Set<string>();
    data?.forEach((rd) => {
      if (rd.props) {
        Object.keys(rd.props)
          .filter((k) => k.startsWith('files/etc/drbd-reactor.d/'))
          .forEach((k) => paths.add(k.replace('files', '')));
      }
    });
    return paths;
  }, [data]);

  return useMemo(() => {
    const files = (filesData?.data as Array<{ path: string }>) || [];
    return files
      .filter((f) => f.path.startsWith('/etc/drbd-reactor.d/') && f.path.endsWith('.toml'))
      .filter((f) => !managedFilePaths.has(f.path));
  }, [filesData, managedFilePaths]);
};
