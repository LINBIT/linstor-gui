// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { preconnectToGrafana } from '@app/hooks';

/**
 * Component to preconnect to Grafana on app initialization
 * This helps improve iframe loading performance
 */
const GrafanaPreconnect: React.FC = () => {
  const grafanaConfig = useSelector((state: RootState) => state.setting?.grafanaConfig);

  useEffect(() => {
    if (grafanaConfig?.enable && grafanaConfig?.baseUrl) {
      preconnectToGrafana(grafanaConfig.baseUrl);
    }
  }, [grafanaConfig?.enable, grafanaConfig?.baseUrl]);

  return null;
};

export default GrafanaPreconnect;
