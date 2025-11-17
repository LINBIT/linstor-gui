// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Button as AntButton, Input, Popconfirm, Select, Table } from 'antd';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import Button from '@app/components/Button';
import { Switch } from '@app/components/Switch';
import PropertyForm from '@app/components/PropertyForm';
import { getControllerProperties, updateController } from '@app/features/node';
import { handlePropsToFormOption } from '@app/utils/property';
import { MinusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const Controller = () => {
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
          style={{ width: '100%', maxWidth: '200px' }}
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
          style={{ width: '100%', maxWidth: '200px' }}
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
      <div style={{ display: 'flex', alignItems: 'center' }}>
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
            <AntButton danger shape="circle" icon={<MinusOutlined />} size="small" style={{ marginLeft: 6 }} />
          </Popconfirm>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <div style={{ width: '40%' }}>
          <h4 className="font-medium text-[22px]">{t('common:controller')}</h4>
        </div>

        <div style={{ width: '60%' }} className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2 font-medium">{t('common:edit_mode')} </span>
            <Switch onChange={() => setEditMode((editMode) => !editMode)} />
          </div>

          <PropertyForm
            initialVal={properties?.data}
            type="controller"
            handleSubmit={(data) => {
              mutation.mutate(data);
            }}
          >
            <Button type="secondary">+ {t('common:add_property')}</Button>
          </PropertyForm>
        </div>
      </div>

      <Table
        style={{ marginTop: '1rem', tableLayout: 'fixed' }}
        className="mt-4"
        size="small"
        dataSource={propertiesArray}
        pagination={false}
        rowClassName={(_, index) => (index % 2 === 1 ? 'bg-gray-100' : '')}
        columns={[
          {
            title: t('common:controller_properties'),
            dataIndex: 'key',
            key: 'key',
            width: '40%',
            render: (text) => <span>{text}</span>,
          },
          {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            width: '60%',
            render: (value, record) => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {editMode ? renderItem(record) : <span>{value}</span>}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
