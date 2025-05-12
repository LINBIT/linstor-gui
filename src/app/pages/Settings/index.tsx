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

import Gateway from './components/Gateway';
import Logo from './components/Logo';
import Dashboard from './components/Dashboard';
import Passphrase from './components/Passphrase';

const GeneralSettings = () => {
  const { t } = useTranslation(['common', 'settings']);
  const dispatch = useDispatch<Dispatch>();
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
