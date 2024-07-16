import { Button, List, Switch } from 'antd';
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import PageBasic from '@app/components/PageBasic';
import PropertyForm from '@app/components/PropertyForm';
import { getControllerProperties, updateController } from '@app/features/node';
import { handlePropsToFormOption } from '@app/utils/property';

export const Controller = () => {
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

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

  return (
    <PageBasic title="Controller">
      <Button type="primary" onClick={() => setPropertyModalOpen(true)}>
        Edit Properties
      </Button>

      <List
        style={{ marginTop: '1rem' }}
        className="mt-4"
        size="small"
        header={<div>Controller Properties</div>}
        bordered
        dataSource={propertiesArray}
        renderItem={(item) => {
          const info = nodePropertyList.find((e) => e.label === item.key);

          return (
            <List.Item>
              <span>{item.key}</span>
              {info?.type === 'checkbox' ? (
                <Switch
                  checked={item.value === 'true'}
                  onChange={(checked) => {
                    mutation.mutate({
                      override_props: { [item.key]: checked.toString() },
                    });
                  }}
                />
              ) : (
                <span>{item.value}</span>
              )}
            </List.Item>
          );
        }}
      />

      <PropertyForm
        initialVal={properties?.data}
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
