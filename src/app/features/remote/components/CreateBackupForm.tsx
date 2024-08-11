import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Switch, Form, Modal, Select, message } from 'antd';

import { createBackup } from '../api';
import { RemoteBackupCreateRequestBody } from '../types';
import { useParams } from 'react-router-dom';
import { getResources } from '@app/features/resource';
import uniqBy from 'lodash.uniqby';

type FormType = {
  rsc_name: string;
  remote_name: string;
  incremental?: boolean;
};

type CreateBackupFormProps = {
  refetch: () => void;
};

const CreateBackupForm = ({ refetch }: CreateBackupFormProps) => {
  const [form] = Form.useForm<FormType>();
  const [modelOpen, setModelOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const { remote_name } = useParams<{ remote_name: string }>();

  const resourceList = useQuery({
    queryKey: ['getResources'],
    queryFn: async () => {
      const res = await getResources();

      return res.data;
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: (data: RemoteBackupCreateRequestBody) => {
      return createBackup(remote_name, data);
    },
  });

  const onFinish = async (values: FormType) => {
    try {
      const res: any = await createBackupMutation.mutateAsync(values);

      if (res.error && Array.isArray(res.error)) {
        messageApi.error(res.error.map((e: any) => e.message).join(', '));
      }
    } catch (error) {
      console.error('create backup error', error);
      messageApi.error('Create backup error');
    }

    setModelOpen(false);
    refetch();
  };

  return (
    <>
      {contextHolder}
      <Button type="primary" onClick={() => setModelOpen(true)}>
        Add
      </Button>
      <Modal
        title="Create"
        open={modelOpen}
        onOk={() => onFinish(form.getFieldsValue())}
        onCancel={() => setModelOpen(false)}
        okText="Confirm"
        width={800}
        okButtonProps={{
          loading: createBackupMutation.isLoading,
        }}
        destroyOnClose
        maskClosable={false}
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 700 }}
          size="large"
          layout="horizontal"
          form={form}
          initialValues={{
            incremental: true,
          }}
          onFinish={onFinish}
        >
          <Form.Item name="rsc_name" label="Resource" required>
            <Select
              options={uniqBy(resourceList?.data, 'name').map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="incremental" label="Incremental">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CreateBackupForm };
