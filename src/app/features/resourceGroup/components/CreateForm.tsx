// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Checkbox, Col, Divider, Form, Input, Popover, Radio, Row, Select, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import { uniqBy } from 'lodash';
import { toast } from 'react-toastify';

import { useStoragePools } from '@app/features/storagePool';
import { fullySuccess } from '@app/features/requests';
import { createResourceGroup, addVolumeToResourceGroup, updateResourceGroup } from '../api';
import { ResourceGroupCreateRequestBody, AddVolumeRequestBody, ResourceGroupModifyRequestBody } from '../types';
import { DownOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { SizeInput } from '@app/components/SizeInput';
import { LabelContainer, TooltipContainer, TooltipLabelContainer } from './styled';
import { useTranslation } from 'react-i18next';

type FormType = {
  name: string;
  description: string;
  storage_pool: string;
  size: number;
  deploy: boolean;
  place_count: number;
  diskless: boolean;
  not_place_with_rsc: string[];
  not_place_with_rsc_regex: string;
  replicas_on_same: string[];
  replicas_on_different: string[];
  diskless_on_remaining: boolean;
  storage_pool_list: string[];
  layer_stack: string[];
  provider_list: string[];
  data_copy_mode: 'A' | 'C';
};

/**
 * options of layers
 */
const layerList = ['cache', 'storage', 'drbd', 'nvme', 'luks', 'writechache', 'openflex', 'exos'];
/**
 * options of providers
 */
const providerList = [
  'LVM',
  'LVM_THIN',
  'ZFS',
  'ZFS_THIN',
  'DISKLESS',
  'FILE',
  'FILE_THIN',
  'SPDK',
  'OPENFLEX_TARGET',
  'EXOS',
];

type CreateFormProps = {
  isEdit?: boolean;
  initialValues?: Partial<FormType>;
};

const CreateForm = ({ isEdit, initialValues }: CreateFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['resource_group', 'common']);

  const deploy = Form.useWatch('deploy', form);
  const layer_stack = Form.useWatch('layer_stack', form);

  const backToList = () => {
    if (isEdit) {
      navigate(-1);
    } else {
      navigate('/storage-configuration/resource-groups');
    }
  };

  const { isLoading: storagePoolsIsLoading, data: storagePools } = useStoragePools();

  const createResourceGroupMutation = useMutation({
    mutationFn: (data: ResourceGroupCreateRequestBody) => createResourceGroup(data),
  });

  const addVolumeToResourceGroupMutation = useMutation({
    mutationFn: (
      data: AddVolumeRequestBody & {
        resource_group: string;
      },
    ) => {
      const { resource_group, ...rest } = data;
      return addVolumeToResourceGroup(resource_group, rest);
    },
  });

  const updateResourceGroupMutation = useMutation({
    mutationFn: (
      data: ResourceGroupModifyRequestBody & {
        resource_group: string;
      },
    ) => {
      const { resource_group, ...rest } = data;
      return updateResourceGroup(resource_group, rest);
    },
  });

  const onFinish = async (values: FormType) => {
    const rg = {
      name: values.name,
      description: values.description,
      select_filter: {
        not_place_with_rsc: values.not_place_with_rsc,
        not_place_with_rsc_regex: values.not_place_with_rsc_regex,
        replicas_on_same: values.replicas_on_same,
        replicas_on_different: values.replicas_on_different,
        diskless_on_remaining: values.diskless_on_remaining,
        storage_pool_list: values.storage_pool_list,
        layer_stack: values.layer_stack,
        provider_list: values.provider_list,
        place_count: Number(values.place_count),
      },
    };

    if (isEdit) {
      const editInfo = {
        resource_group: rg.name,
        description: rg.description,
        override_props: {
          'DrbdOptions/Net/protocol': values.data_copy_mode,
        },
        select_filter: rg.select_filter,
      };

      try {
        const editRes = await updateResourceGroupMutation.mutateAsync({
          ...editInfo,
        });

        if (editRes.data) {
          backToList();
        }
      } catch (error) {
        console.log(error);
      }

      return;
    }

    const rgRes = await createResourceGroupMutation.mutateAsync(rg);
    if (fullySuccess(rgRes.data)) {
      const modifyResourceGroupRes = await updateResourceGroupMutation.mutateAsync({
        resource_group: values.name,
        override_props: {
          'DrbdOptions/Net/protocol': values.data_copy_mode,
          'DrbdOptions/PeerDevice/c-max-rate': '4194304',
        },
      });

      const addVolumeRes = await addVolumeToResourceGroupMutation.mutateAsync({
        resource_group: values.name,
      });

      if (fullySuccess(addVolumeRes.data) && fullySuccess(modifyResourceGroupRes.data)) {
        backToList();
      }
    }
  };

  const isSubmitting =
    updateResourceGroupMutation.isLoading ||
    addVolumeToResourceGroupMutation.isLoading ||
    createResourceGroupMutation.isLoading;

  const drbdLayer = layer_stack?.includes('drbd');

  return (
    <Form<FormType>
      size="large"
      layout="horizontal"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      form={form}
      initialValues={{
        data_copy_mode: 'C',
        deploy: false,
        place_count: 2,
        ...initialValues,
      }}
      onFinish={onFinish}
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form.Item
            label={t('resource_group:name')}
            name="name"
            required
            rules={[
              {
                required: true,
                message: 'Resource group name is required!',
              },
            ]}
          >
            <Input placeholder="Please input resource group name" disabled={isEdit} />
          </Form.Item>

          <Form.Item name="description" label={t('resource_group:description')}>
            <Input.TextArea
              placeholder="Please input description"
              autoSize={{
                minRows: 1,
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <LabelContainer>
                <TooltipLabelContainer>
                  <span>{drbdLayer ? t('resource_group:drbd_protocol') : t('resource_group:replication')}</span>
                </TooltipLabelContainer>
                <Popover
                  content={
                    <TooltipContainer>
                      <p>
                        Asynchronous replication: Local write operations on the primary node are considered completed as
                        soon as the local disk write has finished, and the replication packet has been placed in the
                        local TCP send buffer.
                      </p>
                      <p>
                        Synchronous replication: Local write operations on the primary node are considered completed
                        only after both the local and the peer disk write(s) have been confirmed.
                      </p>
                    </TooltipContainer>
                  }
                  title={drbdLayer ? t('resource_group:drbd_protocol') : t('resource_group:replication')}
                >
                  <QuestionCircleOutlined />
                </Popover>
              </LabelContainer>
            }
            name="data_copy_mode"
          >
            <Radio.Group disabled={drbdLayer}>
              <Radio value="A">Asynchronous(A)</Radio>
              <Radio value="C">Synchronous(C)</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="place_count" label={t('resource_group:place_count')} required>
            <Input placeholder="Please input place count" type="number" min={0} />
          </Form.Item>

          {!isEdit && (
            <Form.Item
              label={
                <LabelContainer>
                  <TooltipLabelContainer>
                    <span>{t('resource_group:spawn_on_create')}</span>
                  </TooltipLabelContainer>
                  <Popover
                    content={
                      <TooltipContainer>
                        <p>
                          If option enabled, will create a resource (or resources) when you create this resource group.
                          Created resource(s) will have the name of the resource definition that you specify. If option
                          disabled, will create the resource group only.
                        </p>
                      </TooltipContainer>
                    }
                    title={t('resource_group:spawn_on_create')}
                  >
                    <QuestionCircleOutlined />
                  </Popover>
                </LabelContainer>
              }
              name="deploy"
              valuePropName="checked"
            >
              <Switch defaultChecked />
            </Form.Item>
          )}

          <Form.Item name={t('resource_group:diskless')} valuePropName="checked" wrapperCol={{ offset: 7, span: 17 }}>
            <Checkbox>
              <LabelContainer>
                <Popover
                  content={
                    <TooltipContainer>
                      <p>
                        If option is selected, place diskless instances of resources created from this resource group on
                        any remaining nodes after fulfilling the diskful resource placement count in the LINSTOR
                        cluster.
                      </p>
                    </TooltipContainer>
                  }
                  title={drbdLayer ? t('resource_group:drbd_protocol') : t('resource_group:replication')}
                >
                  {t('resource_group:diskless')} <QuestionCircleOutlined />
                </Popover>
              </LabelContainer>
            </Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={
              <LabelContainer>
                <TooltipLabelContainer>
                  <span>{t('resource_group:storage_providers')}</span>
                </TooltipLabelContainer>
                <Popover
                  content={
                    <TooltipContainer>
                      <p>
                        Select storage providers. Only storage pools backed by the selected storage providers will be
                        considered for automatic resource placement when creating resources from this resource group.
                      </p>
                    </TooltipContainer>
                  }
                  title={t('resource_group:storage_providers')}
                >
                  <QuestionCircleOutlined />
                </Popover>
              </LabelContainer>
            }
            name="provider_list"
          >
            <Select
              allowClear
              mode="multiple"
              placeholder="Please select providers"
              options={providerList?.map((e) => ({
                label: e,
                value: e,
              }))}
            />
          </Form.Item>

          <Form.Item
            label={
              <LabelContainer>
                <TooltipLabelContainer>
                  <span>{t('resource_group:linstor_layers')}</span>
                </TooltipLabelContainer>
                <Popover
                  content={
                    <TooltipContainer>
                      <p>
                        Select LINSTOR layers. Only storage pools having the selected LINSTOR layers will be considered
                        for automatic resource placement when creating resources from this resource group.
                      </p>
                    </TooltipContainer>
                  }
                  title={t('resource_group:linstor_layers')}
                >
                  <QuestionCircleOutlined />
                </Popover>
              </LabelContainer>
            }
            name="layer_stack"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Please select layers"
              options={layerList.map((e) => ({
                label: e,
                value: e,
              }))}
              onChange={(val) => {
                if (!layer_stack?.includes('drbd') && val.includes('drbd')) {
                  form.setFieldValue('data_copy_mode', 'C');
                  toast('Please make sure you have drbd-kmod installed on the nodes you wish to use DRBD on', {
                    type: 'info',
                  });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <LabelContainer>
                <TooltipLabelContainer>
                  <span>{t('resource_group:storage_pool')}</span>
                </TooltipLabelContainer>
                <Popover
                  content={
                    <TooltipContainer>
                      <p>
                        Select storage pool. Resources created from this resource group will be automatically placed
                        into selected storage pool.
                      </p>
                    </TooltipContainer>
                  }
                  title={t('resource_group:storage_pool')}
                >
                  <QuestionCircleOutlined />
                </Popover>
              </LabelContainer>
            }
            name="storage_pool_list"
          >
            <Select
              allowClear
              placeholder="Please select storage pool"
              mode="multiple"
              options={uniqBy(storagePools, 'storage_pool_name')?.map((e) => ({
                label: e.storage_pool_name,
                value: e.storage_pool_name,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <div
        style={{
          marginLeft: 40,
          marginBottom: 20,
        }}
      >
        <a
          style={{ fontSize: 16 }}
          onClick={() => {
            setExpand(!expand);
          }}
        >
          <DownOutlined rotate={expand ? 180 : 0} />
          {!expand ? t('resource_group:show_advanced') : t('resource_group:hide_advanced')}
        </a>
      </div>

      {expand && (
        <Row gutter={[16, 16]}>
          <Col span={10}>
            <Form.Item label={t('resource_group:replicas_on_same')} name="replicas_on_same">
              <Select mode="tags" allowClear placeholder="" />
            </Form.Item>

            <Form.Item label={t('resource_group:replicas_on_different')} name="replicas_on_different">
              <Select mode="tags" allowClear placeholder="" />
            </Form.Item>
          </Col>

          <Col span={10}>
            <Form.Item label={t('resource_group:do_not_place_with')} name="not_place_with_rsc">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item
              label={t('resource_group:do_not_place_with_regex')}
              name="not_place_with_rsc_regex"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
            >
              <Input placeholder="" />
            </Form.Item>
          </Col>
        </Row>
      )}

      {deploy && (
        <>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={10}>
              <Form.Item
                label="Resource Definition Name"
                name="resource_definition_name"
                required
                rules={[
                  {
                    required: true,
                    message: 'Resource definition name is required!',
                  },
                ]}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
              >
                <Input placeholder="Please input resource definition group name" />
              </Form.Item>
            </Col>

            <Col span={10}>
              <Form.Item name="size" label="Volume Size" required>
                <SizeInput />
              </Form.Item>
            </Col>

            <Col span={10}>
              <Form.Item name="definition_only" valuePropName="checked" wrapperCol={{ offset: 7, span: 17 }}>
                <Checkbox>Definition Only</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      <div style={{ marginLeft: 80 }}>
        <Button type="primary" htmlType="submit" disabled={storagePoolsIsLoading || isSubmitting}>
          {t('common:submit')}
        </Button>

        <Button type="text" onClick={backToList}>
          {isEdit ? 'Back' : 'Cancel'}
        </Button>
      </div>
    </Form>
  );
};

export { CreateForm };
