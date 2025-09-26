// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Input, message, Modal, Space } from 'antd';

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
  onCancel: (dontShowAgain?: boolean) => void;
  admin?: boolean;
  init?: boolean;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ open, onCreate, onCancel, admin, init }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation('users');

  const handleCancel = () => {
    onCancel(false);
    form.resetFields();
  };

  const handleDontShowAgain = () => {
    onCancel(true);
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      wrapClassName="change-password-modal"
      footer={null}
      width="70%"
      onCancel={handleCancel}
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
              <Space>
                <Button type="primary" htmlType="submit">
                  {admin ? t('reset_password') : t('change_password')}
                </Button>
                {init && !admin && (
                  <Button type="default" onClick={handleDontShowAgain}>
                    {t('dont_show_again') || "Don't show this again"}
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </MainSection>
      </Content>
    </Modal>
  );
};

type ChangePasswordProps = {
  admin?: boolean; // True when admin is resetting another user's password
  user?: string; // Username to reset (for admin mode)
  disabled?: boolean;
  defaultOpen?: boolean; // True when auto-opened for default password change
};

const ChangePassword = ({ admin, user, disabled, defaultOpen }: ChangePasswordProps) => {
  const [open, setOpen] = useState(!!defaultOpen);
  const dispatch = useDispatch<Dispatch>();
  const { t } = useTranslation('users');

  const onCreate = async (values) => {
    let res = null;
    if (admin) {
      res = await dispatch.auth.resetPassword({ user: user || 'admin', newPassword: values.newPassword });
    } else {
      res = await dispatch.auth.changePassword({
        user: localStorage.getItem(USER_LOCAL_STORAGE_KEY),
        newPassword: values.newPassword,
        oldPassword: values.currentPassword,
      });
    }

    setOpen(false);

    if (res) {
      message.success(t('password_changed'));

      // Clear needsPasswordChange flag in settings after successful password change
      // Note: If password was changed, we always set needsPasswordChange to false regardless of checkbox
      if (!admin && localStorage.getItem(USER_LOCAL_STORAGE_KEY) === 'admin') {
        await dispatch.setting.saveKey({
          needsPasswordChange: false,
        });
      }
      dispatch.auth.setNeedsPasswordChange(false);

      if (!admin) {
        setTimeout(() => {
          dispatch.auth.logout();
          window.location.reload();
        }, 1000);
      }
    } else {
      message.error(t('password_change_failed'));
    }
  };

  const handleCancel = (dontShowAgain?: boolean) => {
    setOpen(false);

    // If this was a default password change prompt (defaultOpen=true) and user cancelled
    if (defaultOpen && !admin) {
      const currentUser = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
      if (currentUser === 'admin') {
        if (dontShowAgain) {
          // User checked "Don't show again" - permanently disable the prompt
          dispatch.setting.saveKey({
            needsPasswordChange: false,
            hideDefaultCredential: true,
          });
        } else {
          // User just closed the modal - hide for this session only
          dispatch.setting.saveKey({
            hideDefaultCredential: true,
          });
        }
        // Clear the in-memory flag so modal doesn't keep showing in this session
        dispatch.auth.setNeedsPasswordChange(false);
      }
    }
  };

  return (
    <div>
      {!defaultOpen && (
        <div
          onClick={() => {
            setOpen(true);
          }}
          className="flex items-center"
        >
          {admin ? (
            <Button disabled={disabled}> {t('reset_password')} </Button>
          ) : (
            <>
              <ImgIcon src={changePassword} alt="changepassword" />
              <span>{t('change_password')}</span>
            </>
          )}
        </div>
      )}
      <ChangePasswordForm init={defaultOpen} admin={admin} open={open} onCreate={onCreate} onCancel={handleCancel} />
    </div>
  );
};

export { ChangePassword };
