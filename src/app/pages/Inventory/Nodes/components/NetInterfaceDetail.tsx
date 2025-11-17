// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Modal } from 'antd';
import { Button } from '@app/components/Button';
import { Link } from '@app/components/Link';
import { getNetWorkInterfaceByNode, NetWorkInterface } from '@app/features/ip';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useNodes } from '@app/features/node';
import { getResourceGroups } from '@app/features/resourceGroup';
import { UIMode } from '@app/models/setting';
import { RootState } from '@app/store';

type NetInterfaceDetailProp = {
  item: NetWorkInterface;
};

const Content = styled.div`
  padding: 10px;
`;

const Title = styled.div`
  font-size: 1.2rem;
  font-weight: semi-bold;
  display: flex;
`;

export const NetInterfaceDetail = ({ item }: NetInterfaceDetailProp) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation(['common', 'node_detail']);

  const nodes = useNodes({});

  const resourceGroups = useQuery({
    queryKey: ['resourceGroup'],
    queryFn: () => getResourceGroups({}),
  });

  const { vsanModeFromSetting } = useSelector((state: RootState) => ({
    vsanModeFromSetting: state.setting.mode === UIMode.VSAN,
  }));

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

  if (nodes.isLoading || networkQueries.some((item) => item.isLoading)) {
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
        <Title>{t('node_detail:network_interface_used_by', { name: item.name })}</Title>
        <Title>{t('node_detail:nodes')} </Title>
        <Content>
          {nodeListInfo.map((nw) => {
            return (
              <div key={nw?.uuid}>
                {nw?.name} -
                <Link to={`${vsanModeFromSetting ? '/vsan/nodes' : '/inventory/nodes'}/${nw?.node}`}>{nw?.node}</Link>
                {nw?.address === item.address ? t('node_detail:current_node') : ''}
              </div>
            );
          })}
        </Content>

        <Title>{t('node_detail:resource_group')} </Title>
        {resourceGroupInfo.length === 0 && <Content>{t('node_detail:not_used_by_resource_group')}</Content>}
        <Content>
          {resourceGroupInfo.map((rg) => {
            return <div key={rg?.uuid}>{rg?.name}</div>;
          })}
        </Content>
      </Modal>
    </>
  );
};
