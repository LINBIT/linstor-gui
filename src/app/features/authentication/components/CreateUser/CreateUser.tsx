// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Input, Modal } from 'antd';

import changePasswordBG from '@app/assets/changepassword-bg.svg';
import { BGImg, Content, MainSection } from './styled';
import { Dispatch } from '@app/store';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

interface Values {
  title: string;
  description: string;
  modifier: string;
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
    <Modal open={open} wrapClassName="change-password-modal" footer={null} width="70%" onCancel={onCancel}>
      <Content>
        <BGImg src={changePasswordBG} alt="changePassword" />

        <MainSection>
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            initialValues={{ login: true }}
            form={form}
            layout="vertical"
            name="form_in_modal"
            style={{ minWidth: 400 }}
            onFinish={onCreate}
            autoComplete="off"
          >
            <h3> {t('add_a_user')} </h3>
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
              rules={[{ required: true, message: 'Please input your password!' }]}
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
        </MainSection>
      </Content>
    </Modal>
  );
};

type CreateUserProp = {
  disabled?: boolean;
};

const CreateUser = ({ disabled }: CreateUserProp) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch<Dispatch>();
  const { t } = useTranslation('users');

  const onCreate = (values: any) => {
    dispatch.auth.register(values);

    setOpen(false);
  };

  return (
    <div>
      <div>
        <Button
          type="primary"
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
