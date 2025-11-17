// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import { useTranslation } from 'react-i18next';
import { Tooltip } from 'antd';

import './ConnectStatus.css';

import { useQuery } from '@tanstack/react-query';
import { getControllerConfig } from '@app/features/node';
import { ConnectedIcon, DisconnectedIcon } from '@app/components/SVGIcon';

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
          <div className="inline-block">
            <DisconnectedIcon />
          </div>
        </Tooltip>
      ) : (
        <Tooltip title={t('connected')}>
          <div className="inline-block">
            <ConnectedIcon />
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default ConnectStatus;
