// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useResourcesView } from '@app/features/resource/hooks/useResourcesView';

interface ResourceFilter {
  nodes?: string[];
  resources?: string[];
}

/** Resources from the shared resource list, optionally only those on the given nodes or with the given names. */
const useResources = (filter?: ResourceFilter) => {
  const { isPending, error, data } = useResourcesView({
    select: (resources) =>
      resources.filter(
        (r) =>
          (!filter?.nodes?.length || filter.nodes.includes(r.node_name ?? '')) &&
          (!filter?.resources?.length || filter.resources.includes(r.name ?? '')),
      ),
  });

  return { isPending, error, data };
};

export { useResources };
