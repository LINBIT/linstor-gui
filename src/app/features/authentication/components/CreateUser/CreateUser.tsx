// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Form, Input, Modal } from 'antd';
import Button from '@app/components/Button';

import changePasswordBG from '@app/assets/changepassword-bg.svg';
import { BGImg, Content, MainSection, FormTitle, FormWrapper } from './styled';
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
    <Modal
      open={open}
      wrapClassName="change-password-modal"
      footer={null}
      width="min(80vw, 1000px)"
      centered
      onCancel={onCancel}
      bodyStyle={{ padding: 0 }}
    >
      <Content>
        <BGImg src={changePasswordBG} alt="changePassword" />

        <MainSection>
          <FormWrapper>
            <FormTitle>{t('add_a_user')}</FormTitle>
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
          </FormWrapper>
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
