// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';

import { Tag } from '@app/components/Tag';

/** Marks the node the active controller runs on, in the brand chip colors. */
export const ActiveControllerTag: React.FC = () => {
  const { t } = useTranslation('node');

  return (
    <Tooltip title={t('active_controller_tooltip')}>
      <Tag tone="brand" className="m-0">
        {t('active_controller')}
      </Tag>
    </Tooltip>
  );
};
