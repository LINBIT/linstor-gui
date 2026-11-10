// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleFilled } from '@ant-design/icons';

import PageBasic from '@app/components/PageBasic';
import { VSANNodeList } from '@app/features/vsan';
import { StoragePoolInfo } from '@app/components/StoragePoolInfo';
import { FaultyList, isFocusFaulty, useFaultyResources } from '@app/features/resource';

const HCIDashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { data: faultyResources } = useFaultyResources();

  const hasFaultyResources = (faultyResources?.length ?? 0) > 0;

  // The header's faulty-resource icon opens the faulty resources tab, also when
  // this dashboard is already showing another one.
  const location = useLocation();
  const focusFaulty = isFocusFaulty(location.state);
  const [activeKey, setActiveKey] = useState(focusFaulty ? 'faultylist' : 'node');
  useEffect(() => {
    if (focusFaulty) setActiveKey('faultylist');
  }, [focusFaulty, location.key]);

  const items: TabsProps['items'] = [
    {
      key: 'node',
      label: 'Nodes',
      children: <VSANNodeList />,
    },
    {
      key: 'storagepools',
      label: 'Storage Pools',
      children: <StoragePoolInfo />,
    },
    {
      key: 'faultylist',
      label: (
        <span className="flex items-center gap-1">
          {hasFaultyResources && <ExclamationCircleFilled className="text-(--status-warning) text-[14px]" />}
          {t('common:faulty_resources')}
        </span>
      ),
      children: <FaultyList />,
    },
  ];

  return (
    <PageBasic title={t('dashboard:title')}>
      <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
    </PageBasic>
  );
};

export default HCIDashboard;
