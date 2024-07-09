import { Button, List } from 'antd';
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import PageBasic from '@app/components/PageBasic';
import PropertyForm from '@app/components/PropertyForm';
import { getControllerProperties, updateController } from '@app/features/node';

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
        renderItem={(item) => (
          <List.Item>
            <span>{item.key}</span>
            <span>{item.value}</span>
          </List.Item>
        )}
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
