// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { List } from '@app/features/remote';

const RemoteList = () => {
  const { t } = useTranslation('remote');
  return (
    <PageBasic title={t('list')}>
      <List />
    </PageBasic>
  );
};

export default RemoteList;
