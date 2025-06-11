// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Tabs, TabsProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleFilled } from '@ant-design/icons';

import PageBasic from '@app/components/PageBasic';
import { VSANNodeList } from '@app/features/vsan';
import { StoragePoolInfo } from '@app/components/StoragePoolInfo';
import { FaultyList, useFaultyResources } from '@app/features/resource';

const HCIDashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { data: faultyResources } = useFaultyResources();

  const hasFaultyResources = (faultyResources?.length ?? 0) > 0;

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
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {hasFaultyResources && (
            <ExclamationCircleFilled
              style={{
                color: '#faad14',
                fontSize: '14px',
              }}
            />
          )}
          Faulty Resources
        </span>
      ),
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
