import { SizeInput } from '@app/components/SizeInput';
import { Button, Checkbox, Form, Modal, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { clusterPrivateVolumeSizeKib } from '../const';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getResourceGroups, resizeTarget } from '../api';
import { notify } from '@app/utils/toast';

type FormType = {
  size: number;
  use_all: boolean;
};

type GrowVolumeProps = {
  resource: string;
  resource_group: string;
  current_kib: number;
};

export const GrowVolume = ({ resource, resource_group, current_kib }: GrowVolumeProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<FormType>();
  const use_all = Form.useWatch('use_all', form);

  const { data: resourceGroups } = useQuery({
    queryKey: ['getResourceGroupDataFromVSAN'],
    queryFn: () => getResourceGroups(),
  });

  const resizeMutation = useMutation({
    mutationFn: (data: { size: number }) => resizeTarget(resource, data),
    onError: (err: { message: string; detail: string }) => {
      notify(err.message, {
        type: 'error',
      });
    },
    onSuccess: () => {
      setModalOpen(false);
    },
  });

  useEffect(() => {
    let maxVolumeSize = 0;
    const selectedRG = resourceGroups?.data?.find((e) => e.name === resource_group);
    if (selectedRG) {
      maxVolumeSize = selectedRG?.max_volume_size - clusterPrivateVolumeSizeKib;
    }

    if (use_all) {
      form.setFieldValue('size', maxVolumeSize);
    }
  }, [form, resourceGroups, resource_group, use_all]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      resizeMutation.mutate({
        size: values.size,
      });
    } catch (error) {
      console.log(error);
    }
  };
  const handleCancel = () => {
    setModalOpen(false);
    form.resetFields();
  };
  return (
    <>
      <Button type="primary" onClick={() => setModalOpen(true)}>
        Grow
      </Button>

      <Modal
        title="Grow volume"
        open={modalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Grow"
        width={600}
        okButtonProps={{
          loading: resizeMutation.isLoading,
        }}
      >
        <Form<FormType>
          size="large"
          form={form}
          initialValues={{
            size: current_kib,
          }}
        >
          <Form.Item label="Size">
            <Space>
              <Form.Item name="size" required>
                {use_all ? <SizeInput disabled={use_all} /> : <SizeInput defaultUnit="KiB" />}
              </Form.Item>
              <Form.Item name="use_all" valuePropName="checked">
                <Checkbox>Use all available</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
