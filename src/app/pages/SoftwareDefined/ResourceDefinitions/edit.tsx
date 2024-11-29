// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useParams } from 'react-router-dom';

import PageBasic from '@app/components/PageBasic';
import get from 'lodash.get';
import { useQuery } from '@tanstack/react-query';
import { CreateForm, getResourceDefinition } from '@app/features/resourceDefinition';
import { useTranslation } from 'react-i18next';

const Edit: React.FC = () => {
  const { resourceDefinition } = useParams() as { resourceDefinition: string };
  const { t } = useTranslation(['resource_definition']);

  const { data, isLoading } = useQuery({
    queryKey: ['getRD', resourceDefinition],
    queryFn: () => {
      return getResourceDefinition({
        resource_definitions: [resourceDefinition],
      });
    },
    enabled: !!resourceDefinition,
  });

  const detailData = data?.data;

  const initialVal = {
    name: detailData?.[0]?.name,
    resource_group_name: detailData?.[0].resource_group_name,
    replication_mode: get(detailData?.[0], 'props[DrbdOptions/Net/protocol]'),
  };

  return (
    <PageBasic title={t('resource_definition:edit')} loading={isLoading}>
      <CreateForm initialValues={initialVal} isEdit />
    </PageBasic>
  );
};

export default Edit;
