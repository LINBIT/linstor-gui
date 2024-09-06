// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { List, Button, Tag, Popconfirm } from 'antd';
import { CreateNetWorkInterfaceRequestBody, NetWorkInterface } from '@app/features/ip';
import { NetInterfaceDetail } from './NetInterfaceDetail';

interface Props {
  list: NetWorkInterface[];
  handleDeleteNetWorkInterface: (netinterface: string) => void;
  handleSetActiveNetWorkInterface: (data: CreateNetWorkInterfaceRequestBody) => void;
}

const NetInterfaceList: React.FC<Props> = ({ list, handleDeleteNetWorkInterface, handleSetActiveNetWorkInterface }) => {
  const hasSingleNetworkInterface = Array.isArray(list) && list.length === 1;

  return (
    <List
      itemLayout="horizontal"
      dataSource={list}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Popconfirm
              key="delete"
              title="Delete the network interface"
              description="Are you sure to delete this network interface?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                handleDeleteNetWorkInterface(item.name);
              }}
            >
              <Button danger disabled={hasSingleNetworkInterface || item.is_active}>
                delete
              </Button>
            </Popconfirm>,
            <Popconfirm
              key="activate"
              title="Set as active"
              description="Are you sure to set this network interface as active?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                handleSetActiveNetWorkInterface({ ...item });
              }}
            >
              <Button key="active" disabled={item.is_active} type="primary">
                set as active
              </Button>
            </Popconfirm>,

            <NetInterfaceDetail key="detail" item={item} />,
          ]}
        >
          <List.Item.Meta title={item.name} description={item.address} />
          <div>
            {item.is_active && <Tag color="success">Active</Tag>}
            <code>{item.satellite_port}</code>
          </div>
        </List.Item>
      )}
    />
  );
};

export default NetInterfaceList;
