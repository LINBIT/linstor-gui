// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMemo } from 'react';

import { useNodes } from '@app/features/node/hooks/useNode';
import { useDrbdReactorFailures } from './useHA';

// Where to get drbd-reactor when no node has it.
export const DRBD_REACTOR_URL = 'https://linbit.com/drbd-reactor/';

// Which nodes lack drbd-reactor, read from the same status query the list uses.
export const useReactorInstallation = () => {
  const { data: nodesData } = useNodes();
  const nodeNames = useMemo(() => (nodesData ?? []).map((n) => n.name), [nodesData]);
  const { data: failures } = useDrbdReactorFailures(nodeNames);

  const notInstalled = useMemo(() => (failures ?? []).filter((f) => f.notInstalled).map((f) => f.node), [failures]);
  // Only once every node has answered that it lacks drbd-reactor: until then Create stays as it was.
  const installedNowhere = nodeNames.length > 0 && notInstalled.length === nodeNames.length;

  return { notInstalled, installedNowhere };
};
