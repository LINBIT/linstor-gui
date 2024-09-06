// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Spinner } from '@patternfly/react-core';

import { useTranslation } from 'react-i18next';

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
    return <Spinner isSVG size="sm" />;
  }

  return (
    <div className="connect__status">
      {error ? (
        <>
          <img className="connected__img" src={DISCONNECTED_SVG} /> <span>{t('disconnected')}</span>
        </>
      ) : (
        <>
          <img className="connected__img" src={CONNECTED_SVG} /> <span>{t('connected')}</span>
        </>
      )}
    </div>
  );
};

export default ConnectStatus;
