import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Radio, Select, Switch } from 'antd';
import { useHistory } from 'react-router-dom';

import { useResourceGroups } from '@app/features/resourceGroup';
import { useStoragePools } from '@app/features/storagePool';
import { fullySuccess } from '@app/features/requests';
import { createResourceDefinition, createVolumeDefinition, autoPlace, updateResourceDefinition } from '../api';
import {
  CreateResourceDefinitionRequestBody,
  CreateVolumeDefinitionRequestBody,
  AutoPlaceRequestBody,
  UpdateResourceDefinitionRequestBody,
} from '../types';
import { SizeInput } from '@app/components/SizeInput';

type FormType = {
  replication_mode: 'A' | 'C';
  name: string;
  resource_group_name: string;
  storage_pool: string;
  size: number;
  deploy: boolean;
  place_count: number;
  diskless: boolean;
};
type CreateFormProps = {
  isEdit?: boolean;
  initialValues?: Partial<FormType>;
};

const CreateForm = ({ isEdit, initialValues }: CreateFormProps) => {
  const history = useHistory();
  const [form] = Form.useForm<FormType>();

  const deploy = Form.useWatch('deploy', form);

  const backToList = () => {
    history.goBack();
  };

  const { isLoading: resourceGroupsIsLoading, data: resourceGroups } = useResourceGroups({});
  const { isLoading: storagePoolsIsLoading, data: storagePools } = useStoragePools();

  const createResourceDefinitionMutation = useMutation({
    mutationFn: (data: CreateResourceDefinitionRequestBody) => createResourceDefinition(data),
  });

  const updateMutation = useMutation({
    mutationKey: ['updateResourceDefinition'],
    mutationFn: (
      data: UpdateResourceDefinitionRequestBody & {
        name: string;
      },
    ) => {
      const { name, ...rest } = data;

      return updateResourceDefinition(name, rest);
    },
  });

  const createVolumeDefinitionMutation = useMutation({
    mutationFn: (
      data: CreateVolumeDefinitionRequestBody & {
        resource: string;
      },
    ) => {
      const { resource, ...rest } = data;
      return createVolumeDefinition(resource, rest);
    },
  });

  const autoPlaceMutation = useMutation({
    mutationFn: (
      data: AutoPlaceRequestBody & {
        resource: string;
      },
    ) => {
      const { resource, ...rest } = data;
      return autoPlace(resource, rest);
    },
  });

  const onFinish = async (values: FormType) => {
    const resourceDefinitionData = {
      resource_definition: {
        name: values.name,
        props: {
          'DrbdOptions/Net/protocol': values.replication_mode,
          'DrbdOptions/PeerDevice/c-max-rate': '4194304',
        },
        resource_group_name: values.resource_group_name,
        volume_definitions: [],
      },
    };

    if (isEdit) {
      try {
        const res = await updateMutation.mutateAsync({
          name: values.name,
          resource_group: values.resource_group_name,
        });

        if (res.data) {
          backToList();
        }
      } catch (error) {
        console.log(error);
      }

      return;
    }

    // const volumeDefinitionData = {
    //   volume_definition: {
    //     size_kib: values.size,
    //     props: {
    //       StorPoolName: values.resource_group_name,
    //     },
    //   },
    // };

    const deployData = {
      diskless_on_remaining: values.diskless,
      select_filter: { place_count: Number(values.place_count) },
    };

    const rdRes = await createResourceDefinitionMutation.mutateAsync(resourceDefinitionData);

    if (fullySuccess(rdRes.data)) {
      if (values.deploy) {
        const autoPlaceRes = await autoPlaceMutation.mutateAsync({
          ...deployData,
          resource: values.name,
        });
        if (fullySuccess(autoPlaceRes.data)) {
          backToList();
        }
      } else {
        backToList();
      }
    }
    // const vdRes = await createVolumeDefinitionMutation.mutateAsync({
    //   ...volumeDefinitionData,
    //   resource: values.name,
    // });

    //   if (fullySuccess(vdRes.data)) {
    //     if (values.deploy) {
    //       const autoPlaceRes = await autoPlaceMutation.mutateAsync({
    //         ...deployData,
    //         resource: values.name,
    //       });
    //       if (fullySuccess(autoPlaceRes.data)) {
    //         backToList();
    //       }
    //     } else {
    //       backToList();
    //     }
    //   }
    // }
  };

  const isLoading =
    createResourceDefinitionMutation.isLoading ||
    createVolumeDefinitionMutation.isLoading ||
    autoPlaceMutation.isLoading;

  const isDisabled = resourceGroupsIsLoading || storagePoolsIsLoading || !resourceGroups || !storagePools;

  return (
    <Form<FormType>
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 700 }}
      size="large"
      layout="horizontal"
      form={form}
      initialValues={{
        resource_group_name: 'DfltRscGrp',
        replication_mode: 'C',
        deploy: false,
        place_count: 2,
        ...initialValues,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        label="Resource Definition Name"
        name="name"
        required
        rules={[
          {
            required: true,
            message: 'Resource definition name is required!',
          },
          {
            pattern: /^[A-Za-z0-9.+-]{1,127}$/,
            message: 'Resource definition name is invalid!',
          },
        ]}
        tooltip="Accepts only alphanumeric, ., +, _, and - characters. For example: res1, res.1, res+1, res_1, res-1"
      >
        <Input placeholder="Please input resource definition name" />
      </Form.Item>

      <Form.Item
        label="Resource Group"
        name="resource_group_name"
        required
        rules={[{ required: true, message: 'Please select resource group!' }]}
      >
        <Select
          allowClear
          placeholder="Please select resource group"
          options={resourceGroups?.map((e) => ({
            label: e.name,
            value: e.name,
          }))}
        />
      </Form.Item>

      <Form.Item label="Replication Mode" name="replication_mode">
        <Radio.Group>
          <Radio value="A">Asynchronous(A)</Radio>
          <Radio value="C">Synchronous(C)</Radio>
        </Radio.Group>
      </Form.Item>

      {!isEdit && (
        <Form.Item label="Spawn on created" name="deploy" valuePropName="checked">
          <Switch defaultChecked />
        </Form.Item>
      )}

      {deploy && (
        <>
          {!isEdit && (
            <Form.Item name="size" label="Size" required>
              <SizeInput />
            </Form.Item>
          )}

          <Form.Item name="place_count" label="Place Count" required>
            <Input placeholder="Please input place count" type="number" min={0} />
          </Form.Item>

          <Form.Item name="diskless" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
            <Checkbox>Diskless on remaining</Checkbox>
          </Form.Item>
        </>
      )}

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit" loading={isLoading} disabled={isDisabled}>
          Submit
        </Button>

        <Button type="text" onClick={backToList}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateForm };
