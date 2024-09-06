// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';

import { List } from '@app/features/volumeDefinition/components/List';

const VolumeDefinitionList = () => {
  const { t } = useTranslation(['volume_definition', 'common']);

  return (
    <PageBasic title={t('list')}>
      <List />
    </PageBasic>
  );
};

export default VolumeDefinitionList;
