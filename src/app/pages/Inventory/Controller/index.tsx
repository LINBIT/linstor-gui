// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Button, Divider, Input, List, Popconfirm, Select, Space, Switch } from 'antd';
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import PageBasic from '@app/components/PageBasic';
import PropertyForm from '@app/components/PropertyForm';
import { getControllerProperties, updateController } from '@app/features/node';
import { handlePropsToFormOption } from '@app/utils/property';
import { MinusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const Controller = () => {
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { t } = useTranslation(['common']);

  const { data: properties, refetch } = useQuery({
    queryKey: ['controllerProperties'],
    queryFn: getControllerProperties,
  });

  const mutation = useMutation({
    mutationFn: updateController,
    onSuccess: () => {
      refetch();
    },
  });

  const propertiesArray = Object.entries(properties?.data || {}).map(([key, value]) => ({
    key,
    value,
  }));

  const nodePropertyList = handlePropsToFormOption('controller', properties?.data);

  const renderItem = (item: { key: string; value: string }) => {
    const isBoolean = item.value === 'false' || item.value === 'true';

    const info = nodePropertyList.find((e) => e.label === item.key);

    let inputItem = <span>{item.value}</span>;
    let deleteButton = true;

    if (item.key.startsWith('Aux/') || (!info && !isBoolean)) {
      inputItem = (
        <Input
          style={{ width: '200px' }}
          defaultValue={item.value}
          onChange={(e) => {
            mutation.mutate({
              override_props: { [item.key]: e.target.value },
            });
          }}
        />
      );
    } else if (info?.type === 'checkbox' || isBoolean) {
      inputItem = (
        <Switch
          checked={item.value === 'true'}
          onChange={(checked) => {
            mutation.mutate({
              override_props: { [item.key]: checked.toString() },
            });
          }}
        />
      );
    } else if (info?.type === 'single_select') {
      inputItem = (
        <Select
          value={item.value}
          onChange={(e) => {
            mutation.mutate({
              override_props: { [item.key]: e },
            });
          }}
          options={info.extraInfo?.options?.map((e) => ({ label: e.label, value: e.value })) || []}
        ></Select>
      );
    } else {
      deleteButton = false;
    }

    return (
      <div>
        {inputItem}
        {deleteButton && info && (
          <Popconfirm
            title="Delete the property"
            description="Are you sure to delete this property?"
            onConfirm={() => {
              mutation.mutate({
                delete_props: [item.key],
              });
            }}
            onCancel={() => {}}
            okText="Yes"
            cancelText="No"
          >
            <Button danger shape="circle" icon={<MinusOutlined />} size="small" style={{ marginLeft: 6 }} />
          </Popconfirm>
        )}
      </div>
    );
  };

  return (
    <PageBasic title={t('common:controller')}>
      <Space>
        {t('common:edit')}: <Switch onChange={() => setEditMode((editMode) => !editMode)} />
        <Divider type="vertical" />
        <PropertyForm
          initialVal={properties?.data}
          type="controller"
          handleSubmit={(data) => {
            mutation.mutate(data);
          }}
        >
          <Button>{t('common:add_property')}</Button>
        </PropertyForm>
      </Space>

      <List
        style={{ marginTop: '1rem' }}
        className="mt-4"
        size="small"
        header={<h4>{t('common:controller_properties')}</h4>}
        bordered
        dataSource={propertiesArray}
        renderItem={(item) => {
          return (
            <List.Item>
              <span>{item.key} </span>
              {editMode ? renderItem(item) : <span>{item.value}</span>}
            </List.Item>
          );
        }}
      />
    </PageBasic>
  );
};
