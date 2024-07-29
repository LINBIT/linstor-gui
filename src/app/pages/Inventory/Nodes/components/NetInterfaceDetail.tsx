import { getNetWorkInterfaceByNode, NetWorkInterface } from '@app/features/ip';
import { useNodes } from '@app/features/node';
import { getResourceGroups } from '@app/features/resourceGroup';
import styled from '@emotion/styled';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Button, Modal } from 'antd';
import React, { useState } from 'react';

type NetInterfaceDetailProp = {
  item: NetWorkInterface;
};

const Content = styled.div`
  padding: 10px;
`;

const Title = styled.div`
  font-size: 1.2rem;
  font-weight: semi-bold;
`;

export const NetInterfaceDetail = ({ item }: NetInterfaceDetailProp) => {
  const [open, setOpen] = useState(false);

  const nodes = useNodes({});

  const resourceGroups = useQuery({
    queryKey: ['resourceGroup'],
    queryFn: () => getResourceGroups({}),
  });

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

  console.log(item, 'item');

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
      <Button onClick={onDetail}>detail</Button>
      <Modal open={open} wrapClassName="netinterface-modal" footer={null} onCancel={onCancel}>
        <Title>{item.name} is being used by: </Title>
        <Title>Nodes: </Title>
        <Content>
          {nodeListInfo.map((nw) => {
            return (
              <div key={nw?.uuid}>
                {nw?.name} - {nw?.node} {nw?.address === item.address ? '(current node)' : ''}
              </div>
            );
          })}
        </Content>

        <Title>Resource Group: </Title>
        <Content>
          {resourceGroupInfo.map((rg) => {
            return <div key={rg?.uuid}>{rg?.name}</div>;
          })}
        </Content>
      </Modal>
    </>
  );
};
