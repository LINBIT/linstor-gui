// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import { useTranslation } from 'react-i18next';
import { Tooltip } from 'antd';

import CONNECTED_SVG from '@app/assets/awesome-plug.svg';
import DISCONNECTED_SVG from '@app/assets/disconnected-icon.svg';

import './ConnectStatus.css';

import { useQuery } from '@tanstack/react-query';
import { getControllerConfig } from '@app/features/node';

const ConnectStatus: React.FC = () => {
  const { isLoading, error } = useQuery({
    queryKey: ['getControllerConfig'],
    queryFn: getControllerConfig,
  });

  const { t } = useTranslation('common');

  if (isLoading) {
    return null;
  }

  return (
    <div className="connect__status">
      {error ? (
        <Tooltip title={t('disconnected')}>
          <img className="connected__img" src={DISCONNECTED_SVG} />
        </Tooltip>
      ) : (
        <Tooltip title={t('connected')}>
          <img className="connected__img" src={CONNECTED_SVG} />
        </Tooltip>
      )}
    </div>
  );
};

export default ConnectStatus;
