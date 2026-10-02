// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteAction } from '@app/hooks/useDeleteAction';
import { withQuietToasts } from '@app/utils/toast';
import { deleteHAConfig, useDisableDrbdReactor } from './useHA';
import { type HARecord, decodeExecText, getConfigName, reactorConfigFiles } from './haStatus';

type Options = {
  /** The node running the resource, if any. */
  getPrimaryNode: (resourceName: string) => string | null;
  disableMutation: ReturnType<typeof useDisableDrbdReactor>;
};

// Delete goes through the shared delete flow (in-flight row, one outcome
// toast). It is two requests, undeploy then file delete, so their replies are
// kept quiet and the hook reports the pair once. drbd-reactor leaves a
// promoter's services running when its config disappears (the resource stays
// Primary, a VIP stays up), so a running configuration is stopped first, as
// Stop does on the active node; if that fails nothing is deleted.
export const useHADelete = ({ getPrimaryNode, disableMutation }: Options) => {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<HARecord | null>(null);
  const haDelete = useDeleteAction<HARecord>({
    keyOf: (record) => record.uuid,
    nameOf: (record) => record.name,
    toastSingle: true,
    remove: async (record) => {
      const [configFile] = reactorConfigFiles(record);
      const activeNode = getPrimaryNode(record.name);
      const configName = getConfigName(record);
      if (activeNode && configName) {
        const [stopped] = await disableMutation.mutateAsync({ nodes: [activeNode], config: configName, now: true });
        if (stopped && stopped.exit_code !== 0) {
          throw new Error(decodeExecText(stopped.stderr_utf8) || `exit code ${stopped.exit_code}`);
        }
      }
      return withQuietToasts(() => deleteHAConfig(record.name, configFile.replace('files', '')));
    },
    refresh: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] }),
        queryClient.invalidateQueries({ queryKey: ['ha-all-resource-definitions'] }),
        queryClient.invalidateQueries({ queryKey: ['linstor-files'] }),
        queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] }),
      ]),
  });

  return { haDelete, deleteTarget, setDeleteTarget };
};
