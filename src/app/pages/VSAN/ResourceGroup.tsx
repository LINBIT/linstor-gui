// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import PageBasic from '@app/components/PageBasic';
import { useTranslation } from 'react-i18next';
import { ResourceGroupList } from '@app/features/vsan';

export const ResourceGroup = () => {
  const { t } = useTranslation();
  return (
    <PageBasic title={t('common:resource_groups')}>
      <p>
        {t('vsan:rg_intro_1')}
        <br />
        {t('vsan:rg_intro_2')}
        <br />
        {t('vsan:rg_intro_3')}
      </p>

      <ResourceGroupList />
    </PageBasic>
  );
};
