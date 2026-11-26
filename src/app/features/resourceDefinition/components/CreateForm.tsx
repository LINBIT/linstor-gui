// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { logger } from '@app/utils/logger';
import { useMutation } from '@tanstack/react-query';
import { Form, message } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';
import { useNavigate } from 'react-router-dom';

import { useResourceGroups } from '@app/features/resourceGroup';
import { useStoragePools } from '@app/features/storagePool';
import { fullySuccess } from '@app/features/requests';
import { useInvalidateResourcesView } from '@app/features/resource/hooks/useResourcesView';
import {
  createResourceDefinition,
  createVolumeDefinition,
  autoPlace,
  updateResourceDefinition,
  deleteResourceDefinition,
} from '../api';
import { usableNodes } from '../usableNodes';
import {
  CreateResourceDefinitionRequestBody,
  CreateVolumeDefinitionRequestBody,
  AutoPlaceRequestBody,
  UpdateResourceDefinitionRequestBody,
} from '../types';
import { SizeInput } from '@app/components/SizeInput';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@app/components/Checkbox';
import { Switch } from '@app/components/Switch';
import { InlineFormItem } from '@app/components/InlineFormItem';

import { Radio } from '@app/components/Radio';

// A ret_code packs severity, operation, object and outcome (linstor-server
// ApiConsts). This one is the "Resource definition 'x' modified." entry.
const MASK_MOD = 0x2000000;
const MASK_RSC_DFN = 0x380000;
const MODIFIED = 3;
const RSC_DFN_MODIFIED = MASK_MOD | MASK_RSC_DFN | MODIFIED;

const definitionModified = (reply: unknown): boolean =>
  Array.isArray(reply) && reply.some((entry) => entry?.ret_code === RSC_DFN_MODIFIED);

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
  const navigate = useNavigate();
  const [form] = Form.useForm<FormType>();

  const deploy = Form.useWatch('deploy', form);

  const { t } = useTranslation(['common', 'resource_definition']);

  const backToList = () => {
    navigate(-1);
  };

  const { isPending: resourceGroupsIsLoading, data: resourceGroups } = useResourceGroups({});
  const { isPending: storagePoolsIsLoading, data: storagePools } = useStoragePools();

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

  const invalidateResourcesView = useInvalidateResourcesView();

  // Both settle into a refresh of the shared list: a refused placement may have
  // placed some replicas (and the roll-back then removes them), and a request
  // that failed without a reply may still have reached the controller.
  const deleteResourceDefinitionMutation = useMutation({
    mutationFn: (name: string) => deleteResourceDefinition(name),
    onSettled: () => {
      invalidateResourcesView();
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
    onSettled: () => {
      invalidateResourcesView();
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

        // The controller saves the new group first, then places the replicas
        // it asks for beyond the current ones. A failed placement fails the
        // reply (its error is toasted) but the group has moved all the same,
        // so the page closes once the definition reports itself modified.
        const reply = res.data ?? res.error;
        if (fullySuccess(reply) || definitionModified(reply)) {
          backToList();
        }
      } catch (error) {
        logger.debug(error);
      }

      return;
    }

    const volumeDefinitionData = {
      volume_definition: {
        size_kib: values.size,
        props: {},
      },
    };

    const deployData = {
      diskless_on_remaining: values.diskless,
      select_filter: { place_count: Number(values.place_count) },
    };

    // A request that fails without a reply rejects; the mutation cache has
    // reported it (createQueryClient), so the submit only stops here.
    let created = false;
    try {
      const rdRes = await createResourceDefinitionMutation.mutateAsync(resourceDefinitionData);
      if (!fullySuccess(rdRes.data)) return;
      created = true;

      // A zero size spawns without a volume, as LINSTOR allows.
      if (values.size) {
        const vdRes = await createVolumeDefinitionMutation.mutateAsync({
          ...volumeDefinitionData,
          resource: values.name,
        });
        if (!fullySuccess(vdRes.data)) {
          await rollBack(values.name);
          return;
        }
      }

      if (values.deploy) {
        const placeRes = await autoPlaceMutation.mutateAsync({ ...deployData, resource: values.name });
        if (!fullySuccess(placeRes.data)) {
          logger.debug('Auto-place failed:', placeRes.data);
          await rollBack(values.name);
          return;
        }
      }

      backToList();
    } catch (error) {
      logger.debug(error);
      if (created) await rollBack(values.name);
    }
  };

  /**
   * Removes a definition this submit created when a later step failed, so a
   * retry starts clean instead of with a definition that has no resources.
   * The form stays open with what was entered; the failed step's error has
   * already been toasted by the request layer.
   */
  const rollBack = async (name: string) => {
    try {
      const res = await deleteResourceDefinitionMutation.mutateAsync(name);
      if (fullySuccess(res.data)) {
        void message.warning(t('resource_definition:create_rolled_back', { name }));
      }
    } catch (error) {
      logger.debug('Rolling back the definition failed:', error);
    }
  };

  const isLoading =
    updateMutation.isPending ||
    createResourceDefinitionMutation.isPending ||
    createVolumeDefinitionMutation.isPending ||
    autoPlaceMutation.isPending ||
    deleteResourceDefinitionMutation.isPending;

  const placeCountLimit = (group: string | undefined) =>
    usableNodes(
      storagePools,
      resourceGroups?.find((g) => g.name === group),
    ).length;

  const isDisabled = resourceGroupsIsLoading || storagePoolsIsLoading || !resourceGroups || !storagePools;

  return (
    <Form<FormType>
      className="max-w-[700px]"
      size="large"
      layout="vertical"
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
        label={t('resource_definition:name')}
        name="name"
        required
        rules={[
          {
            required: true,
            message: t('common:resource_definition_name_required'),
          },
          {
            pattern: /^[A-Za-z0-9.+_-]{1,127}$/,
            message: t('common:resource_definition_name_invalid'),
          },
        ]}
        tooltip={t('resource_definition:name_tooltip')}
      >
        <Input placeholder={t('resource_definition:please_input_resource_definition_name')} disabled={isEdit} />
      </Form.Item>

      <Form.Item
        label={t('resource_definition:resource_group_name')}
        name="resource_group_name"
        required
        rules={[{ required: true, message: t('common:resource_group_required') }]}
      >
        <Select
          allowClear
          placeholder={t('iscsi:please_select_resource_group')}
          options={resourceGroups?.map((e) => ({
            label: e.name,
            value: e.name,
          }))}
        />
      </Form.Item>

      {/* Editing changes the group only; the name and the protocol are shown. */}
      <Form.Item label={t('common:replication_mode')} name="replication_mode">
        <Radio.Group disabled={isEdit}>
          <Radio value="A">{t('common:async')}</Radio>
          <Radio value="C">{t('common:sync')}</Radio>
        </Radio.Group>
      </Form.Item>

      {!isEdit && (
        <InlineFormItem label={t('common:spawn_on_create')} name="deploy" valuePropName="checked">
          <Switch />
        </InlineFormItem>
      )}

      {deploy && (
        <>
          {!isEdit && (
            <Form.Item
              name="size"
              label={t('common:size')}
              required
              rules={[
                {
                  required: true,
                  message: t('resource_group:size_required_spawn'),
                },
              ]}
            >
              <SizeInput />
            </Form.Item>
          )}

          <Form.Item
            name="place_count"
            label={t('common:place_count')}
            required
            // Another group may place on fewer nodes.
            dependencies={['resource_group_name']}
            rules={[
              {
                validator: (_, value) => {
                  const count = Number(value);
                  // Read when it runs: the item keeps the rule from an earlier render.
                  const maxPlaceCount = placeCountLimit(form.getFieldValue('resource_group_name'));
                  if (!Number.isInteger(count) || count < 1) {
                    return Promise.reject(new Error(t('resource_definition:place_count_min')));
                  }
                  if (count > maxPlaceCount) {
                    return Promise.reject(
                      new Error(t('resource_definition:place_count_max', { count: maxPlaceCount })),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder={t('resource:please_input_place_count')} type="number" min={0} />
          </Form.Item>

          <Form.Item name="diskless" valuePropName="checked">
            <Checkbox>{t('common:diskless_on_remaining')}</Checkbox>
          </Form.Item>
        </>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading} disabled={isDisabled}>
          {t('common:submit')}
        </Button>

        <Button type="secondary" onClick={backToList} className="ml-[1em]">
          {t('common:cancel')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateForm };
