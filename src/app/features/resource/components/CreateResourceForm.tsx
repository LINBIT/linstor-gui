// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Radio, Select, Switch } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { uniqBy } from 'lodash';

import { useStoragePools } from '@app/features/storagePool';
import { useResourceDefinitions } from '@app/features/resourceDefinition';
import { useNodes } from '@app/features/node';
import { fullySuccess } from '@app/features/requests';
import { autoPlace, resourceCreateOnNode, resourceModify, getResources } from '../api';
import { AutoPlaceRequestBody, ResourceCreateRequestBody, ResourceModifyRequestBody } from '../types';
import { useTranslation } from 'react-i18next';

type FormType = {
  allocate_method: 'manual' | 'auto';
  name: string;
  node: string;
  storage_pool: string;
  size: number;
  deploy: boolean;
  place_count: number;
  diskless: boolean;
  network_preference: string;
  DRBD_DISKLESS: boolean;
};

type CreateResourceFormProps = {
  isEdit?: boolean;
  initialValues?: Partial<FormType>;
};

const CreateResourceForm = ({ isEdit, initialValues }: CreateResourceFormProps) => {
  const navigate = useNavigate();
  const { resource, node: nodeFromURL } = useParams() as { resource: string; node: string };
  const [form] = Form.useForm<FormType>();
  const { isLoading: resourceDefinitionIsLoading, data: resourceDefinitions } = useResourceDefinitions();
  const allocate_method = Form.useWatch('allocate_method', form);
  const node = Form.useWatch('node', form);
  const name = Form.useWatch('name', form);
  const { t } = useTranslation(['resource', 'common']);

  const backToList = () => {
    navigate(-1);
  };

  const { isLoading: nodesIsLoading, data: nodes } = useNodes();

  const { isLoading: storagePoolsIsLoading, data: storagePools } = useStoragePools({
    nodes: [node],
  });

  const { data: nodesHaveSelectedResource } = useQuery({
    queryKey: ['getResourceByName', name],
    queryFn: async () => {
      const resources = await getResources({
        resources: [name],
      });
      const nodesList = resources?.data?.map((e) => e.node_name);
      return nodesList;
    },
    enabled: !!name,
  });

  const createResourceMutation = useMutation({
    mutationFn: (
      data: ResourceCreateRequestBody & {
        node: string;
        resource_name: string;
      },
    ) => {
      const { node, resource_name, ...rest } = data;
      return resourceCreateOnNode(resource_name, node, rest);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (
      data: ResourceModifyRequestBody & {
        resource: string;
        node: string;
      },
    ) => {
      const { resource, node, ...rest } = data;
      return resourceModify(resource, node, rest);
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
    if (isEdit) {
      let updateData: ResourceModifyRequestBody;

      if (values.network_preference !== '') {
        updateData = {
          override_props: { StorPoolName: values.storage_pool, PrefNic: values.network_preference },
          delete_props: [],
        };
      } else {
        updateData = { override_props: { StorPoolName: values.storage_pool }, delete_props: ['PrefNic'] };
      }

      await updateMutation.mutateAsync({
        resource,
        node: nodeFromURL,
        ...updateData,
      });

      return;
    }

    if (values.allocate_method === 'manual') {
      const IS_DRBD_DISKLESS = values.storage_pool === 'DRBD_DISKLESS';
      const props = IS_DRBD_DISKLESS ? {} : { StorPoolName: values.storage_pool };

      const resourceData = {
        resource: {
          name: values.name,
          node_name: values.node,
          props,
        },
      };

      if (values.diskless) {
        Object.assign(resourceData, {
          resource: {
            ...resourceData.resource,
            flags: ['DISKLESS'],
          },
        });
      }

      if (IS_DRBD_DISKLESS) {
        Object.assign(resourceData, {
          resource: {
            ...resourceData.resource,
            flags: ['DRBD_DISKLESS'],
          },
        });
      }

      const createResourceRes = await createResourceMutation.mutateAsync({
        node: values.node,
        resource_name: values.name,
        ...resourceData,
      });

      if (fullySuccess(createResourceRes.data)) {
        backToList();
      }
    } else {
      const placeData = {
        diskless_on_remaining: values.diskless,
        select_filter: { place_count: Number(values.place_count), storage_pool: values.storage_pool },
      };

      const autoPlaceRes = await autoPlaceMutation.mutateAsync({
        resource: values.name,
        ...placeData,
      });

      if (fullySuccess(autoPlaceRes.data)) {
        backToList();
      }
    }
  };

  const isLoading = createResourceMutation.isLoading || autoPlaceMutation.isLoading;
  const isDisabled = resourceDefinitionIsLoading || storagePoolsIsLoading || nodesIsLoading;
  const isAuto = allocate_method === 'auto';

  const spList = isAuto
    ? uniqBy(storagePools, 'storage_pool_name')
        ?.filter((e) => {
          return e.provider_kind !== 'DISKLESS';
        })
        .map((e) => ({
          label: e.storage_pool_name,
          value: e.storage_pool_name,
        }))
    : uniqBy(storagePools, 'storage_pool_name')?.map((e) => ({
        label: e.storage_pool_name,
        value: e.storage_pool_name,
      }));

  const DRBD_DISKLESS = {
    label: '<DRBD_DISKLESS>',
    value: 'DRBD_DISKLESS',
  };

  return (
    <Form<FormType>
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 700 }}
      size="large"
      layout="horizontal"
      form={form}
      initialValues={{
        allocate_method: 'auto',
        place_count: 2,
        ...initialValues,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        label={t('common:resource_definition_name')}
        name="name"
        required
        rules={[
          {
            required: true,
            message: 'Resource definition name is required!',
          },
        ]}
      >
        <Select
          allowClear
          placeholder="Please select resource definition group"
          options={resourceDefinitions?.map((e) => ({
            label: e.name,
            value: e.name,
          }))}
          disabled={isEdit}
        />
      </Form.Item>

      {!isEdit && (
        <Form.Item label={t('common:allocate_method')} name="allocate_method" required>
          <Radio.Group>
            <Radio value="auto">{t('common:auto')}</Radio>
            <Radio value="manual">{t('common:manual')}</Radio>
          </Radio.Group>
        </Form.Item>
      )}

      {allocate_method === 'manual' && (
        <>
          <Form.Item
            label={t('common:node')}
            name="node"
            required
            rules={[{ required: true, message: 'Please select nodes!' }]}
          >
            <Select
              allowClear
              placeholder="Please select node"
              options={nodes
                ?.filter((node) => !nodesHaveSelectedResource?.includes(node.name))
                .map((e) => ({
                  label: e.name,
                  value: e.name,
                }))}
            />
          </Form.Item>

          <Form.Item label={t('common:storage_pool')} name="storage_pool">
            <Select allowClear placeholder="Please select storage pool" options={[DRBD_DISKLESS, ...spList]} />
          </Form.Item>
        </>
      )}

      {!isEdit && allocate_method !== 'manual' && (
        <>
          <Form.Item label={t('common:storage_pool')} name="storage_pool">
            <Select allowClear placeholder="Please select storage pool" options={spList} />
          </Form.Item>
          <Form.Item name="place_count" label={t('common:place_count')} required>
            <Input placeholder="Please input place count" type="number" min={0} />
          </Form.Item>

          <Form.Item name="diskless" label={t('common:diskless_on_remaining')}>
            <Switch />
          </Form.Item>
        </>
      )}

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit" loading={isLoading} disabled={isDisabled}>
          {t('common:submit')}
        </Button>

        <Button type="text" onClick={backToList}>
          {t('common:cancel')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateResourceForm };
