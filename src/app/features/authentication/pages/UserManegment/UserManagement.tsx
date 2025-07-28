// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import PageBasic from '@app/components/PageBasic';
import { Dispatch, RootState } from '@app/store';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, List, Popconfirm, Switch, Divider } from 'antd';
import bg from '@app/assets/user_bg.svg';
import { BG, MainContent, StyledSection } from './styled';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { ChangePassword, CreateUser } from '../../components';
import { settingAPI } from '@app/features/settings';
import { notify } from '@app/utils/toast';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@app/features/authentication';
import { useIsAdmin } from '@app/hooks';
import { useTranslation } from 'react-i18next';

export const UserManagement = () => {
  const dispatch = useDispatch<Dispatch>();
  const { users, KVS } = useSelector((state: RootState) => ({
    users: state.auth.users,
    KVS: state.setting.KVS,
  }));

  const authenticationEnabled = KVS?.authenticationEnabled;
  const isAdmin = useIsAdmin();
  const { t } = useTranslation(['common', 'users']);

  const isAdminOrNotEnabled = !authenticationEnabled || (authenticationEnabled && isAdmin);

  const toggleMutation = useMutation({
    mutationFn: (enable: boolean) => {
      window.localStorage.removeItem('linstorname');
      return settingAPI
        .setProps({
          authenticationEnabled: enable,
          hideDefaultCredential: false,
        })
        .then(() => {
          return authAPI.initUserStore();
        });
    },
    onError: (error) => {
      console.log(error);
      notify(t('users:authentication_update_failed'), { type: 'error' });
    },
    onSuccess: (data, newProps) => {
      const message = newProps ? t('users:authentication_enabled') : t('users:authentication_disabled');
      notify(message, {
        type: 'success',
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
  });

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (authenticationEnabled) {
      dispatch.auth.getUsers();
    }
  }, [dispatch.auth, authenticationEnabled]);

  const handleToggleEnableAuthentication = (checked: boolean) => {
    setChecked(checked);
    toggleMutation.mutate(checked);
  };

  useEffect(() => {
    setChecked(Boolean(authenticationEnabled));
  }, [authenticationEnabled]);

  return (
    <PageBasic title={t('users:title')}>
      <StyledSection>
        <BG src={bg} title="bg" />
        <MainContent>
          {isAdminOrNotEnabled && (
            <>
              <div>
                <p>{t('users:description')}</p>
                <span>{t('users:authentication')}: &nbsp;</span>
                <Switch
                  checkedChildren={t('users:switch_on')}
                  unCheckedChildren={t('users:switch_off')}
                  checked={checked}
                  onChange={handleToggleEnableAuthentication}
                  loading={toggleMutation.isLoading}
                  disabled={!isAdminOrNotEnabled}
                />
              </div>
              <Divider />
            </>
          )}

          <div>
            <CreateUser disabled={!isAdmin} />
          </div>
          {users && users.length > 0 ? (
            <>
              <List
                itemLayout="horizontal"
                dataSource={users.map((user) => ({ title: user }))}
                renderItem={(user, index) => (
                  <List.Item
                    actions={[
                      <ChangePassword key="change" admin user={user.title} disabled={!isAdmin} />,

                      <Popconfirm
                        key="delete"
                        title={t('users:delete_user_title')}
                        description={t('users:delete_user_description')}
                        okText={t('users:yes')}
                        cancelText={t('users:no')}
                        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                        onConfirm={() => {
                          dispatch.auth.deleteUser(user.title);
                        }}
                      >
                        <Button danger disabled={!isAdmin}>
                          {t('users:delete_user')}
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#f7a75c', verticalAlign: 'middle' }} size="large">
                          {user.title.slice(0, 1).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <a href="#" onClick={(e) => e.preventDefault()}>
                          {user.title}
                        </a>
                      }
                      description={`${t('users:user_description')} ${index + 1}`}
                    />
                  </List.Item>
                )}
              />
            </>
          ) : (
            <p style={{ marginTop: 10 }}>{t('users:no_user')}</p>
          )}
        </MainContent>
      </StyledSection>
    </PageBasic>
  );
};
