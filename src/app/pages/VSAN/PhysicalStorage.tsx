// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import PageBasic from '@app/components/PageBasic';
import { Trans, useTranslation } from 'react-i18next';

import { PhysicalStorageList } from '@app/features/vsan';

export const PhysicalStorage = () => {
  const { t } = useTranslation();
  return (
    <PageBasic title={t('common:physical_storage')}>
      <div>
        <p>{t('vsan:ps_intro')}</p>
        <p>{t('vsan:ps_hover')}</p>
        <Trans i18nKey="vsan:ps_important" components={[<b key="b" />]} />
        <ul className="list-disc pl-8">
          <li>{t('vsan:ps_min_size')}</li>
          <li>
            <Trans i18nKey="vsan:ps_empty" components={[<b key="b" />, <code key="c" />]} />
          </li>
        </ul>
      </div>

      <PhysicalStorageList />
    </PageBasic>
  );
};
