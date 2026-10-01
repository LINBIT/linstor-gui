// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Modal } from 'antd';
import { Button } from '@app/components/Button';
import { Link } from '@app/components/Link';
import { getNetWorkInterfaceByNode, NetWorkInterface } from '@app/features/ip';
import { useTranslation } from 'react-i18next';

import { useNodes } from '@app/features/node';
import { getResourceGroups } from '@app/features/resourceGroup';
import { UIMode } from '@app/features/settings/types';
import { useUIMode } from '@app/features/settings/useSettings';

type NetInterfaceDetailProp = {
  item: NetWorkInterface;
};

export const NetInterfaceDetail = ({ item }: NetInterfaceDetailProp) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation(['common', 'node_detail']);

  const nodes = useNodes({});

  const resourceGroups = useQuery({
    queryKey: ['resourceGroup'],
    queryFn: () => getResourceGroups({}),
  });

  const vsanModeFromSetting = useUIMode() === UIMode.VSAN;

  const networkQueries = useQueries({
    queries:
      nodes?.data?.map((item) => ({
        queryKey: ['itemDetails', item.name],
        queryFn: async () => {
          const res = await getNetWorkInterfaceByNode(item.name);

          return res.data?.map((nw) => ({
            ...nw,
            node: item.name,
          }));
        },
        enabled: !!nodes?.data,
      })) || [],
  });

  const onDetail = () => {
    setOpen(true);
  };

  const onCancel = () => {
    setOpen(false);
  };

  if (nodes.isPending || networkQueries.some((item) => item.isLoading)) {
    return <div>{t('node_detail:loading')}</div>;
  }

  const nodeListInfo =
    networkQueries
      ?.map((nw) => {
        return nw.data;
      })
      ?.flat()
      ?.filter((nw) => nw?.name === item.name) || [];

  const resourceGroupInfo = resourceGroups.data?.data?.filter((rg) => rg?.props?.['PrefNic'] === item.name) || [];

  return (
    <>
      <Button type="secondary" onClick={onDetail}>
        {t('common:detail')}
      </Button>
      <Modal open={open} wrapClassName="netinterface-modal" footer={null} onCancel={onCancel}>
        <div className="flex text-[1.2rem]">{t('node_detail:network_interface_used_by', { name: item.name })}</div>
        <div className="flex text-[1.2rem]">{t('node_detail:nodes')} </div>
        <div className="p-2.5">
          {nodeListInfo.map((nw) => {
            return (
              <div key={nw?.uuid}>
                {nw?.name} -
                <Link to={`${vsanModeFromSetting ? '/vsan/nodes' : '/inventory/nodes'}/${nw?.node}`}>{nw?.node}</Link>
                {nw?.address === item.address ? t('node_detail:current_node') : ''}
              </div>
            );
          })}
        </div>

        <div className="flex text-[1.2rem]">{t('node_detail:resource_group')} </div>
        {resourceGroupInfo.length === 0 && <div className="p-2.5">{t('node_detail:not_used_by_resource_group')}</div>}
        <div className="p-2.5">
          {resourceGroupInfo.map((rg) => {
            return <div key={rg?.uuid}>{rg?.name}</div>;
          })}
        </div>
      </Modal>
    </>
  );
};
