// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import PageBasic from '@app/components/PageBasic';
import { CreateResourceGroupFrom, getResourceGroups } from '@app/features/resourceGroup';

const ResourceGroupEdit: React.FC = () => {
  const { resourceGroup } = useParams() as { resourceGroup: string };

  const { data, isLoading } = useQuery({
    queryKey: ['getRG', resourceGroup],
    queryFn: () => {
      return getResourceGroups({
        resource_groups: [resourceGroup],
      });
    },
    enabled: !!resourceGroup,
  });

  const detailData = data?.data;

  const initialVal = {
    name: detailData?.[0]?.name,
    description: detailData?.[0]?.description,
    data_copy_mode: detailData?.[0]?.props?.['DrbdOptions/Net/protocol'],
    diskless_on_remaining: detailData?.[0]?.select_filter?.diskless_on_remaining,
    storage_pool_list: detailData?.[0]?.select_filter?.storage_pool_list ?? [],
    layer_stack: detailData?.[0]?.select_filter?.layer_stack?.map((e) => e.toLowerCase()) ?? [],
    provider_list: detailData?.[0]?.select_filter?.provider_list?.map((e) => e.toLowerCase()) ?? [],
    replicas_on_same: detailData?.[0]?.select_filter?.replicas_on_same ?? [],
    replicas_on_different: detailData?.[0]?.select_filter?.replicas_on_different ?? [],
    not_place_with_rsc: detailData?.[0]?.select_filter?.not_place_with_rsc ?? '',
    not_place_with_rsc_regex: detailData?.[0]?.select_filter?.not_place_with_rsc_regex ?? '',
    place_count: detailData?.[0]?.select_filter?.place_count ?? 2,
  };

  return (
    <PageBasic title="Edit Resource Group" loading={isLoading}>
      <CreateResourceGroupFrom initialValues={initialVal as any} isEdit />
    </PageBasic>
  );
};

export default ResourceGroupEdit;
