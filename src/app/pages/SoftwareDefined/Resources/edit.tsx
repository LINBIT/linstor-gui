// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { FunctionComponent } from 'react';
import { useParams } from 'react-router-dom';
import get from 'lodash.get';
import { useQuery } from '@tanstack/react-query';

import PageBasic from '@app/components/PageBasic';
import { CreateResourceForm, getResources } from '@app/features/resource';

const ResourceEdit: FunctionComponent = () => {
  const { resource, node } = useParams() as { resource: string; node: string };

  const { data, isLoading } = useQuery({
    queryKey: ['getResource', resource],
    queryFn: () => {
      return getResources({
        resources: [resource],
        nodes: [node],
      });
    },
    enabled: !!resource,
  });

  const detailData = data?.data?.[0];

  const initialValues = {
    ...detailData,
    storage_pool: get(detailData, 'props.StorPoolName', ''),
  };

  return (
    <PageBasic title="Edit Resource" loading={isLoading}>
      <CreateResourceForm isEdit initialValues={initialValues} />
    </PageBasic>
  );
};

export default ResourceEdit;
