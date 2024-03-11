import React from 'react';
import { Tabs, TabsProps } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { VSANNodeList } from '@app/features/node';
import { ISCSIList, NVMeoFList, NFSExportList } from '@app/features/vsan';

const items: TabsProps['items'] = [
  {
    key: 'node',
    label: 'Nodes',
    children: <VSANNodeList />,
  },
  {
    key: 'iscsi',
    label: 'iSCSI Targets',
    children: <ISCSIList />,
  },
  {
    key: 'nvme-of',
    label: 'NVMe-oF Targets',
    children: <NVMeoFList />,
  },
  {
    key: 'nfs',
    label: 'NFS Targets',
    children: <NFSExportList />,
  },
];

export const Dashboard = () => {
  return (
    <PageBasic title="Dashboard">
      <Tabs defaultActiveKey="node" items={items} />
    </PageBasic>
  );
};
