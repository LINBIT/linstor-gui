// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { getNetWorkInterfaceByNode, NetWorkInterface } from '@app/features/ip';
import { useNodes } from '@app/features/node';
import { getResourceGroups } from '@app/features/resourceGroup';
import { RootState } from '@app/store';
import styled from '@emotion/styled';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Button, Modal } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

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
  const history = useHistory();

  const resourceGroups = useQuery({
    queryKey: ['resourceGroup'],
    queryFn: () => getResourceGroups({}),
  });

  const { vsanModeFromSetting } = useSelector((state: RootState) => ({
    vsanModeFromSetting: state.setting.vsanMode,
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
    return <div>loading...</div>;
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
      <Button onClick={onDetail}>{t('common:detail')}</Button>
      <Modal open={open} wrapClassName="netinterface-modal" footer={null} onCancel={onCancel}>
        <Title>
          Network interface <h5>&nbsp;{item.name}&nbsp;</h5> is used by:
        </Title>
        <Title>Nodes: </Title>
        <Content>
          {nodeListInfo.map((nw) => {
            return (
              <div key={nw?.uuid}>
                {nw?.name} -
                <Button
                  type="link"
                  onClick={() => {
                    const url = vsanModeFromSetting ? '/vsan/nodes' : '/inventory/nodes';
                    history.push(`${url}/${nw?.node}`);
                  }}
                >
                  {nw?.node}
                </Button>
                {nw?.address === item.address ? '(current node)' : ''}
              </div>
            );
          })}
        </Content>

        <Title>Resource Group: </Title>
        {resourceGroupInfo.length === 0 && <Content>Not used by any resource group</Content>}
        <Content>
          {resourceGroupInfo.map((rg) => {
            return <div key={rg?.uuid}>{rg?.name}</div>;
          })}
        </Content>
      </Modal>
    </>
  );
};
