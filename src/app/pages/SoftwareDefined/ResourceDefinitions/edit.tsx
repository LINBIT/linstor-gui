// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Empty, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { CreateForm as ResourceDefinitionForm, getResourceDefinition } from '@app/features/resourceDefinition';

const Edit = () => {
  const { resource } = useParams() as { resource: string };
  const { t } = useTranslation(['resource_definition']);

  const { data: definition, isPending } = useQuery({
    queryKey: ['resourceDefinitionEdit', resource],
    queryFn: async () => (await getResourceDefinition({ resource_definitions: [resource] })).data?.[0] ?? null,
    // No cached copy for the next visit: the form would mount with the group
    // from before the last edit and ignore the refetched one.
    gcTime: 0,
  });

  // The form reads its initial values once, so it mounts only after the
  // definition has arrived.
  const content = isPending ? (
    <Skeleton active />
  ) : definition ? (
    <ResourceDefinitionForm
      isEdit
      initialValues={{
        name: definition.name,
        resource_group_name: definition.resource_group_name,
        // Shown, not editable; a definition without the property runs protocol C.
        replication_mode: (definition.props?.['DrbdOptions/Net/protocol'] ?? 'C') as 'A' | 'C',
      }}
    />
  ) : (
    <Empty />
  );

  return <PageBasic title={t('resource_definition:edit')}>{content}</PageBasic>;
};

export default Edit;
