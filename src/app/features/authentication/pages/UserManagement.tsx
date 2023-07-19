import React, { useEffect } from 'react';
import PageBasic from '@app/components/PageBasic';
import { Dispatch } from '@app/store';
import { useDispatch } from 'react-redux';
import { Button, Form, Input } from 'antd';
import { UserFormType } from '../types';
import { notify } from '@app/utils/toast';

export const UserManagement = () => {
  const dispatch = useDispatch<Dispatch>();

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
    <PageBasic title="Users">
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ login: true }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
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

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            Add user
          </Button>
        </Form.Item>
      </Form>
    </PageBasic>
  );
};
