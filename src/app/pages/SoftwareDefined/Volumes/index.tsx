// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { List as VolumeList } from '@app/features/volume';

const List = () => {
  const { t } = useTranslation(['volume', 'common']);

  return (
    <PageBasic title={t('list')}>
      <VolumeList />
    </PageBasic>
  );
};

export default List;
