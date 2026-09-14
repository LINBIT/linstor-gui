// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { BackUpList } from '@app/features/remote';

const BackupList = () => {
  const { t } = useTranslation();
  return (
    <PageBasic title={t('remote:backups')} showBack>
      <BackUpList />
    </PageBasic>
  );
};

export default BackupList;
