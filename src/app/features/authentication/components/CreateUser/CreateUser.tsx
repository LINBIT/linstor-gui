// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Form, Modal } from 'antd';
import { Input } from '@app/components/Input';
import Button from '@app/components/Button';

import changePasswordBG from '@app/assets/changepassword-bg.svg';
import { useAuth } from '@app/features/authentication/useAuth';
import { useTranslation } from 'react-i18next';

/** What the form below submits; the previous shape was an antd demo leftover. */
interface Values {
  username: string;
  password: string;
  password_validate?: string;
}

interface CreateUserFormProps {
  open: boolean;
  onCreate: (values: Values) => void;
  onCancel: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ open, onCreate, onCancel }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation('users');
  return (
    <Modal
      open={open}
      wrapClassName="change-password-modal"
      footer={null}
      width="min(80vw, 1000px)"
      centered
      onCancel={onCancel}
      styles={{ body: { padding: 0 } }}
    >
      <div className="flex max-h-[80vh] min-h-[400px] flex-row overflow-hidden bg-transparent max-md:h-auto max-md:max-h-none max-md:min-h-auto max-md:flex-col max-md:items-center max-md:justify-center">
        <img
          className="h-full w-[45%] min-w-[400px] shrink-0 object-cover opacity-20 max-lg:w-[40%] max-lg:min-w-[350px] max-md:hidden"
          src={changePasswordBG}
          alt="changePassword"
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-y-auto px-8 py-12 max-lg:py-10 max-md:w-full max-md:max-w-[500px] max-md:p-8 max-[480px]:max-w-[400px] max-[480px]:p-6">
          <div className="[&_.ant-form-item-label>label]:overflow-visible [&_.ant-form-item-label>label]:font-medium [&_.ant-form-item-label>label]:whitespace-nowrap [&_.ant-form-item-label]:pb-2 [&_.ant-btn-primary]:mt-4 [&_.ant-btn-primary]:h-10 [&_.ant-btn-primary]:w-full max-[480px]:[&_.ant-input]:h-10 max-[480px]:[&_.ant-input-password]:h-10 max-[480px]:[&_.ant-form-item-label>label]:text-[14px]">
            <h3 className="mb-6 text-[1.5rem] font-semibold text-(--text-primary) max-[480px]:mb-4 max-[480px]:text-[1.25rem]">
              {t('add_a_user')}
            </h3>
            <Form
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              initialValues={{ login: true }}
              form={form}
              layout="vertical"
              name="form_in_modal"
              style={{ width: '100%', maxWidth: 450 }}
              onFinish={onCreate}
              autoComplete="off"
            >
              <Form.Item
                label={t('username')}
                name="username"
                rules={[{ required: true, message: 'Please input your username!' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label={t('password')}
                name="password"
                rules={[
                  { required: true, message: 'Please input your password!' },
                  { min: 5, message: 'Password must be at least 5 characters long!' },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                label={t('confirm_password')}
                name="password_validate"
                rules={[
                  { required: true, message: 'Please input your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The new password that you entered do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  {t('add')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </Modal>
  );
};

type CreateUserProp = {
  disabled?: boolean;
};

const CreateUser = ({ disabled }: CreateUserProp) => {
  const [open, setOpen] = useState(false);
  const { register } = useAuth();
  const { t } = useTranslation('users');

  const onCreate = (values: Values) => {
    register(values);

    setOpen(false);
  };

  return (
    <div>
      <div>
        <Button
          type="secondary"
          disabled={disabled}
          onClick={() => {
            setOpen(true);
          }}
        >
          {t('add_a_user')}
        </Button>
      </div>
      <CreateUserForm
        open={open}
        onCreate={onCreate}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </div>
  );
};

export { CreateUser };
