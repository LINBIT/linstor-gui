// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { NFSExportList } from '@app/features/vsan';

export const NFS = () => {
  const { t } = useTranslation();
  return (
    <PageBasic title={t('common:nfs_export_configuration')}>
      <NFSExportList complex />
    </PageBasic>
  );
};
