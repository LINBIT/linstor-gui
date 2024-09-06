// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useDispatch } from 'react-redux';

import PageBasic from '@app/components/PageBasic';
import { Dispatch } from '@app/store';
import Gateway from './components/Gateway';
import Logo from './components/Logo';
import Dashboard from './components/Dashboard';
import Passphrase from './components/Passphrase';

const GeneralSettings: React.FC = () => {
  const dispatch = useDispatch<Dispatch>();
  const onChange = (key: string) => {
    console.log(key);
  };

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'General',
      children: <Logo />,
    },
    {
      key: '2',
      label: 'Gateway',
      children: <Gateway />,
    },
    {
      key: '3',
      label: 'Grafana',
      children: <Dashboard />,
    },
    {
      key: '4',
      label: 'Passphrase',
      children: <Passphrase />,
    },
  ];

  useEffect(() => {
    // Check Settings from Linstor Key-Value-Store
    dispatch.setting.getSettings();
    // check if Gateway is available
    dispatch.setting.getGatewayStatus();
  }, [dispatch.setting]);

  return (
    <PageBasic title="Settings">
      <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
    </PageBasic>
  );
};

export default GeneralSettings;
