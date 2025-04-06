// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { ScheduleByResourceList } from '@app/features/schedule';

const ScheduleResource = () => {
  const { t } = useTranslation('schedule');
  return (
    <PageBasic title={t('list')}>
      <ScheduleByResourceList />
    </PageBasic>
  );
};

export default ScheduleResource;
