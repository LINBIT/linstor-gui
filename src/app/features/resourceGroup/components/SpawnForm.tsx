// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Form, Modal } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
import { Checkbox } from '@app/components/Checkbox';
import { Button } from '@app/components/Button';

import { SizeInput } from '@app/components/SizeInput';
import { SpawnRequest } from '../types';
import { spawnResourceGroup, getResourceGroups, getResourceGroupVolumeGroups } from '../api';
import { useTranslation } from 'react-i18next';

type FormType = {
  volume_sizes: (number | undefined)[];
  definitions_only: boolean;
  partial?: boolean;
  name: string;
  resource_group?: string;
};

type SpawnFormProps = {
  resource_group?: string;
  isInDropdown?: boolean;
};

const SpawnForm = ({ resource_group, isInDropdown = false }: SpawnFormProps) => {
  const [showSpawnForm, setShowSpawnForm] = useState(false);
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['resource_group', 'common']);

  // When the caller doesn't fix a resource group (e.g. the quick-spawn button
  // on the resource overview), let the user pick one from a dropdown.
  const selectResourceGroup = !resource_group;
  const watchedResourceGroup = Form.useWatch('resource_group', form);
  const effectiveResourceGroup = resource_group ?? watchedResourceGroup;
  const partialChecked = Form.useWatch('partial', form) ?? false;

  // Keep the Spawn button disabled until every field passes its rules.
  // `validateOnly` re-checks on each change without painting errors on the
  // still-pristine fields (antd's recommended "submittable" pattern).
  const watchedValues = Form.useWatch([], form);
  const [submittable, setSubmittable] = useState(false);
  useEffect(() => {
    if (!showSpawnForm) {
      return;
    }
    form.validateFields({ validateOnly: true }).then(
      () => setSubmittable(true),
      () => setSubmittable(false),
    );
  }, [form, showSpawnForm, watchedValues]);

  const { data: resourceGroupList } = useQuery({
    queryKey: ['getResourceGroupsForSpawn'],
    queryFn: () => getResourceGroups({}),
    enabled: selectResourceGroup && showSpawnForm,
  });

  // A resource group can have several volume groups; the spawn takes one volume
  // size per volume group (in volume-number order).
  const { data: volumeGroupsResp } = useQuery({
    queryKey: ['getResourceGroupVolumeGroups', effectiveResourceGroup],
    queryFn: () => getResourceGroupVolumeGroups(effectiveResourceGroup as string),
    enabled: showSpawnForm && !!effectiveResourceGroup,
  });
  const volumeGroups = (volumeGroupsResp?.data ?? []) as { volume_number?: number }[];
  // Always render at least one size input (single-volume-group / unknown case).
  const volumeGroupCount = Math.max(volumeGroups.length, 1);

  const spawnMutation = useMutation({
    mutationFn: ({ rg, data }: { rg: string; data: SpawnRequest }) => spawnResourceGroup(rg, data),
  });

  const onFinish = async (values: FormType) => {
    const rg = resource_group ?? values.resource_group;
    if (!rg) {
      return;
    }

    // Volume sizes map positionally to volume groups. Take the filled prefix.
    // With "partial" the user may provide fewer sizes than there are volume
    // groups (the extra volume groups are not used) — same as linstor-client's
    // `--partial`. Without it, all sizes are required (validated in the form).
    const partial = values.partial ?? false;
    const sizes: number[] = [];
    for (let i = 0; i < volumeGroupCount; i++) {
      const size = values.volume_sizes?.[i];
      if (typeof size === 'number' && size > 0) {
        sizes.push(size);
      } else {
        break;
      }
    }

    const submitData: SpawnRequest = {
      resource_definition_name: values.name,
      resource_definition_external_name: undefined,
      volume_sizes: sizes,
      definitions_only: values.definitions_only,
      partial,
    };

    spawnMutation.mutate({ rg, data: submitData });
    setShowSpawnForm(false);
  };

  const isMultiVolume = volumeGroupCount > 1;

  return (
    <>
      {isInDropdown ? (
        <span onClick={() => setShowSpawnForm(true)}>{t('common:spawn')}</span>
      ) : (
        <Button type="primary" onClick={() => setShowSpawnForm(true)}>
          {t('common:spawn')}
        </Button>
      )}
      <Modal
        title="Spawn"
        open={showSpawnForm}
        onCancel={() => setShowSpawnForm(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button type="secondary" onClick={() => setShowSpawnForm(false)}>
              {t('common:cancel')}
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              disabled={!submittable}
              loading={spawnMutation.isLoading}
            >
              {t('common:spawn')}
            </Button>
          </div>
        }
        width={800}
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 700 }}
          size="large"
          layout="horizontal"
          form={form}
          onFinish={onFinish}
        >
          {selectResourceGroup && (
            <Form.Item
              name="resource_group"
              label={t('common:resource_group')}
              rules={[{ required: true, message: t('common:resource_group_required') }]}
            >
              <Select
                showSearch
                placeholder={t('common:select_resource_group')}
                optionFilterProp="label"
                options={(resourceGroupList?.data ?? []).map((rg) => ({
                  label: rg.name,
                  value: rg.name,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label={t('common:resource_name', 'Resource Name')}
            rules={[{ required: true, message: t('common:resource_name_placeholder', 'Please input resource name') }]}
          >
            <Input placeholder={t('common:resource_name_placeholder', 'Please input resource name')} />
          </Form.Item>

          {Array.from({ length: volumeGroupCount }).map((_, index) => {
            // Without partial, a size is required for every volume group. With
            // partial, only the first is required; the rest may be left blank.
            const required = !partialChecked || index === 0;
            return (
              <Form.Item
                key={index}
                name={['volume_sizes', index]}
                label={
                  volumeGroupCount > 1
                    ? `${t('common:volume', 'Volume')} ${index} ${t('common:size')}`
                    : t('common:size')
                }
                required={required}
                rules={required ? [{ required: true, message: t('common:size_required', 'Please input a size') }] : []}
              >
                <SizeInput />
              </Form.Item>
            );
          })}

          {isMultiVolume && (
            <Form.Item
              name="partial"
              valuePropName="checked"
              label={t('common:partial', 'Partial')}
              tooltip={t('common:spawn_partial_hint', {
                count: volumeGroupCount,
                defaultValue:
                  'This resource group has {{count}} volume groups. With partial enabled you may fill fewer sizes than volume groups (the remaining volume groups are not used); otherwise a size is required for each.',
              })}
            >
              <Checkbox />
            </Form.Item>
          )}

          <Form.Item
            name="definitions_only"
            valuePropName="checked"
            label={t('common:definition_only', 'Definition only')}
            tooltip={t(
              'common:definition_only_hint',
              'Create only the resource definition and volume definitions (metadata). The resource is not deployed to any node — no storage is allocated and no DRBD devices are created.',
            )}
          >
            <Checkbox />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { SpawnForm };
