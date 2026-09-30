// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { logger } from '@app/utils/logger';
import { Form, message, Modal, Space } from 'antd';
import { Input } from '@app/components/Input';
import { Button } from '@app/components/Button';

import changePassword from '@app/assets/changepassword.svg';
import changePasswordBG from '@app/assets/changepassword-bg.svg';
import { BGImg, Content, ImgIcon, MainSection } from './styled';
import { useAuth } from '@app/features/authentication/useAuth';
import { useSettings } from '@app/features/settings/useSettings';
import { USER_LOCAL_STORAGE_KEY, DEFAULT_ADMIN_USER_NAME } from '@app/const/settings';
import { useTranslation } from 'react-i18next';

/** What the form below actually submits; the previous shape was an antd demo leftover. */
interface Values {
  currentPassword?: string;
  newPassword: string;
  confirmPassword?: string;
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
      width={960}
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
              rules={[
                { required: true, message: 'Please input new password!' },
                { min: 5, message: 'Password must be at least 5 characters long!' },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={t('confirm_password')}
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please input new password again!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords that you entered do not match!'));
                  },
                }),
              ]}
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
  const auth = useAuth();
  const { login, resetPassword, updatePassword, setNeedsPasswordChange } = auth;
  const { saveKey } = useSettings();
  const { t } = useTranslation('users');

  const onCreate = async (values: Values) => {
    logger.debug('ChangePassword submitted, admin mode:', admin);

    let res: boolean;
    if (admin) {
      res = await resetPassword({
        user: user || DEFAULT_ADMIN_USER_NAME,
        newPassword: values.newPassword,
      });
    } else {
      // Check if this is a forced password change (first login scenario)
      if (defaultOpen) {
        // For forced password change after first login, skip old password verification
        res = await updatePassword({
          user: localStorage.getItem(USER_LOCAL_STORAGE_KEY) ?? '',
          newPassword: values.newPassword,
        });
      } else {
        // For regular password changes, verify old password
        res = await auth.changePassword({
          user: localStorage.getItem(USER_LOCAL_STORAGE_KEY) ?? '',
          newPassword: values.newPassword,
          oldPassword: values.currentPassword ?? '',
        });
      }
    }

    setOpen(false);

    if (res) {
      message.success(t('password_changed'));

      // Once the admin user's password changed (their own change, or an admin
      // resetting "admin"), admin/admin no longer works: the first-login flag
      // goes, and so does the login page's "Default credential: admin/admin".
      const changedUser = admin ? user || DEFAULT_ADMIN_USER_NAME : localStorage.getItem(USER_LOCAL_STORAGE_KEY);
      if (changedUser === DEFAULT_ADMIN_USER_NAME) {
        await saveKey({
          needsPasswordChange: false,
          hideDefaultCredential: true,
        });
      }
      setNeedsPasswordChange(false);

      if (!admin) {
        const username = localStorage.getItem(USER_LOCAL_STORAGE_KEY) ?? '';
        setTimeout(async () => {
          await login({ username, password: values.newPassword });
          window.location.reload();
        }, 1000);
      }
    } else {
      // Provide more specific error message for password change failure
      if (!admin) {
        message.error(
          t('password_change_failed') + '. ' + t('check_current_password') ||
            'Please check your current password and try again.',
        );
      } else {
        message.error(t('password_change_failed'));
      }
    }
  };

  const handleCancel = (dontShowAgain?: boolean) => {
    setOpen(false);

    // If this was a default password change prompt (defaultOpen=true) and user cancelled
    if (defaultOpen && !admin) {
      const currentUser = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
      if (currentUser === DEFAULT_ADMIN_USER_NAME) {
        if (dontShowAgain) {
          // User checked "Don't show again" - permanently disable the prompt
          saveKey({
            needsPasswordChange: false,
            hideDefaultCredential: true,
          });
        } else {
          // User just closed the modal - hide for this session only
          saveKey({
            hideDefaultCredential: true,
          });
        }
        // Clear the in-memory flag so modal doesn't keep showing in this session
        setNeedsPasswordChange(false);
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
