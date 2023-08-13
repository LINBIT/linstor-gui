import React, { useEffect } from 'react';
import PageBasic from '@app/components/PageBasic';
import { Dispatch, RootState } from '@app/store';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, Form, Input, List, Popconfirm } from 'antd';
import { UserFormType } from '../../types';
import { notify } from '@app/utils/toast';
import bg from '@app/assets/user_bg.svg';
import { MainContent, StyledSection } from './styled';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { ChangePassword, CreateUser } from '../../components';

export const UserManagement = () => {
  const dispatch = useDispatch<Dispatch>();
  const { users } = useSelector((state: RootState) => ({
    users: state.auth.users,
  }));

  console.log(users, 'users');

  useEffect(() => {
    dispatch.auth.getUsers();
  }, [dispatch.auth]);

  const onFinish = async (values: UserFormType) => {
    const res = await dispatch.auth.register({ username: values.username, password: values.password });
    if (res) {
      notify('User added', {
        type: 'success',
      });
    }
  };

  return (
    <PageBasic title="">
      <StyledSection>
        <img src={bg} />
        <MainContent>
          {users && users.length > 0 ? (
            <>
              <CreateUser />
              <List
                itemLayout="horizontal"
                dataSource={users.map((user) => ({ title: user }))}
                renderItem={(user, index) => (
                  <List.Item
                    actions={[
                      <ChangePassword key="change" admin user={user.title} />,

                      <Popconfirm
                        key="delete"
                        title="Delete the user"
                        description="Are you sure to delete this user?"
                        okText="Yes"
                        cancelText="No"
                        icon={<QuestionCircleOutlined style={{ color: 'red' }} rev={null} />}
                        onConfirm={() => {
                          dispatch.auth.deleteUser(user.title);
                        }}
                      >
                        <Button danger>Delete User</Button>
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
            <div>
              There are no users created yet.
              <br />
              <CreateUser />
            </div>
          )}
        </MainContent>
      </StyledSection>
    </PageBasic>
  );
};
