// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { List, Tag } from 'antd';
import { Button } from '@app/components/Button';
import { CreateNetWorkInterfaceRequestBody, NetWorkInterface } from '@app/features/ip';
import { NetInterfaceDetail } from './NetInterfaceDetail';
import { useTranslation } from 'react-i18next';
import { Popconfirm } from '@app/components/Popconfirm';

interface Props {
  list: NetWorkInterface[];
  handleDeleteNetWorkInterface: (netinterface: string) => void;
  handleSetActiveNetWorkInterface: (data: CreateNetWorkInterfaceRequestBody) => void;
}

const NetInterfaceList: React.FC<Props> = ({ list, handleDeleteNetWorkInterface, handleSetActiveNetWorkInterface }) => {
  const hasSingleNetworkInterface = Array.isArray(list) && list.length === 1;
  const { t } = useTranslation(['common', 'node_detail']);

  return (
    <List
      itemLayout="horizontal"
      dataSource={list}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Popconfirm
              key="delete"
              title={t('common:delete_network_interface')}
              description={t('common:are_you_sure_delete_network_interface')}
              onConfirm={() => {
                handleDeleteNetWorkInterface(item.name);
              }}
            >
              <Button danger disabled={hasSingleNetworkInterface || item.is_active}>
                {t('common:delete')}
              </Button>
            </Popconfirm>,
            <Popconfirm
              key="activate"
              title={t('common:activate')}
              description={t('common:are_you_sure_set_network_interface_as')}
              onConfirm={() => {
                handleSetActiveNetWorkInterface({ ...item });
              }}
            >
              <Button key="active" disabled={item.is_active} type="primary">
                {t('common:activate')}
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
