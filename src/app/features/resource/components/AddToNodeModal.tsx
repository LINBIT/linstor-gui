import React from 'react';
import { Modal, Form, Select, Checkbox, message } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getNodes } from '@app/features/node/api';
import { createResourceOnNode } from '../api';
import { useStoragePools } from '@app/features/storagePool';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/Button';
import { uniqBy } from 'lodash';

interface AddToNodeModalProps {
  open: boolean;
  onClose: () => void;
  resourceName: string;
  onSuccess?: () => void;
  usedNodes: string[];
}

export const AddToNodeModal: React.FC<AddToNodeModalProps> = ({
  open,
  onClose,
  resourceName,
  onSuccess,
  usedNodes,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation(['common', 'resource', 'node']);

  const { data: nodesData } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => getNodes({}),
    enabled: open,
  });

  const selectedNode = Form.useWatch('node', form);
  const isDrbdDiskless = Form.useWatch('drbd_diskless', form);

  React.useEffect(() => {
    form.setFieldsValue({ storage_pool: undefined });
  }, [selectedNode]);

  const { data: storagePoolsData } = useStoragePools(selectedNode ? { nodes: [selectedNode] } : undefined);

  const nodeList = nodesData?.data?.filter((node: any) => !usedNodes.includes(node.name)) ?? [];

  // Filter out DISKLESS storage pools when not in drbd-diskless mode
  const storagePoolList = uniqBy(storagePoolsData || [], 'storage_pool_name')
    ?.filter((sp: any) => sp.provider_kind !== 'DISKLESS')
    ?.map((sp: any) => ({
      label: sp.storage_pool_name,
      value: sp.storage_pool_name,
    }));

  const mutation = useMutation({
    mutationFn: (values: { node: string; drbd_diskless: boolean; storage_pool?: string }) =>
      createResourceOnNode(resourceName, values.node, values.drbd_diskless, values.storage_pool),
    onSuccess: () => {
      message.success(t('common:success'));
      onClose();
      form.resetFields();
      onSuccess?.();
    },
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      mutation.mutate(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={`${t('resource:add_to_node')} - ${resourceName}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common:cancel')}
        </Button>,
        <Button key="submit" type="primary" loading={mutation.isPending} onClick={handleOk}>
          {t('common:submit')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ drbd_diskless: false }}>
        <Form.Item name="node" label={t('common:node')} rules={[{ required: true, message: 'Please select a node' }]}>
          <Select placeholder={t('node:node_list')} showSearch optionFilterProp="children">
            {nodeList.map((node: any) => (
              <Select.Option key={node.name} value={node.name}>
                {node.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="drbd_diskless" valuePropName="checked">
          <Checkbox>{t('resource:drbd_diskless')}</Checkbox>
        </Form.Item>

        {!isDrbdDiskless && (
          <Form.Item
            name="storage_pool"
            label={t('common:storage_pool')}
            rules={
              selectedNode && !isDrbdDiskless ? [{ required: false, message: t('resource:storage_pool_required') }] : []
            }
          >
            <Select
              placeholder={t('common:storage_pool')}
              allowClear
              showSearch
              optionFilterProp="children"
              disabled={!selectedNode}
            >
              {storagePoolList?.map((sp: any) => (
                <Select.Option key={sp.value} value={sp.value}>
                  {sp.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
