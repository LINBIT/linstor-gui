// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import PageBasic from '@app/components/PageBasic';
import { CreateResourceGroupFrom } from '@app/features/resourceGroup';

const ResourceGroupEdit: React.FC = () => {
  const { t } = useTranslation();
  const { resourceGroup } = useParams() as { resourceGroup: string };
  return (
    <PageBasic title={t('common:edit_resource_group')}>
      <CreateResourceGroupFrom resourceGroup={resourceGroup} isEdit />
    </PageBasic>
  );
};

export default ResourceGroupEdit;
