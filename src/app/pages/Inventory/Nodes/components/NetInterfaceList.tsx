// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Tag } from 'antd';
import { Button } from '@app/components/Button';
import { CreateNetWorkInterfaceRequestBody, NetWorkInterface } from '@app/features/ip';
import { NetInterfaceDetail } from './NetInterfaceDetail';
import { useTranslation } from 'react-i18next';
import { Popconfirm } from '@app/components/Popconfirm';
import { ItemList } from '@app/components/ItemList';

interface Props {
  list: NetWorkInterface[];
  handleDeleteNetWorkInterface: (netinterface: string) => void;
  handleSetActiveNetWorkInterface: (data: CreateNetWorkInterfaceRequestBody) => void;
}

const NetInterfaceList: React.FC<Props> = ({ list, handleDeleteNetWorkInterface, handleSetActiveNetWorkInterface }) => {
  const hasSingleNetworkInterface = Array.isArray(list) && list.length === 1;
  const { t } = useTranslation(['common', 'node_detail']);

  return (
    <ItemList
      items={list}
      rowKey={(item) => item.name}
      renderItem={(item) => (
        <ItemList.Item
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
          <ItemList.Meta title={item.name} description={item.address} />
          <div className="flex items-center gap-2">
            {item.is_active && <Tag color="success">{t('node_detail:active')}</Tag>}
            {item.satellite_port !== undefined && (
              <span>
                <span className="text-(--text-secondary)">{t('node_detail:tcp_port')}</span>{' '}
                <span className="tabular-nums">{item.satellite_port}</span>
              </span>
            )}
          </div>
        </ItemList.Item>
      )}
    />
  );
};

export default NetInterfaceList;
