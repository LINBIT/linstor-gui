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

export const UserManagement = () => {
  const dispatch = useDispatch<Dispatch>();
  const { users, KVS } = useSelector((state: RootState) => ({
    users: state.auth.users,
    KVS: state.setting.KVS,
  }));

  const authenticationEnabled = KVS?.authenticationEnabled;
  const isAdmin = useIsAdmin();

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
      notify('Failed to update the authentication status', { type: 'error' });
    },
    onSuccess: (data, newProps) => {
      notify('Authentication is now ' + (newProps ? 'enabled' : 'disabled') + ' successfully', {
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
    <PageBasic title="">
      <StyledSection>
        <BG>
          <img src={bg} title="bg" height={800} />
        </BG>
        <MainContent>
          {isAdminOrNotEnabled && (
            <>
              <div>
                <p>You can enable or disable user authentication from here.</p>
                <span>User authentication: &nbsp;</span>
                <Switch
                  checkedChildren="On"
                  unCheckedChildren="Off"
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
                        title="Delete the user"
                        description="Are you sure to delete this user?"
                        okText="Yes"
                        cancelText="No"
                        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                        onConfirm={() => {
                          dispatch.auth.deleteUser(user.title);
                        }}
                      >
                        <Button danger disabled={!isAdmin}>
                          Delete User
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
                      description={`User ${index + 1}`}
                    />
                  </List.Item>
                )}
              />
            </>
          ) : (
            <p style={{ marginTop: 10 }}>There are no users created yet.</p>
          )}
        </MainContent>
      </StyledSection>
      <StyledSection></StyledSection>
    </PageBasic>
  );
};
