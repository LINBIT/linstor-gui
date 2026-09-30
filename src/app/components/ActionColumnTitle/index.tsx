// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { LiaToolsSolid } from 'react-icons/lia';

/**
 * Header of a table's row-actions column: the tools icon, with its name in a
 * tooltip and, for screen readers, as text (an icon alone leaves the column,
 * and every action cell under it, without a header).
 */
export const ActionColumnTitle = () => {
  const { t } = useTranslation('common');
  return (
    <Tooltip title={t('common:action')}>
      <span className="flex justify-center">
        <LiaToolsSolid className="w-4 h-4" aria-hidden />
        <span className="sr-only">{t('common:action')}</span>
      </span>
    </Tooltip>
  );
};
