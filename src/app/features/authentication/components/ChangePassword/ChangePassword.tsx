// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Input, message, Modal } from 'antd';

import changePassword from '@app/assets/changepassword.svg';
import changePasswordBG from '@app/assets/changepassword-bg.svg';
import { BGImg, Content, ImgIcon, MainSection } from './styled';
import { Dispatch } from '@app/store';
import { useDispatch } from 'react-redux';
import { USER_LOCAL_STORAGE_KEY } from '@app/const/settings';
import { useTranslation } from 'react-i18next';

interface Values {
  title: string;
  description: string;
  modifier: string;
}

interface ChangePasswordFormProps {
  open: boolean;
  onCreate: (values: Values) => void;
  onCancel: () => void;
  admin?: boolean;
  init?: boolean;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ open, onCreate, onCancel, admin, init }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation('users');
  return (
    <Modal
      open={open}
      wrapClassName="change-password-modal"
      footer={null}
      width="70%"
      onCancel={onCancel}
      style={{ maxWidth: '90vw', padding: '16px' }}
    >
      <Content>
        <BGImg src={changePasswordBG} alt="changePassword" />
        <MainSection>
          <Form
            form={form}
            layout="vertical"
            name="form_in_modal"
            initialValues={{ modifier: 'public' }}
            onFinish={onCreate}
            style={{ minWidth: 300 }}
          >
            <h3>{admin ? t('reset_password') : t('change_password')}</h3>
            {!admin && !init && (
              <Form.Item
                name="currentPassword"
                label={t('current_password')}
                rules={[{ required: true, message: 'Please input current password!' }]}
              >
                <Input.Password />
              </Form.Item>
            )}
            <Form.Item
              name="newPassword"
              label={t('new_password')}
              rules={[{ required: true, message: 'Please input new password!' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={t('confirm_password')}
              rules={[{ required: true, message: 'Please input new password again!' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {admin ? t('reset_password') : t('change_password')}
              </Button>
            </Form.Item>
          </Form>
        </MainSection>
      </Content>
    </Modal>
  );
};

type ChangePasswordProps = {
  admin?: boolean;
  user?: string;
  disabled?: boolean;
  defaultOpen?: boolean;
};

const ChangePassword = ({ admin, user, disabled, defaultOpen }: ChangePasswordProps) => {
  const [open, setOpen] = useState(!!defaultOpen);
  const dispatch = useDispatch<Dispatch>();
  const { t } = useTranslation('users');

  const onCreate = (values: any) => {
    if (admin) {
      dispatch.auth.resetPassword({ user: user || 'admin', newPassword: values.newPassword });
    } else {
      dispatch.auth.changePassword({
        user: localStorage.getItem(USER_LOCAL_STORAGE_KEY),
        newPassword: values.newPassword,
        oldPassword: values.currentPassword,
      });
    }

    setOpen(false);

    message.success(t('password_changed'));

    setTimeout(() => {
      if (admin) {
        dispatch.auth.logout();
        window.location.reload();
      }
    }, 1000);
  };

  return (
    <div>
      {!defaultOpen && (
        <div
          onClick={(e) => {
            setOpen(true);
          }}
          className="flex items-center"
        >
          {admin ? (
            <Button disabled={disabled}> {t('reset_password')} </Button>
          ) : (
            <>
              <ImgIcon src={changePassword} alt="changepassword" />
              <span>{t('reset_password')}</span>
            </>
          )}
        </div>
      )}
      <ChangePasswordForm
        init={defaultOpen}
        admin={admin}
        open={open}
        onCreate={onCreate}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </div>
  );
};

export { ChangePassword };
