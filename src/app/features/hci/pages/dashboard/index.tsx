import React from 'react';
import { Tabs, TabsProps } from 'antd';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { VSANNodeList } from '@app/features/vsan';
import { StoragePoolInfo } from '@app/components/StoragePoolInfo';
import { FaultyList } from '@app/features/resource';

const HCIDashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);

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
      label: 'Faulty Resources',
      children: <FaultyList />,
    },
  ];

  return (
    <PageBasic title={t('dashboard:title')}>
      <Tabs defaultActiveKey="node" items={items} />
    </PageBasic>
  );
};

export default HCIDashboard;
