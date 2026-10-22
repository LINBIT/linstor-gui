// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { FunctionComponent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Empty, Skeleton } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { CreateResourceForm, getResources } from '@app/features/resource';
import { useTranslation } from 'react-i18next';

const ResourceEdit: FunctionComponent = () => {
  const { resource, node } = useParams() as { resource: string; node: string };
  const { t } = useTranslation('resource');

  const { data: detailData, isPending } = useQuery({
    // A resource is one per node: the node belongs in the key, or the page for
    // another node would open with this one's storage pool.
    queryKey: ['resourceEdit', resource, node],
    queryFn: async () => (await getResources({ resources: [resource], nodes: [node] })).data?.[0] ?? null,
    enabled: !!resource,
    // No cached copy for the next visit: the form would mount with the pool
    // from before the last edit and ignore the refetched one.
    gcTime: 0,
  });

  // The form reads its initial values once, so it mounts only after the
  // resource has arrived, and again for another resource or node.
  const content = isPending ? (
    <Skeleton active />
  ) : detailData ? (
    <CreateResourceForm
      key={`${node}/${resource}`}
      isEdit
      initialValues={{ name: detailData.name, storage_pool: detailData.props?.StorPoolName ?? '' }}
    />
  ) : (
    <Empty />
  );

  return <PageBasic title={t('edit')}>{content}</PageBasic>;
};

export default ResourceEdit;
