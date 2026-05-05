// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { Dispatch } from '@app/store';
import { useLinstorVersion, MIN_API_VERSION } from '@app/hooks';

import Gateway from './components/Gateway';
import Logo from './components/Logo';
import Dashboard from './components/Dashboard';
import ControllerAuth from './components/ControllerAuth';

const GeneralSettings = () => {
  const { t } = useTranslation(['common', 'settings']);
  const dispatch = useDispatch<Dispatch>();
  const { isFetched: versionFetched, hasMinVersion } = useLinstorVersion();
  // Optimistically show the controller-auth tab while the version is still
  // loading; once known, hide it on controllers older than 1.28.0.
  const controllerAuthAvailable = !versionFetched || hasMinVersion(MIN_API_VERSION.AUTH_TOKENS);
  const onChange = (key: string) => {
    console.log(key);
  };

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: t('settings:general'),
      children: <Logo />,
    },
    {
      key: '2',
      label: t('settings:gateway'),
      children: <Gateway />,
    },
    {
      key: '3',
      label: t('settings:grafana'),
      children: <Dashboard />,
    },
    ...(controllerAuthAvailable
      ? [
          {
            key: '4',
            label: t('settings:controller_auth'),
            children: <ControllerAuth />,
          },
        ]
      : []),
  ];

  useEffect(() => {
    // Check Settings from Linstor Key-Value-Store
    dispatch.setting.getSettings();
  }, [dispatch.setting]);

  return (
    <PageBasic title={t('common:settings')}>
      <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
    </PageBasic>
  );
};

export default GeneralSettings;
