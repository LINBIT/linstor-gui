// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { OverviewList } from '@app/features/resource/components';

const ResourceOverview: React.FunctionComponent = () => {
  const { t } = useTranslation(['resource', 'common']);

  return (
    <PageBasic title={t('overview')}>
      <OverviewList />
    </PageBasic>
  );
};

export default ResourceOverview;
