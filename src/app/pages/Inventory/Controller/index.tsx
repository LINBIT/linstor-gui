import { Button, List, Select, Space, Switch } from 'antd';
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import PageBasic from '@app/components/PageBasic';
import PropertyForm from '@app/components/PropertyForm';
import { getControllerProperties, updateController } from '@app/features/node';
import { handlePropsToFormOption } from '@app/utils/property';

export const Controller = () => {
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

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

  const renderItem = (item) => {
    const info = nodePropertyList.find((e) => e.label === item.key);

    console.log(info, 'info');

    if (info?.type === 'checkbox') {
      return (
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
      return (
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
    }

    return <span>{item.value}</span>;
  };

  return (
    <PageBasic title="Controller">
      <Space>
        <Button onClick={() => setEditMode((editMode) => !editMode)}>Edit</Button>
        <Button type="primary" onClick={() => setPropertyModalOpen(true)}>
          Add Properties
        </Button>
      </Space>

      <List
        style={{ marginTop: '1rem' }}
        className="mt-4"
        size="small"
        header={<div>Controller Properties</div>}
        bordered
        dataSource={propertiesArray}
        renderItem={(item) => {
          const info = nodePropertyList.find((e) => e.label === item.key);

          console.log(info, 'info');

          return (
            <List.Item>
              <span>{item.key} </span>
              {editMode ? renderItem(item) : <span>{item.value}</span>}
            </List.Item>
          );
        }}
      />

      <PropertyForm
        initialVal={{}}
        openStatus={propertyModalOpen}
        type="controller"
        handleSubmit={(data) => {
          mutation.mutate(data);
          setPropertyModalOpen(false);
        }}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </PageBasic>
  );
};
